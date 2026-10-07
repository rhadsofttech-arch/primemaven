'use strict';
/**
 * Content store. Works on normal servers AND on read-only / serverless hosts.
 *
 * - Content (content/site.json) is read from the bundled file at start-up, then the latest copy is
 *   pulled from GitHub. On each request we re-check GitHub at most once a minute, so every running
 *   instance picks up changes made from the admin dashboard.
 * - Saves update the in-memory copy (live immediately), try to write to disk (ignored if the disk
 *   is read-only) and commit to GitHub, which is the permanent copy.
 * - Uploaded images are committed to GitHub and kept in memory / the temp folder, so they show
 *   straight away even before the next deploy includes them.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = 'content/site.json';
const LOCAL_FILE = path.join(ROOT, CONTENT_PATH);
const UPLOAD_DIR = 'public/images/uploads';
const TMP_DIR = path.join(os.tmpdir(), 'primemaven-uploads');
const REFRESH_MS = 60 * 1000;

const GH = {
  token: process.env.GITHUB_TOKEN || '',
  repo: process.env.GITHUB_REPO || 'rhadsofttech-arch/primemaven',
  branch: process.env.GITHUB_BRANCH || 'main',
};
const ghEnabled = () => Boolean(GH.token && GH.repo);

let content = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
let version = Date.now().toString(36);
let contentSha = null;     // sha of site.json on GitHub when we last read or wrote it
let lastCheck = 0;
let refreshing = null;
const uploads = new Map(); // name -> { buf, type } (images uploaded since this instance started, or fetched from GitHub)

/** Write a file, but never crash if the file system is read-only. */
function tryWrite(file, data) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); return true; }
  catch (e) { return false; }
}

