(function () {
  'use strict';
  /* mobile menu */
  var b = document.getElementById('burger'), m = document.getElementById('mnav');
  if (b && m) {
    var set = function (o) { b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); m.hidden = !o; };
    b.addEventListener('click', function () { set(m.hidden); });
    m.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1040) set(false); });
  }

  /* copy buttons: data-copy="#id" */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.querySelector(btn.getAttribute('data-copy')), t = el.innerText, lab = btn.textContent;
      var ok = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = lab; }, 1600); };
      var sel = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected'; };
      try { navigator.clipboard.writeText(t).then(ok, sel); } catch (e) { sel(); }
    });
  });

  /* forms -> Formspree (endpoint set in the admin dashboard) */
  var endpoint = document.body.getAttribute('data-form-endpoint') || '';
  var email = document.body.getAttribute('data-email') || '';
  document.querySelectorAll('form.js-form').forEach(function (f) {
    var st = f.querySelector('.form-status'), btn = f.querySelector('button[type=submit]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var fail = function () { st.className = 'form-status err'; st.textContent = "Your message couldn't be sent. Please email " + email + ' or use WhatsApp.'; btn.disabled = false; };
      if (!/^https:\/\//.test(endpoint)) { fail(); return; }
      btn.disabled = true; st.className = 'form-status'; st.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) return fail();
          f.reset(); st.className = 'form-status ok'; st.textContent = "Thanks! Your message has been sent. I'll reply within 24 hours."; btn.disabled = false;
        })
        .catch(fail);
    });
  });

  /* gallery */
  var g = document.getElementById('gallery');
  if (g && window.EVENTS) {
    var lb = document.getElementById('lightbox'), li = document.getElementById('lbImg'), lc = document.getElementById('lbCap');
    var label = { speaking: 'Speaking', moderating: 'Moderating', community: 'Community' };
    var txt = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
    window.EVENTS.forEach(function (ev) {
      var el = document.createElement(ev.src ? 'button' : 'div');
      el.className = 'g-item ' + (ev.size || '') + (ev.src ? '' : ' ph');
      el.dataset.type = ev.type;
      var inner = '';
      if (ev.src) {
        el.type = 'button'; el.setAttribute('aria-label', 'View photo: ' + ev.title);
        inner = '<img loading="lazy" src="' + txt(ev.src) + '" alt="' + txt(ev.title) + '">';
        el.addEventListener('click', function () { li.src = ev.src; li.alt = ev.title; lc.textContent = ev.title + (ev.detail ? ' — ' + ev.detail : ''); lb.hidden = false; });
      } else {
        inner = '<div class="cam"><svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg></div>';
      }
      el.innerHTML = inner + '<span class="pill-r">' + txt(label[ev.type] || ev.type) + '</span><div class="cap"><strong>' + txt(ev.title) + '</strong><span>' + txt(ev.detail) + '</span></div>';
      g.appendChild(el);
    });
    document.querySelectorAll('.filters button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filters button').forEach(function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
        var f = btn.dataset.f;
        g.querySelectorAll('.g-item').forEach(function (it) { it.hidden = !(f === 'all' || it.dataset.type === f); });
      });
    });
    var close = function () { lb.hidden = true; li.removeAttribute('src'); };
    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }
})();
