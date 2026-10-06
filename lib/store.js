'use strict';
/**
 * Content store.
 * - Reads content/site.json from disk at start-up, then (if GitHub is configured) pulls the latest copy from the repo.
 * - Saves update the in-memory copy immediately (live site changes at once), write to disk,
 *   and commit to GitHub so changes survive redeploys.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = 'content/site.json';
const LOCAL_FILE = path.join(ROOT, CONTENT_PATH);

const GH = {
  token: process.env.GITHUB_TOKEN || '',
  repo: process.env.GITHUB_REPO || 'rhadsofttech-arch/primemaven',
  branch: process.env.GITHUB_BRANCH || 'main',
};
const ghEnabled = () => Boolean(GH.token && GH.repo);

let content = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
let version = Date.now().toString(36);

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
    const err = new Error(`GitHub ${res.status}: ${data.message || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function getSha(filePath) {
  try {
    const d = await gh('GET', `contents/${encodeURI(filePath)}?ref=${encodeURIComponent(GH.branch)}`);
    return d.sha;
  } catch (e) {
    if (e.status === 404) return undefined;
    throw e;
  }
}

/** Commit a file (Buffer or string) to the repo. */
async function commitFile(filePath, data, message) {
  const sha = await getSha(filePath);
  const b64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data, 'utf8').toString('base64');
  const r = await gh('PUT', `contents/${encodeURI(filePath)}`, { message, content: b64, branch: GH.branch, ...(sha ? { sha } : {}) });
  return r.commit && r.commit.html_url;
}

async function pullLatest() {
  if (!ghEnabled()) return false;
  try {
    const d = await gh('GET', `contents/${CONTENT_PATH}?ref=${encodeURIComponent(GH.branch)}`);
    const json = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8'));
    content = json;
    version = Date.now().toString(36);
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(json, null, 2) + '\n');
    return true;
  } catch (e) {
    console.warn('[store] Could not pull content from GitHub:', e.message);
    return false;
  }
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
  const reserved = new Set(['', 'admin', 'blog', 'speaking', 'gallery', 'css', 'js', 'images', 'sitemap.xml', 'robots.txt']);
  for (const cs of next.caseStudies || []) {
    if (!/^[a-z0-9-]+$/.test(cs.slug || '') || reserved.has(cs.slug)) throw new Error(`Case study "${cs.crumb || '?'}" needs a different slug.`);
  }
}

async function save(next) {
  validate(next);
  content = next;
  version = Date.now().toString(36);
  const text = JSON.stringify(next, null, 2) + '\n';
  fs.writeFileSync(LOCAL_FILE, text);
  if (!ghEnabled()) return { committed: false, note: 'GitHub is not configured, so this change is saved on the server only and may be lost on redeploy.' };
  const url = await commitFile(CONTENT_PATH, text, 'Update site content from admin dashboard');
  return { committed: true, url };
}

/** Save an uploaded image to public/images/uploads and commit it. Returns its public URL. */
async function saveUpload(name, buf) {
  const rel = `public/images/uploads/${name}`;
  fs.mkdirSync(path.join(ROOT, 'public/images/uploads'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), buf);
  let committed = false;
  if (ghEnabled()) { await commitFile(rel, buf, `Upload ${name} from admin dashboard`); committed = true; }
  return { url: `/images/uploads/${name}`, committed };
}

module.exports = {
  get: () => content,
  version: () => version,
  save, saveUpload, pullLatest, ghEnabled,
  ghInfo: () => ({ enabled: ghEnabled(), repo: GH.repo, branch: GH.branch }),
};
