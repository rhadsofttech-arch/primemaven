'use strict';
/**
 * Primemaven site + admin dashboard. No dependencies: Node 18+ built-ins only.
 *
 * Environment variables:
 *   PORT              port to listen on (default 3000)
 *   ADMIN_PASSWORD    password for /admin (admin is disabled until set)
 *   SESSION_SECRET    long random string used to sign admin sessions
 *   GITHUB_TOKEN      token with Contents read/write on the repo (so admin saves survive redeploys)
 *   GITHUB_REPO       owner/repo (default rhadsofttech-arch/primemaven)
 *   GITHUB_BRANCH     branch (default main)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const render = require('./lib/render');
const store = require('./lib/store');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_HOURS = 12;
const PUBLIC = path.join(__dirname, 'public');
const ADMIN = path.join(__dirname, 'admin');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/* ---------------- helpers ---------------- */
function send(res, code, body, type = 'text/html; charset=utf-8', extra = {}) {
  res.writeHead(code, { ...SECURITY, 'Content-Type': type, ...extra });
  res.end(res.req.method === 'HEAD' ? undefined : body);
}
const json = (res, code, obj, extra = {}) => send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store', ...extra });
const redirect = (res, to, code = 301) => { res.writeHead(code, { ...SECURITY, Location: to }); res.end(); };
const page = (res, html, code = 200) => send(res, code, html, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });

function serveFile(req, res, root, rel, cache) {
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root + path.sep)) return false; // path traversal guard
  let st;
  try { st = fs.statSync(file); } catch { return false; }
  if (!st.isFile()) return false;
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { ...SECURITY, 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': cache });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

function readJson(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Request too large.'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('Invalid JSON.'), { code: 400 })); } });
    req.on('error', reject);
  });
}

