'use strict';
const markdown = require('./md');

/* ---------------- helpers ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const SWOOSH = '<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 14 Q 60 2 110 10 T 197 7"/></svg>';
/** Heading highlights: ==slab==  ~~swoosh~~  __blob__ */
const hl = (s) => esc(s)
  .replace(/==(.+?)==/g, '<span class="slab">$1</span>')
  .replace(/~~(.+?)~~/g, `<span class="swoosh">$1${SWOOSH}</span>`)
  .replace(/__(.+?)__/g, '<span class="blob">$1</span>');
const plain = (s) => String(s ?? '').replace(/==|~~|__/g, '');
const md = (s) => markdown(s);
const list = (a) => (Array.isArray(a) ? a : []);
const on = (v, html) => (v ? html : '');
const isExternal = (u) => /^https?:\/\//.test(u || '');
const ext = (u) => (isExternal(u) ? ' target="_blank" rel="noopener"' : '');
const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

const ICONS = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>',
  home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  map: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  zero: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  ai: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  iot: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2v5M14 2v5M10 17v5M14 17v5M2 10h5M2 14h5M17 10h5M17 14h5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM20 17v4H6.5"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  car: '<path d="M5 17h14l-1.5-6.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  star: '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24">${ICONS[name] || ICONS.star}</svg>`;
const WA_SVG = '<svg viewBox="0 0 24 24"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.96 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.13-.16.24-.63.8-.78.96-.14.17-.29.19-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43l-.75-1.82c-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.7 2.7 0 0 0-.85 2.02 4.7 4.7 0 0 0 1 2.5 10.8 10.8 0 0 0 4.13 3.65c1.54.66 2.14.72 2.9.6.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.15-1.17-.07-.1-.23-.16-.47-.28Z"/></svg>';
const LI_SVG = '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>';
const X_SVG = '<svg viewBox="0 0 24 24"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z"/></svg>';
const GH_SVG = '<svg viewBox="0 0 24 24"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>';

const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? esc(d) : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
const grad = (o, a = '#2E6BFF', b = '#0A1A42') => `linear-gradient(135deg,${esc(o.colorFrom || a)},${esc(o.colorTo || b)})`;

/* ---------------- layout ---------------- */
function head(c, o) {
  const s = c.seo, url = (s.siteUrl || '').replace(/\/$/, '') + o.path;
  const og = /^https?:/.test(s.ogImage) ? s.ogImage : (s.siteUrl || '').replace(/\/$/, '') + (s.ogImage || '/og-image.jpg');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
${on(o.keywords, `<meta name="keywords" content="${esc(o.keywords)}">`)}
<meta name="author" content="${esc(c.profile.fullName)}">
<meta name="robots" content="${o.noindex ? 'noindex' : 'index, follow, max-image-preview:large'}">
<meta name="theme-color" content="#050E26">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${esc(s.siteName)}">
<meta property="og:title" content="${esc(o.shareTitle || o.title)}">
<meta property="og:description" content="${esc(o.shareDesc || o.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(o.image || og)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_NG">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${esc(s.twitterHandle)}">
<meta name="twitter:creator" content="${esc(s.twitterHandle)}">
<meta name="twitter:title" content="${esc(o.shareTitle || o.title)}">
<meta name="twitter:description" content="${esc(o.shareDesc || o.desc)}">
<meta name="twitter:image" content="${esc(o.image || og)}">
${on(s.searchConsoleToken, `<meta name="google-site-verification" content="${esc(s.searchConsoleToken)}">`)}
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld).replace(/</g, '\\u003c')}</script>` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/css/site.css?v=${o.v}">
${on(s.googleAnalyticsId, `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(s.googleAnalyticsId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(s.googleAnalyticsId)});</script>`)}
</head>`;
}

const DESK = [['About', '#about'], ['Ventures', '#ventures'], ['Projects', '#projects'], ['Speaking', '/speaking'], ['Blog', '/blog'], ['Gallery', '/gallery']];
const MOB = [['Home', '/'], ['About', '#about'], ['Ventures', '#ventures'], ['Projects', '#projects'], ['Experience', '#experience'], ['Speaking', '/speaking'], ['Blog', '/blog'], ['Gallery', '/gallery'], ['Contact', '#contact']];
const link = (h, home) => (h.startsWith('#') ? (home ? h : '/' + h) : h);