async function gh(method, p, body) {
  const res = await fetch(`https://api.github.com/repos/${GH.repo}/${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${GH.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'primemaven-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.message || res.statusText;
    if (res.status === 401) msg = 'The GITHUB_TOKEN is invalid or has expired. Create a new one and update the variable.';
    if (res.status === 403 || res.status === 404) msg = `The GITHUB_TOKEN can't write to ${GH.repo}. Make sure it has "Contents: Read and write" on that repository.`;
    const err = new Error(`GitHub: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function getFile(filePath) {
  try { return await gh('GET', `contents/${encodeURI(filePath)}?ref=${encodeURIComponent(GH.branch)}`); }
  catch (e) { if (e.status === 404) return null; throw e; }
}

/** Commit a file (Buffer or string) to the repo. Returns { url, sha }. */
async function commitFile(filePath, data, message, knownSha) {
  const sha = knownSha !== undefined ? knownSha : ((await getFile(filePath)) || {}).sha;
  const b64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data, 'utf8').toString('base64');
  const r = await gh('PUT', `contents/${encodeURI(filePath)}`, { message, content: b64, branch: GH.branch, ...(sha ? { sha } : {}) });
  return { url: r.commit && r.commit.html_url, sha: r.content && r.content.sha };
}

async function pullLatest() {
  if (!ghEnabled()) return false;
  lastCheck = Date.now();
  try {
    const d = await getFile(CONTENT_PATH);
    if (!d) return false;
    if (d.sha === contentSha) return true; // unchanged
    const json = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8'));
    content = json;
    contentSha = d.sha;
    version = Date.now().toString(36);
    tryWrite(LOCAL_FILE, JSON.stringify(json, null, 2) + '\n');
    return true;
  } catch (e) {
    console.warn('[store] Could not pull content from GitHub:', e.message);
    return false;
  }
}

/** Called on page requests: refresh from GitHub at most once a minute (waits only on first load). */
function maybeRefresh() {
  if (!ghEnabled() || Date.now() - lastCheck < REFRESH_MS) return Promise.resolve();
  if (!refreshing) refreshing = pullLatest().finally(() => { refreshing = null; });
  return contentSha ? Promise.resolve() : refreshing; // don't block once we have a GitHub copy
}

function validate(next) {
  const required = ['seo', 'profile', 'hero', 'about', 'projects', 'blog', 'speaking', 'gallery', 'caseStudies'];
  for (const k of required) if (!next || typeof next[k] !== 'object') throw new Error(`Missing section: ${k}`);
  const slugs = new Set();
  for (const p of next.blog.posts || []) {
    if (!/^[a-z0-9-]+$/.test(p.slug || '')) throw new Error(`Blog post "${p.title || '?'}" needs a slug with only lowercase letters, numbers and hyphens.`);
    if (slugs.has(p.slug)) throw new Error(`Two blog posts use the slug "${p.slug}".`);
    slugs.add(p.slug);
  }
  const reserved = new Set(['', 'admin', 'blog', 'speaking', 'gallery', 'css', 'js', 'images', 'sitemap.xml', 'robots.txt', 'health']);
  for (const cs of next.caseStudies || []) {
    if (!/^[a-z0-9-]+$/.test(cs.slug || '') || reserved.has(cs.slug)) throw new Error(`Case study "${cs.crumb || '?'}" needs a different slug.`);
  }
}

async function save(next) {
  validate(next);
  const text = JSON.stringify(next, null, 2) + '\n';
  if (ghEnabled()) {
    // commit first: GitHub is the permanent copy, so only report success once it's stored there
    let r;
    try { r = await commitFile(CONTENT_PATH, text, 'Update site content from admin dashboard', contentSha || undefined); }
    catch (e) {
      if (e.status !== 409 && e.status !== 422) throw e;
      r = await commitFile(CONTENT_PATH, text, 'Update site content from admin dashboard'); // sha was stale: retry with fresh sha
    }
    content = next; contentSha = r.sha || null; lastCheck = Date.now(); version = Date.now().toString(36);
    tryWrite(LOCAL_FILE, text);
    return { committed: true, url: r.url };
  }
  content = next; version = Date.now().toString(36);
  const onDisk = tryWrite(LOCAL_FILE, text);
  return { committed: false, note: onDisk
    ? 'GitHub is not configured, so this change is saved on the server only and may be lost on redeploy.'
    : 'GitHub is not configured and this server is read-only, so this change is only temporary. Add a GITHUB_TOKEN variable to keep changes.' };
}

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
const typeOf = (name) => MIME[(name.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';

/** Save an uploaded image. Returns its public URL. */
async function saveUpload(name, buf) {
  if (!ghEnabled()) {
    // without GitHub, keep it wherever we can
    const ok = tryWrite(path.join(ROOT, UPLOAD_DIR, name), buf) || tryWrite(path.join(TMP_DIR, name), buf);
    uploads.set(name, { buf, type: typeOf(name) });
    return { url: `/images/uploads/${name}`, committed: false, temporary: !ok };
  }
  await commitFile(`${UPLOAD_DIR}/${name}`, buf, `Upload ${name} from admin dashboard`, null);
  uploads.set(name, { buf, type: typeOf(name) });
  tryWrite(path.join(TMP_DIR, name), buf);
  return { url: `/images/uploads/${name}`, committed: true };
}

/**
 * Find an uploaded image that isn't in the deployed files yet:
 * memory -> temp folder -> GitHub (then cached in memory).
 */
async function getUpload(name) {
  if (!/^[a-z0-9-]+\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return null;
  if (uploads.has(name)) return uploads.get(name);
  try { const buf = fs.readFileSync(path.join(TMP_DIR, name)); const hit = { buf, type: typeOf(name) }; uploads.set(name, hit); return hit; } catch (e) { /* not cached */ }
  if (!ghEnabled()) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH.repo}/contents/${UPLOAD_DIR}/${name}?ref=${encodeURIComponent(GH.branch)}`, {
      headers: { Authorization: `Bearer ${GH.token}`, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'primemaven-admin' },
    });
    if (!res.ok) return null;
    const hit = { buf: Buffer.from(await res.arrayBuffer()), type: typeOf(name) };
    if (uploads.size > 200) uploads.delete(uploads.keys().next().value); // keep memory bounded
    uploads.set(name, hit);
    return hit;
  } catch (e) { return null; }
}

module.exports = {
  get: () => content,
  version: () => version,
  save, saveUpload, getUpload, pullLatest, maybeRefresh, ghEnabled,
  ghInfo: () => ({ enabled: ghEnabled(), repo: GH.repo, branch: GH.branch }),
};