/* ---------------- admin sessions ---------------- */
const sign = (val) => crypto.createHmac('sha256', SESSION_SECRET).update(val).digest('hex');
const makeToken = () => { const p = `admin.${Date.now() + SESSION_HOURS * 3600e3}`; return `${p}.${sign(p)}`; };
function validToken(tok) {
  if (!tok) return false;
  const i = tok.lastIndexOf('.'); const payload = tok.slice(0, i), sig = tok.slice(i + 1), good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  return Number(payload.split('.')[1]) > Date.now();
}
function getCookie(req, name) {
  const hit = (req.headers.cookie || '').split(/;\s*/).find((x) => x.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}
const isHttps = (req) => (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
const sessionCookie = (req, val, maxAge) => `pm_admin=${encodeURIComponent(val)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
const authed = (req) => validToken(getCookie(req, 'pm_admin'));
const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

const attempts = new Map();
const limited = (ip) => { const a = attempts.get(ip); return a && a.n >= 8 && a.until > Date.now(); };
function failed(ip) { const a = attempts.get(ip) || { n: 0, until: 0 }; if (a.until < Date.now()) a.n = 0; a.n += 1; a.until = Date.now() + 15 * 60e3; attempts.set(ip, a); }

/* ---------------- admin API ---------------- */
async function adminApi(req, res, route) {
  const method = req.method;
  if (route === 'session' && method === 'GET') return json(res, 200, { authed: authed(req), configured: Boolean(ADMIN_PASSWORD), github: store.ghInfo() });
  if (route === 'login' && method === 'POST') {
    if (!ADMIN_PASSWORD) return json(res, 503, { error: 'Admin is not set up yet. Add an ADMIN_PASSWORD variable on the server.' });
    const ip = clientIp(req);
    if (limited(ip)) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const body = await readJson(req, 10 * 1024);
    const a = crypto.createHash('sha256').update(String(body.password || '')).digest();
    const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
    if (!crypto.timingSafeEqual(a, b)) { failed(ip); return json(res, 401, { error: 'Wrong password.' }); }
    attempts.delete(ip);
    return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, makeToken(), SESSION_HOURS * 3600) });
  }
  if (route === 'logout' && method === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });

  // everything below needs a session
  if (!authed(req)) return json(res, 401, { error: 'Please log in again.' });
  if (method !== 'GET' && !String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'Unsupported request.' });

  if (route === 'content' && method === 'GET') return json(res, 200, store.get());
  if (route === 'content' && method === 'PUT') {
    const body = await readJson(req);
    try { return json(res, 200, { ok: true, ...(await store.save(body)) }); }
    catch (e) { return json(res, e.status ? 502 : 400, { error: e.message }); }
  }
  if (route === 'upload' && method === 'POST') {
    const { name, data } = await readJson(req);
    const m = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,(.+)$/.exec(data || '');
    if (!m) return json(res, 400, { error: 'Please upload a PNG, JPG, WebP, GIF or SVG image.' });
    const extn = { png: 'png', jpg: 'jpg', jpeg: 'jpg', webp: 'webp', gif: 'gif', 'svg+xml': 'svg' }[m[1]];
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 8 * 1024 * 1024) return json(res, 400, { error: 'Image is larger than 8 MB.' });
    const base = String(name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
    try { return json(res, 200, { ok: true, ...(await store.saveUpload(`${base}-${Date.now().toString(36)}.${extn}`, buf)) }); }
    catch (e) { return json(res, 502, { error: e.message }); }
  }
  if (route === 'reload' && method === 'POST') return json(res, 200, { ok: await store.pullLatest() });
  return json(res, 404, { error: 'Not found.' });
}

/* ---------------- router ---------------- */
const OLD_BLOG = {
  'blog-verified-listings': '/blog/why-we-verify-every-listing',
  'blog-custom-software': '/blog/off-the-shelf-or-custom-software',
  'blog-hiring-developer': '/blog/questions-before-hiring-a-developer',
};

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'Bad request', 'text/plain'); }
  const q = url.search;
  const GET = req.method === 'GET' || req.method === 'HEAD';

  // admin API
  if (p.startsWith('/admin/api/')) return adminApi(req, res, p.slice('/admin/api/'.length));

  // pick up changes saved from the dashboard on other running copies of the site
  const isAsset = /\.[a-z0-9]+$/i.test(p) && !p.endsWith('.xml') && !p.endsWith('.txt');
  if (!isAsset) await store.maybeRefresh();
  const c = store.get(), v = store.version();

  if (GET) {
    // clean URLs: drop .html / .php, index files and trailing slashes
    const m = p.match(/^(.*?)\/?(index)?\.(html?|php)$/i);
    if (m && !p.startsWith('/admin')) {
      const base = m[1].replace(/^\//, '');
      if (OLD_BLOG[base]) return redirect(res, OLD_BLOG[base] + q);
      return redirect(res, (m[1] || '/') + q);
    }
    if (p === '/admin') return redirect(res, '/admin/' + q, 302);
    if (p.length > 1 && p.endsWith('/') && !p.startsWith('/admin/')) return redirect(res, p.replace(/\/+$/, '') + q);

    // admin dashboard files
    if (p.startsWith('/admin/')) {
      const rel = p === '/admin/' ? 'index.html' : p.slice('/admin/'.length);
      if (serveFile(req, res, ADMIN, rel, 'no-store')) return;
      return page(res, render.notFound(c, v, p), 404);
    }

    // public assets
    if (/\.[a-z0-9]+$/i.test(p) && !p.endsWith('.xml') && !p.endsWith('.txt')) {
      const versioned = /[?&]v=/.test(q);
      if (serveFile(req, res, PUBLIC, p.slice(1), versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=86400')) return;
      // images uploaded from the dashboard that aren't in this deploy yet
      if (p.startsWith('/images/uploads/')) {
        const up = await store.getUpload(p.slice('/images/uploads/'.length));
        if (up) return send(res, 200, up.buf, up.type, { 'Cache-Control': 'public, max-age=86400', 'Content-Length': up.buf.length });
      }
      return page(res, render.notFound(c, v, p), 404);
    }

    // pages
    if (p === '/') return page(res, render.home(c, v));
    if (p === '/speaking') return page(res, render.speaking(c, v));
    if (p === '/gallery') return page(res, render.gallery(c, v));
    if (p === '/blog') return page(res, render.blogIndex(c, v));
    if (p.startsWith('/blog/')) {
      const post = render.published(c).find((x) => x.slug === p.slice(6));
      if (post) return page(res, render.post(c, post, v));
    }
    if (p === '/sitemap.xml') return send(res, 200, render.sitemap(c), 'application/xml; charset=utf-8');
    if (p === '/robots.txt') return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${(c.seo.siteUrl || '').replace(/\/$/, '')}/sitemap.xml\n`, 'text/plain; charset=utf-8');
    if (p === '/health') return json(res, 200, { ok: true });
    const cs = (c.caseStudies || []).find((x) => '/' + x.slug === p);
    if (cs) return page(res, render.caseStudy(c, cs, v));
    return page(res, render.notFound(c, v, p), 404);
  }
  return send(res, 405, 'Method not allowed', 'text/plain', { Allow: 'GET, HEAD' });
}

/** Request handler, usable by a normal server or by serverless hosts that import this file. */
function app(req, res) {
  handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) json(res, e.code === 413 || e.code === 400 ? e.code : 500, { error: e.code ? e.message : e.message || 'Something went wrong.' });
  });
}
module.exports = app;

if (require.main === module) {
  const server = http.createServer(app);
  store.pullLatest().finally(() => {
    server.listen(PORT, () => console.log(`Primemaven running on port ${PORT}${ADMIN_PASSWORD ? '' : ' (admin disabled: set ADMIN_PASSWORD)'}`));
  });
}