function nav(c, cur, home) {
  const li = (items) => items.map(([l, h]) => {
    const active = h !== '/' && h.startsWith('/') && cur === h;
    return `<li><a href="${link(h, home)}"${active ? ' aria-current="page"' : ''}>${l}</a></li>`;
  }).join('\n      ');
  const p = c.profile;
  return `<nav>
  <div class="wrap">
    <a class="brand" href="${home ? '#top' : '/'}"><img class="mk-img" src="${esc(p.mark)}" alt="${esc(p.handle)} logo" width="38" height="38">${esc(p.handle)}</a>
    <ul class="nav-links">
      ${li(DESK)}
    </ul>
    <div class="nav-right">
      <a class="nav-cta" href="${link('#contact', home)}">Hire me</a>
      <button class="burger" type="button" id="burger" aria-expanded="false" aria-controls="mnav" aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
  <div class="mnav" id="mnav" hidden>
    <div class="wrap">
      <ul>
      ${li(MOB)}
      </ul>
      <div class="m-contact">${on(p.whatsapp, `<a href="https://wa.me/${esc(p.whatsapp)}" target="_blank" rel="noopener">WhatsApp me</a>`)}<a class="alt2" href="${link('#contact', home)}">Send a message</a></div>
    </div>
  </div>
</nav>`;
}

function footer(c, home) {
  const p = c.profile, cs = list(c.caseStudies);
  return `<footer>
  <div class="wrap">
    <div class="f-top">
      <div><div class="f-brand"><img src="${esc(p.logo)}" alt="${esc(p.handle)} logo" width="72" height="72"><span style="font:800 1.1rem/1.2 var(--head);color:#fff">${esc(p.handle)}</span></div>
        <p>${esc(p.footerBlurb)}</p></div>
      <div><h4>Explore</h4><ul><li><a href="${link('#about', home)}">About</a></li><li><a href="${link('#projects', home)}">Projects</a></li>${cs.map((x) => `<li><a href="/${esc(x.slug)}">${esc(x.crumb)} case study</a></li>`).join('')}<li><a href="/speaking">Speaking</a></li><li><a href="/blog">Blog</a></li><li><a href="/gallery">Gallery</a></li></ul></div>
      <div><h4>Contact</h4><ul><li>${esc(p.email)}</li>${list(p.phones).map((x) => `<li><a href="${telHref(x)}">${esc(x)}</a></li>`).join('')}${on(p.linkedin, `<li><a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a></li>`)}${on(p.x, `<li><a href="${esc(p.x)}" target="_blank" rel="noopener">X ${esc(p.xHandle)} ↗</a></li>`)}${on(p.github, `<li><a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub ↗</a></li>`)}</ul></div>
    </div>
    <div class="f-bottom"><span>© ${new Date().getFullYear()} ${esc(p.fullName)} · ${esc(p.handle)}</span><span>${list(p.titles).map(esc).join(' · ')}</span></div>
  </div>
</footer>
${on(p.whatsapp, `<a class="wa-float" href="https://wa.me/${esc(p.whatsapp)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_SVG}</a>`)}`;
}

function page(c, o, body, extraScripts = '') {
  return `${head(c, o)}
<body data-form-endpoint="${esc(c.seo.formEndpoint)}" data-email="${esc(c.profile.email)}">
${nav(c, o.cur, o.home)}
${body}
${footer(c, o.home)}
${extraScripts}
<script src="/js/site.js?v=${o.v}" defer></script>
</body>
</html>`;
}

/* ---------------- shared bits ---------------- */
const secTop = (eyebrow, heading, intro) => `<div class="sec-top">
      <div><span class="eyebrow">${esc(eyebrow)}</span><h2>${hl(heading)}</h2></div>
      ${on(intro, `<p>${intro}</p>`)}
    </div>`;
const statsStrip = (stats, label) => (list(stats).length ? `<div class="stats-wrap">
  <div class="wrap">
    <div class="stats" aria-label="${esc(label)}">
      ${list(stats).map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('\n      ')}
    </div>
  </div>
</div>` : '');
const subHero = (o) => `<header class="p-hero" id="top">
  <div class="orb a"></div>${on(o.ghost, `<div class="ghost-word" aria-hidden="true">${esc(o.ghost)}</div>`)}
  <div class="wrap">
    <div class="crumb">${o.crumb}</div>
    <h1${o.h1style ? ` style="${o.h1style}"` : ''}>${hl(o.title)}</h1>
    ${on(o.tagline, `<p class="tagline">${esc(o.tagline)}</p>`)}
    ${on(o.intro, `<p class="intro">${esc(o.intro)}</p>`)}
    ${o.extra || ''}
  </div>
  <div class="hero-angle" aria-hidden="true"></div>
</header>`;
const chips = (a) => (list(a).length ? `<div class="case-meta">${list(a).map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '');
const badgeClass = (b) => (/live|use|play/i.test(b) ? 'b-live' : /plan/i.test(b) ? 'b-plan' : 'b-build');

/* ---------------- HOME ---------------- */
function home(c, v) {
  const p = c.profile, h = c.hero, a = c.about;
  const contactForm = `<form class="form-card js-form" novalidate>
      <h3>${esc(c.contact.formTitle)}</h3>
      <p>${esc(c.contact.formIntro)}</p>
      <input type="hidden" name="_subject" value="New enquiry from ${esc(c.seo.siteName)} site">
      <div class="fgrid">
        <div class="field"><label for="c-name">Your name</label><input id="c-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="c-phone">Phone (optional)</label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="c-type">What do you need?</label><select id="c-type" name="project_type">${list(c.contact.projectTypes).map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
      </div>
      <button class="btn primary" type="submit">Send message →</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>`;

  const body = `<main>
<header class="hero" id="top">
  <div class="orb a"></div><div class="orb b"></div>
  <div class="ghost-word" aria-hidden="true">${esc(p.handle.toUpperCase())}</div>
  <div class="wrap">
    <div>
      ${on(h.status, `<span class="status"><i></i>${esc(h.status)}</span>`)}
      <h1>${esc(h.heading)}<br><span class="slab">${esc(h.highlight)}</span></h1>
      <div class="role">${list(h.chips).map((x) => `<span><b>${esc(x.icon)}</b> ${esc(x.text)}</span>`).join('')}</div>
      <p class="lede">${esc(h.lede)}</p>
      <div class="actions">
        <a class="btn primary" href="${esc(h.primaryCta.link)}"${ext(h.primaryCta.link)}>${esc(h.primaryCta.label)}</a>
        <a class="btn ghost" href="${esc(h.secondaryCta.link)}"${ext(h.secondaryCta.link)}>${esc(h.secondaryCta.label)}</a>
      </div>
      <div class="socials">
        ${on(p.linkedin, `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${LI_SVG}</a>`)}
        ${on(p.x, `<a href="${esc(p.x)}" target="_blank" rel="noopener" aria-label="X">${X_SVG}</a>`)}
        ${on(p.github, `<a href="${esc(p.github)}" target="_blank" rel="noopener" aria-label="GitHub">${GH_SVG}</a>`)}
        ${on(p.whatsapp, `<a href="https://wa.me/${esc(p.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${WA_SVG}</a>`)}
      </div>
    </div>
    <div class="card-wrap">
      <div class="ring" aria-hidden="true"></div>
      ${list(h.floatChips).slice(0, 2).map((f, i) => `<div class="float-chip c${i + 1}"><i>${esc(f.badge)}</i>${esc(f.text)}</div>`).join('\n      ')}
      <aside class="card-id" aria-label="Profile summary">
        <div class="avatar"><img src="${esc(p.photo)}" alt="${esc(p.fullName)} (${esc(p.handle)})" width="700" height="755"></div>
        <div class="id-meta">
          ${list(h.cardFacts).map((f) => `<div><span>${esc(f.label)}</span><strong>${esc(f.value)}</strong></div>`).join('\n          ')}
        </div>
      </aside>
    </div>
  </div>
  <div class="hero-angle" aria-hidden="true"></div>
</header>
${statsStrip(c.stats, 'At a glance')}

<section id="about">
  <div class="wrap about">
    <div>
      <span class="eyebrow">${esc(a.eyebrow)}</span>
      <h2 class="h2">${hl(a.heading)}</h2>
      ${md(a.body)}
    </div>
    <div class="highlights">
      ${list(a.highlights).map((x) => `<div class="hl"><div class="ic">${icon(x.icon)}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="ventures">
  <div class="wrap">
    ${secTop(c.ventures.eyebrow, c.ventures.heading, esc(c.ventures.intro))}
    <div class="vent-grid">
      ${list(c.ventures.items).map((x) => `<a class="vent ${x.style === 'blue' ? 'v-rhad' : 'v-prop'}" href="${esc(x.link)}"${ext(x.link)}>
        <span class="v-tag">${esc(x.tag)}</span>
        <h3>${esc(x.name)}</h3>
        <p>${esc(x.text)}</p>
        <ul>${list(x.points).map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
        <span class="v-go">Read case study →</span>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>

${list(c.press.items).length ? `<section class="press" aria-label="${esc(c.press.label)}">
  <div class="wrap press-row">
    <div class="press-label">${esc(c.press.label)}</div>
    <div class="press-items">
      ${list(c.press.items).map((x) => x.style === 'tedx'
        ? `<div class="pi ted"><span><b>TED<sup>x</sup></b> ${esc(x.text.replace(/^TEDx\s*/i, ''))}</span></div>`
        : x.logo ? `<div class="pi"><img src="${esc(x.logo)}" alt="${esc(x.text)}" style="max-height:44px;max-width:100%;object-fit:contain"></div>`
        : `<div class="pi${x.style === 'placeholder' ? ' ph' : ''}">${esc(x.text)}</div>`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section class="skills" id="skills">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap">
    ${secTop(c.skills.eyebrow, c.skills.heading, esc(c.skills.intro))}
    <div class="skill-grid">
      ${list(c.skills.groups).map((g) => `<div class="sk"><h3><i></i>${esc(g.name)}</h3><div class="pills">${list(g.items).map((s) => `<span class="pill">${esc(s)}</span>`).join('')}</div></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="projects">
  <div class="wrap">
    ${secTop(c.projects.eyebrow, c.projects.heading, esc(c.projects.intro))}
    <div class="proj-grid">
      ${list(c.projects.items).map((x) => `<article class="proj">
        <div class="thumb" style="--g:${grad(x)}${x.image ? `;background-image:linear-gradient(180deg,transparent 40%,rgba(5,14,38,.75)),url('${esc(x.image)}');background-size:cover;background-position:center` : ''}">${x.image ? '' : '<div class="bar"><i></i><i></i><i></i></div><div class="mock"><span></span><span><b></b><b></b><b></b></span></div>'}<div class="name"${x.image ? ' style="margin-top:auto"' : ''}>${esc(x.name)}</div></div>
        <div class="body"><div class="meta"><span>${esc(x.org)}</span><span class="badge b-${esc(x.status || 'live')}">${esc(x.statusLabel)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><div class="tags">${list(x.tags).map((t) => `<span>${esc(t)}</span>`).join('')}</div>${on(x.link, `<a class="p-link" href="${esc(x.link)}"${ext(x.link)}>Visit site ↗</a>`)}</div>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>

<section id="process">
  <div class="wrap">
    ${secTop(c.process.eyebrow, c.process.heading, esc(c.process.intro))}
    <div class="process">
      ${list(c.process.steps).map((s, i) => `<div class="ps"><div class="n">${String(i + 1).padStart(2, '0')}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${on(s.note, `<small>${esc(s.note)}</small>`)}</div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="exp" id="experience">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap">
    ${secTop(c.experience.eyebrow, c.experience.heading, '')}
    <div class="timeline">
      ${list(c.experience.items).map((j) => `<div class="job">
        <div class="when"><strong><span>${esc(j.badge)}</span></strong><br>${esc(j.label)}</div>
        <div><h3>${esc(j.title)}</h3><p class="co">${esc(j.place)}</p>
          <ul>${list(j.points).map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul></div>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="speak" id="speaking">
  <div class="wrap">
    <div class="speak-top">
      <div><span class="eyebrow">${esc(c.speakingTeaser.eyebrow)}</span><h2>${hl(c.speakingTeaser.heading)}</h2></div>
      <p>${esc(c.speakingTeaser.text)}</p>
    </div>
    <div class="roles">
      ${list(c.speakingTeaser.roles).map((r) => `<div class="rl${r.style === 'tedx' ? ' tedx' : ''}"><div class="ic">${r.style === 'tedx' ? 'TEDx' : icon(r.style)}</div><div><strong>${esc(r.title)}</strong><span>${esc(r.text)}</span></div></div>`).join('\n      ')}
    </div>
    <div class="g-cta">
      <div><strong>${esc(c.speakingTeaser.ctaTitle)}</strong><span>${esc(c.speakingTeaser.ctaText)}</span></div>
      <div class="actions" style="margin:0"><a class="btn primary" href="/speaking">Book me to speak →</a><a class="btn" style="border:1px solid var(--line);color:var(--ink)" href="/gallery">View event gallery</a></div>
    </div>
  </div>
</section>

<section id="community">
  <div class="wrap">
    ${secTop(c.community.eyebrow, c.community.heading, esc(c.community.intro))}
    <div class="community">
      <div class="comm-card">
        <span class="tag-top">${esc(c.community.cardTag)}</span>
        <h3>${esc(c.community.cardTitle)}</h3>
        <p>${esc(c.community.cardText)}</p>
        ${on(c.community.joinLink, `<a href="${esc(c.community.joinLink)}" target="_blank" rel="noopener">${esc(c.community.joinLabel)}</a>`)}
      </div>
      <div class="comm-list">
        ${list(c.community.items).map((x) => `<div class="ci"><div class="ic">${icon(x.icon)}</div><div><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div></div>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>

${list(c.testimonials.items).length ? `<section class="testi" id="testimonials">
  <div class="dots" aria-hidden="true"></div>
  <div class="wrap">
    ${secTop(c.testimonials.eyebrow, c.testimonials.heading, '')}
    <div class="t-grid">
      ${list(c.testimonials.items).map((t) => {
        const ini = String(t.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        return `<figure class="tq"${t.placeholder ? '' : ' style="border-style:solid"'}>${on(t.placeholder, '<span class="ph-tag">Placeholder · replace</span>')}<blockquote>${esc(t.quote)}</blockquote><figcaption class="who">${t.photo ? `<img class="av" src="${esc(t.photo)}" alt="" style="object-fit:cover">` : `<span class="av">${esc(ini)}</span>`}<div><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></div></figcaption></figure>`;
      }).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section id="companies">
  <div class="wrap">
    ${secTop(c.companies.eyebrow, c.companies.heading, '')}
    <div class="logos" aria-label="Company logos">
      ${list(c.companies.items).map((x) => {
        const ini = String(x.line1 || x.name).replace(/[^A-Za-z ]/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || String(x.name).slice(0, 2).toUpperCase();
        return `<div class="logo" title="${esc(x.name)}">${x.logo ? `<img src="${esc(x.logo)}" alt="${esc(x.name)} logo" loading="lazy">` : `<div class="wm"><i>${esc((x.line1 || '').slice(0, 2).toUpperCase() === ini ? ini : ini)}</i><div>${esc(x.line1)}${on(x.line2, `<small>${esc(x.line2)}</small>`)}</div></div>`}</div>`;
      }).join('\n      ')}
    </div>
  </div>
</section>

<section class="contact" id="contact">
  <div class="orb a"></div>
  <div class="wrap">
    <div>
      <span class="eyebrow">${esc(c.contact.eyebrow)}</span>
      <h2>${hl(c.contact.heading)}</h2>
      <p>${esc(c.contact.text)}</p>
      <div class="c-list">
        <div class="c-item"><div class="ic">${icon('mail')}</div><div class="tx"><span>Email</span><strong id="email">${esc(p.email)}</strong></div><button class="copy" type="button" data-copy="#email">Copy</button></div>
        ${list(p.phones).length ? `<div class="c-item"><div class="ic">${icon('tel')}</div><div class="tx"><span>Phone / WhatsApp</span><strong>${list(p.phones).map((x) => `<a href="${telHref(x)}">${esc(x)}</a>`).join(' · ')}</strong></div></div>` : ''}
        <div class="c-item"><div class="ic">${icon('pin')}</div><div class="tx"><span>Location</span><strong>${esc(p.location)}</strong></div></div>
      </div>
    </div>
    ${contactForm}
  </div>
</section>
</main>`;

  const s = c.seo;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Person', name: p.fullName, alternateName: p.handle,
    jobTitle: list(p.titles), url: s.siteUrl + '/', image: (s.siteUrl || '') + p.photo, email: 'mailto:' + p.email,
    telephone: list(p.phones)[0] ? list(p.phones)[0].replace(/\s/g, '') : undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
    worksFor: list(c.ventures.items).map((x) => ({ '@type': 'Organization', name: x.name })),
    sameAs: [p.linkedin, p.x, p.github].filter(Boolean),
  };
  return page(c, { path: '/', title: s.title, desc: s.description, keywords: s.keywords, shareTitle: s.shareTitle, shareDesc: s.shareDescription, ogType: 'profile', jsonld, cur: '/', home: true, v }, body);
}

/* ---------------- CASE STUDY ---------------- */
function block(b) {
  const alt = b.alt ? ' class="alt"' : '';
  switch (b.type) {
    case 'problem':
      return `<section>
  <div class="wrap two">
    <div><span class="eyebrow">${esc(b.eyebrow)}</span><h2 class="h2">${hl(b.heading)}</h2>${on(b.text, `<p class="lead" style="margin-top:18px">${esc(b.text)}</p>`)}</div>
    <div class="pain">${list(b.items).map((x) => `<div><b>✕</b><span>${esc(x.title)}</span></div>`).join('')}</div>
  </div>
</section>`;
    case 'verify':
      return `<section class="case">
  <div class="orb a"></div>
  <div class="wrap">
    <div class="case-head"><div><span class="eyebrow">${esc(b.eyebrow)}</span><h2>${hl(b.heading)}</h2></div><p>${esc(b.text)}</p></div>
    <div class="case-grid">
      <div class="pb">${list(b.items).map((x, i) => `<div class="pb-card sol"><h3><i>Step ${i + 1}</i>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>
      <div class="verify" aria-label="Example of a verified listing">
        <div class="vh"><strong>A verified listing</strong><span>Verified</span></div>
        <div class="listing"><div class="ph" aria-hidden="true"></div><div><h4>Example listing</h4><p>Shown only after all checks pass.</p><span class="vbadge">✓ Verified</span></div></div>
        <div class="steps3">${list(b.items).map((x, i) => `<div class="st"><b>${i + 1}</b><div><strong>${esc(x.title)}</strong><span>${esc(x.note)}</span></div><em>✓</em></div>`).join('')}</div>
      </div>
    </div>
  </div>
</section>`;
    case 'cards':
      return `<section${alt}>
  <div class="wrap">
    ${secTop(b.eyebrow, b.heading, esc(b.text))}
    <div class="cards">${list(b.items).map((x) => `<div class="cd">${on(x.badge, `<span class="badge ${badgeClass(x.badge)}">${esc(x.badge)}</span>`)}<div class="ic">${icon(x.icon)}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('')}</div>
  </div>
</section>`;
    case 'tags':
      return `<section${alt}>
  <div class="wrap two">
    <div><span class="eyebrow">${esc(b.eyebrow)}</span><h2 class="h2">${hl(b.heading)}</h2>${on(b.text, `<p class="lead" style="margin-top:18px">${esc(b.text)}</p>`)}</div>
    <div class="audience">${list(b.items).map((x) => `<span>${esc(x.title)}</span>`).join('')}</div>
  </div>
</section>`;
    case 'quote':
      return `<section${alt}>
  <div class="wrap two">
    <div><span class="eyebrow">${esc(b.eyebrow)}</span><h2 class="h2">${hl(b.heading)}</h2>${on(b.text, `<p class="lead" style="margin-top:18px">${esc(b.text)}</p>`)}</div>
    <div class="quote"><p>${esc(b.quote)}</p>${on(b.quoteBy, `<span>${esc(b.quoteBy)}</span>`)}</div>
  </div>
</section>`;
    case 'roleRoadmap':
      return `<section${alt}>
  <div class="wrap two">
    <div><span class="eyebrow">${esc(b.eyebrow)}</span><h2 class="h2">${hl(b.heading)}</h2>${on(b.text, `<p class="lead" style="margin-top:18px">${esc(b.text)}</p>`)}
      ${list(b.points).length ? `<div class="pain" style="margin-top:22px">${list(b.points).map((pt) => `<div><b style="background:#E3EBFF;color:var(--blue-600)">✓</b><span>${esc(pt)}</span></div>`).join('')}</div>` : ''}</div>
    <div><span class="eyebrow">${esc(b.roadEyebrow)}</span><h2 class="h2" style="margin-bottom:26px">${hl(b.roadHeading)}</h2>
      <div class="road">${list(b.items).map((x, i, arr) => `<div class="rd${x.done ? ' done' : ''}"${i === arr.length - 1 ? ' style="padding-bottom:0"' : ''}><small>${esc(x.note)}</small><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div>`).join('')}</div></div>
  </div>
</section>`;
    case 'text':
      return `<section${alt}><div class="wrap"><span class="eyebrow">${esc(b.eyebrow)}</span><h2 class="h2">${hl(b.heading)}</h2><div class="article" style="margin:18px 0 0;max-width:68ch">${md(b.text)}</div></div></section>`;
    default:
      return '';
  }
}

function caseStudy(c, cs, v) {
  const all = list(c.caseStudies), i = all.indexOf(cs), next = all[(i + 1) % all.length];
  const body = `<main>
${subHero({ crumb: `<a href="/">Home</a> / <a href="/#ventures">Ventures</a> / ${esc(cs.crumb)}`, ghost: cs.ghost, title: cs.title, tagline: cs.tagline, intro: cs.intro,
  extra: chips(cs.chips) + `<div class="actions">${on(cs.siteLink, `<a class="btn primary" href="${esc(cs.siteLink)}"${ext(cs.siteLink)}>${esc(cs.siteLabel)}</a>`)}<a class="btn ghost" href="/#ventures">← Back to portfolio</a></div>` })}
${statsStrip(cs.stats, cs.crumb + ' at a glance')}
${list(cs.blocks).map(block).join('\n')}
<section style="padding-top:${list(cs.blocks).length ? '0' : 'clamp(64px,9vw,104px)'}">
  <div class="wrap">
    <div class="cta-band">
      <h2>${esc(cs.ctaHeading)}</h2>
      <div class="actions"><a class="btn white" href="${esc(cs.ctaLink)}"${ext(cs.ctaLink)}>${esc(cs.ctaLabel)}</a><a class="btn ghost" href="/#contact">Contact me</a></div>
    </div>
    <div class="next-case"><a href="/#ventures">← Back to portfolio</a>${next && next !== cs ? `<a href="/${esc(next.slug)}">Next case study: ${esc(next.crumb)} →</a>` : ''}</div>
  </div>
</section>
</main>`;
  return page(c, { path: '/' + cs.slug, title: cs.seoTitle, desc: cs.seoDescription, ogType: 'article', cur: '/#ventures', v }, body);
}

/* ---------------- SPEAKING ---------------- */
function speaking(c, v) {
  const sp = c.speaking, p = c.profile;
  const body = `<main>
${subHero({ crumb: '<a href="/">Home</a> / Speaking', ghost: 'SPEAKER', title: sp.title, tagline: sp.tagline, intro: sp.intro,
  extra: chips(sp.chips) + '<div class="actions"><a class="btn primary" href="#book">Request a booking →</a><a class="btn ghost" href="#media">Bios &amp; headshots</a></div>' })}

<section id="topics">
  <div class="wrap">
    ${secTop('Talk topics', sp.topicsHeading, esc(sp.topicsIntro))}
    <div class="topics">
      ${list(sp.topics).map((t, i) => `<div class="tp"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p><div class="fmt">${list(t.formats).map((f) => `<span>${esc(f)}</span>`).join('')}</div></div>`).join('\n      ')}
    </div>
    <div class="formats">${list(sp.formats).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
  </div>
</section>

<section class="alt" id="media">
  <div class="wrap">
    ${secTop('Media kit', 'Bios and ==headshots==', 'Free for event programmes, posters and announcements.')}
    <div class="two">
      <div class="bio"><header><strong>Short bio</strong><button class="copy2" type="button" data-copy="#bio-short">Copy</button></header><div id="bio-short"><p>${esc(sp.shortBio)}</p></div></div>
      <div class="bio"><header><strong>Long bio</strong><button class="copy2" type="button" data-copy="#bio-long">Copy</button></header><div id="bio-long">${md(sp.longBio)}</div></div>
    </div>
    <div class="media" style="margin-top:22px">
      <div class="mk"><div class="im"><img src="${esc(p.photo)}" alt="Headshot of ${esc(p.shortName)}"></div><div class="t"><strong>Headshot (photo)</strong><a href="${esc(p.photo)}" download>Download</a></div></div>
      <div class="mk"><div class="im contain"><img src="${esc(p.logo)}" alt="${esc(p.handle)} logo"></div><div class="t"><strong>${esc(p.handle)} logo</strong><a href="${esc(p.logo)}" download>Download</a></div></div>
      <div class="mk"><div class="im" style="background:linear-gradient(135deg,var(--navy-900),var(--blue-600));color:#fff;display:grid;place-items:center;text-align:center;padding:20px"><div><strong style="font:800 1.2rem/1.3 var(--head)">Need something else?</strong><p style="margin:8px 0 0;color:#C7D3F2;font-size:.9rem">High-resolution photos, a talk abstract or a pre-event call.</p></div></div><div class="t"><strong>Just ask</strong><a href="#book">Contact →</a></div></div>
    </div>
  </div>
</section>

<section id="past">
  <div class="wrap">
    ${secTop('Past events', "Where I've spoken", '<a href="/gallery" style="color:var(--blue-600);font-weight:700">See photos in the gallery →</a>')}
    <div class="ev-list">
      ${list(sp.pastEvents).map((e) => `<div class="ev${e.placeholder ? ' ph' : ''}"><small>${esc(e.kind)}</small><div><strong>${esc(e.title)}</strong><span>${esc(e.detail)}</span></div><span class="badge ${/moder/i.test(e.role) ? 'b-plan' : /lead|host/i.test(e.role) ? 'b-live' : 'b-build'}">${esc(e.role)}</span></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="case" id="book">
  <div class="orb a"></div>
  <div class="wrap two" style="align-items:center">
    <div>
      <span class="eyebrow">Booking</span>
      <h2 style="font-weight:800;font-size:clamp(2rem,4.4vw,3rem);line-height:1.12;letter-spacing:-.03em;margin-top:16px">${hl(sp.bookingHeading)}</h2>
      <p style="color:#B9C6E6;font-size:1.05rem;margin-top:16px;max-width:46ch">${esc(sp.bookingText)}</p>
    </div>
    <form class="form-card js-form" novalidate>
      <h3>Speaking request</h3>
      <p>All fields marked * are required.</p>
      <input type="hidden" name="_subject" value="Speaking request from ${esc(c.seo.siteName)} site">
      <div class="fgrid">
        <div class="field"><label for="b-name">Your name *</label><input id="b-name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="b-email">Email *</label><input id="b-email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="b-org">Organisation *</label><input id="b-org" name="organisation" required autocomplete="organization"></div>
        <div class="field"><label for="b-event">Event name *</label><input id="b-event" name="event" required></div>
        <div class="field"><label for="b-date">Event date</label><input id="b-date" name="date" type="date"></div>
        <div class="field"><label for="b-format">Format</label><select id="b-format" name="format">${['Keynote', 'Panel discussion', 'Moderation', 'Fireside chat', 'Workshop', 'Other'].map((x) => `<option>${x}</option>`).join('')}</select></div>
        <div class="field"><label for="b-loc">Location</label><input id="b-loc" name="location" placeholder="City, or virtual"></div>
        <div class="field"><label for="b-size">Audience size</label><input id="b-size" name="audience_size" placeholder="e.g. 200"></div>
        <div class="field full"><label for="b-msg">About the event *</label><textarea id="b-msg" name="message" required placeholder="Theme, audience and what you'd like me to speak about"></textarea></div>
      </div>
      <button class="btn primary" type="submit">Send request →</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
</main>`;
  return page(c, { path: '/speaking', title: sp.seoTitle, desc: sp.seoDescription, cur: '/speaking', v }, body);
}

/* ---------------- GALLERY ---------------- */
function gallery(c, v) {
  const g = c.gallery;
  const body = `<main>
${subHero({ crumb: '<a href="/">Home</a> / Gallery', ghost: 'GALLERY', title: 'Event ==Gallery==', intro: g.intro })}
<section style="padding-block:clamp(40px,6vw,72px)">
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter event photos">
      <button type="button" data-f="all" aria-pressed="true">All events</button>
      <button type="button" data-f="speaking" aria-pressed="false">Speaking</button>
      <button type="button" data-f="moderating" aria-pressed="false">Moderating</button>
      <button type="button" data-f="community" aria-pressed="false">Community</button>
    </div>
    <div class="gallery" id="gallery" aria-live="polite"></div>
  </div>
</section>
</main>
<div class="lightbox" id="lightbox" hidden><button type="button" id="lbClose" aria-label="Close photo">✕</button><figure><img id="lbImg" alt=""><figcaption id="lbCap"></figcaption></figure></div>`;
  const data = `<script>window.EVENTS=${JSON.stringify(list(g.events)).replace(/</g, '\\u003c')};</script>`;
  return page(c, { path: '/gallery', title: g.seoTitle, desc: g.seoDescription, cur: '/gallery', v }, body, data);
}

/* ---------------- BLOG ---------------- */
const published = (c) => list(c.blog.posts).filter((p) => p.published !== false).sort((a, b) => String(b.date).localeCompare(String(a.date)));
const postCard = (p, short) => `<a class="post-card" href="/blog/${esc(p.slug)}">
        <div class="cover" style="--g:${grad(p)}${p.cover ? `;background-image:linear-gradient(180deg,transparent 50%,rgba(5,14,38,.6)),url('${esc(p.cover)}');background-size:cover;background-position:center` : ''}"><span>${esc(p.tag)}</span></div>
        <div class="pc"><div class="meta">${short ? '' : fmtDate(p.date) + ' · '}${esc(p.minutes)} min read</div><h3>${esc(p.title)}</h3>${short ? '' : `<p>${esc(p.excerpt)}</p>`}<span class="more">Read article →</span></div>
      </a>`;

function blogIndex(c, v) {
  const posts = published(c);
  const body = `<main>
${subHero({ crumb: '<a href="/">Home</a> / Blog', ghost: 'BLOG', title: 'Insights &amp; ==ideas==', intro: c.blog.intro })}
<section>
  <div class="wrap">
    ${posts.length ? `<div class="posts">${posts.map((p) => postCard(p)).join('\n')}</div>` : '<p class="lead">New articles are on the way. Check back soon.</p>'}
  </div>
</section>
</main>`;
  return page(c, { path: '/blog', title: c.blog.seoTitle, desc: c.blog.seoDescription, cur: '/blog', v }, body);
}

function post(c, p, v) {
  const p0 = c.profile, others = published(c).filter((o) => o.slug !== p.slug).slice(0, 3);
  const byline = `<div class="byline"><img src="${esc(p0.photo)}" alt="${esc(p0.shortName)}"><div><strong>${esc(p0.shortName)}</strong><span>${fmtDate(p.date)} · ${esc(p.minutes)} min read</span></div></div>`;
  const body = `<main>
${subHero({ crumb: `<a href="/">Home</a> / <a href="/blog">Blog</a> / ${esc(p.tag)}`, title: p.title, intro: p.excerpt, extra: byline, h1style: 'font-size:clamp(2rem,5vw,3.4rem);max-width:22ch' })}
<section>
  <div class="wrap">
    <article class="article">
      ${p.cover ? `<img src="${esc(p.cover)}" alt="" style="width:100%;border-radius:18px;margin-bottom:28px">` : ''}
      ${md(p.body)}
      <div class="author-box"><img src="${esc(p0.photo)}" alt="${esc(p0.shortName)}"><div><strong>${esc(p0.shortName)} (${esc(p0.handle)})</strong><p>${list(p0.titles).map(esc).join(', ')}.</p></div></div>
    </article>
  </div>
</section>
${others.length ? `<section class="alt">
  <div class="wrap">
    ${secTop('Keep reading', 'More articles', '<a href="/blog" style="color:var(--blue-600);font-weight:700">All articles →</a>')}
    <div class="posts" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${others.map((o) => postCard(o, true)).join('\n')}</div>
  </div>
</section>` : ''}
</main>`;
  const jsonld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.date, author: { '@type': 'Person', name: p0.fullName, url: c.seo.siteUrl + '/' } };
  return page(c, { path: '/blog/' + p.slug, title: p.title + ' | ' + c.seo.siteName, desc: p.excerpt, ogType: 'article', image: p.cover ? (/^https?:/.test(p.cover) ? p.cover : c.seo.siteUrl + p.cover) : '', jsonld, cur: '/blog', v }, body);
}

function notFound(c, v) {
  const body = `<main>
${subHero({ crumb: '<a href="/">Home</a>', title: 'Page ==not found==', intro: "The page you're looking for doesn't exist or has moved.", extra: '<div class="actions"><a class="btn primary" href="/">Go to the home page</a><a class="btn ghost" href="/blog">Read the blog</a></div>' })}
</main>`;
  return page(c, { path: '/404', title: 'Page not found | ' + c.seo.siteName, desc: 'Page not found.', noindex: true, cur: '', v }, body);
}

function sitemap(c) {
  const base = (c.seo.siteUrl || '').replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ...list(c.caseStudies).map((x) => ['/' + x.slug, '0.8']), ['/speaking', '0.8'], ['/blog', '0.7'], ['/gallery', '0.6'], ...published(c).map((p) => ['/blog/' + p.slug, '0.6'])];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${esc(base + u)}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
}

module.exports = { home, caseStudy, speaking, gallery, blogIndex, post, notFound, sitemap, published };
