(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k != null) n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return n;
  };

  var state = null, saved = '', current = null, uid = 0;
  var openItems = {}; // remembers which list items are expanded

  /* ---------------- api ---------------- */
  function api(method, url, body) {
    return fetch('/admin/api/' + url, {
      method: method, credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== 'login') { showLogin('Your session has ended. Please log in again.'); throw new Error('Please log in again.'); }
        if (!r.ok) throw new Error(d.error || ('Request failed (' + r.status + ')'));
        return d;
      });
    });
  }

  var toastT;
  function toast(msg, err, html) {
    var t = $('#toast'); t.className = 'toast' + (err ? ' err' : '');
    if (html) t.innerHTML = msg; else t.textContent = msg;
    t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, err ? 7000 : 4000);
  }

  /* ---------------- path helpers ---------------- */
  function getPath(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
  function setDirty() {
    var d = JSON.stringify(state) !== saved;
    $('#dirty').hidden = !d; $('#saveBtn').disabled = !d;
  }

  /* ---------------- login ---------------- */
  function showLogin(msg) {
    $('#app').hidden = true; $('#login').hidden = false;
    if (msg) $('#loginMsg').textContent = msg;
    setTimeout(function () { $('#pw').focus(); }, 50);
  }
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('#loginBtn'); btn.disabled = true; $('#loginErr').textContent = '';
    api('POST', 'login', { password: $('#pw').value }).then(function () { $('#pw').value = ''; boot(); })
      .catch(function (er) { $('#loginErr').textContent = er.message; })
      .finally(function () { btn.disabled = false; });
  });
  $('#logout').addEventListener('click', function () {
    if (JSON.stringify(state) !== saved && !window.confirm('You have unsaved changes. Log out anyway?')) return;
    api('POST', 'logout').then(function () { saved = JSON.stringify(state); showLogin('You have logged out.'); });
  });

  /* ---------------- boot ---------------- */
  var gh = { enabled: false };
  function boot() {
    api('GET', 'session').then(function (s) {
      gh = s.github || gh;
      if (!s.configured) { showLogin('Admin is not set up yet. Add an ADMIN_PASSWORD variable on your server, then reload this page.'); $('#loginBtn').disabled = true; return; }
      if (!s.authed) return showLogin();
      return api('GET', 'content').then(function (c) {
        state = c; saved = JSON.stringify(c);
        $('#login').hidden = true; $('#app').hidden = false;
        buildNav(); go((location.hash || '#overview').slice(1)); setDirty();
      });
    }).catch(function (e) { if (!/log in/i.test(e.message)) toast(e.message, true); });
  }

  /* ---------------- navigation ---------------- */
  function buildNav() {
    var nav = $('#sideNav'); nav.innerHTML = '';
    var groups = {};
    SCHEMA.forEach(function (s) {
      if (!groups[s.group]) { groups[s.group] = el('div', { class: 'nav-group' }, [el('h3', { text: s.group })]); nav.appendChild(groups[s.group]); }
      groups[s.group].appendChild(el('button', { class: 'nav-item', type: 'button', 'data-id': s.id, onclick: function () { go(s.id); closeSide(); } }, [el('span', { class: 'i', text: s.icon }), s.title]));
    });
  }
  function go(id) {
    var sec = SCHEMA.find(function (s) { return s.id === id; }) || SCHEMA[0];
    current = sec;
    if (location.hash.slice(1) !== sec.id) history.replaceState(null, '', '#' + sec.id);
    document.querySelectorAll('.nav-item').forEach(function (b) { b.setAttribute('aria-current', b.getAttribute('data-id') === sec.id ? 'page' : 'false'); });
    $('#tbGroup').textContent = sec.group; $('#tbTitle').textContent = sec.title;
    $('#viewLink').href = sec.view || '/';
    renderSection(sec);
    $('.content').scrollTop = 0; window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { if (state) go(location.hash.slice(1)); });
  function closeSide() { $('#side').classList.remove('open'); }
  $('#openSide').addEventListener('click', function () { $('#side').classList.add('open'); });
  $('#closeSide').addEventListener('click', closeSide);

  /* ---------------- sections ---------------- */
  function renderSection(sec) {
    var root = $('#content'); root.innerHTML = '';
    if (sec.special === 'overview') return renderOverview(root);
    var data = getPath(state, sec.path);
    if (sec.listRoot) {
      var panel = el('div', { class: 'panel' });
      panel.appendChild(listEditor(data, { fields: sec.fields, itemLabel: sec.itemLabel, newItem: sec.newItem, viewItem: sec.viewItem, addLabel: 'Add ' + sec.title.replace(/s$/, '').toLowerCase() }, sec.id));
      root.appendChild(panel);
    } else {
      var p = el('div', { class: 'panel' });
      renderFields(p, data, sec.fields, sec.id, null);
      root.appendChild(p);
    }
  }

  function renderOverview(root) {
    var posts = (state.blog.posts || []);
    var photos = (state.gallery.events || []).filter(function (e) { return e.src; }).length;
    root.appendChild(el('div', { class: 'note ' + (gh.enabled ? 'ok' : 'warn'), html: gh.enabled
      ? '✓ Saving is connected to GitHub (<b>' + gh.repo + '</b>, branch <b>' + gh.branch + '</b>). Every save is published instantly and backed up to your repo.'
      : '⚠ GitHub saving is not connected. Changes go live but may be lost when the site is redeployed. Add a <b>GITHUB_TOKEN</b> variable on your server to fix this.' }));
    var ov = el('div', { class: 'ov-grid' });
    [[ (state.projects.items || []).length, 'Projects' ], [ posts.filter(function (p) { return p.published !== false; }).length, 'Published posts' ], [ posts.filter(function (p) { return p.published === false; }).length, 'Draft posts' ], [ photos + ' / ' + (state.gallery.events || []).length, 'Gallery photos added' ], [ (state.testimonials.items || []).filter(function (t) { return !t.placeholder; }).length, 'Real testimonials' ]]
      .forEach(function (x) { ov.appendChild(el('div', { class: 'ov' }, [el('b', { text: String(x[0]) }), el('span', { text: x[1] })])); });
    root.appendChild(ov);
    var p = el('div', { class: 'panel' }, [el('h2', { text: 'Quick actions' }), el('p', { class: 'lead', text: 'Pick what you want to update. Changes go live when you click "Save & publish".' })]);
    var q = el('div', { class: 'quick' });
    [['✎', 'Write a blog post', 'Add or edit articles', 'blog'], ['🖼', 'Add event photos', 'Update the gallery', 'gallery'], ['🗂', 'Update projects', 'Add screenshots and links', 'projects'], ['❝', 'Add testimonials', 'Replace the placeholders', 'testimonials'], ['🎙', 'Speaker page', 'Topics, bios, past events', 'speaking'], ['⚙', 'SEO & integrations', 'Forms, analytics, Google', 'seo']]
      .forEach(function (x) { q.appendChild(el('button', { type: 'button', onclick: function () { go(x[3]); } }, [el('i', { text: x[0] }), el('div', {}, [el('strong', { text: x[1] }), el('small', { text: x[2] })])])); });
    p.appendChild(q); root.appendChild(p);
    var tips = el('div', { class: 'panel' }, [el('h2', { text: 'Tips' }), el('p', { class: 'lead', html: 'In headings, wrap words to highlight them: <code>==word==</code> blue block, <code>~~word~~</code> underline swoosh, <code>__word__</code> soft shape.<br>Press <b>Ctrl+S</b> (or <b>⌘S</b>) to save from anywhere.' })]);
    root.appendChild(tips);
  }

  /* ---------------- fields ---------------- */
  function visible(f, obj, parent) {
    if (f.showIf && obj && f.showIf.indexOf(obj.type) === -1) return false;
    if (f.showIfParent && parent && f.showIfParent.indexOf(parent.type) === -1) return false;
    return true;
  }
  function renderFields(container, obj, fields, key, parent) {
    fields.forEach(function (f) {
      if (!visible(f, obj, parent)) return;
      container.appendChild(field(obj, f, key + '.' + f.key, function () {
        // re-render when a field that controls visibility changes
        if (f.key === 'type') { var c2 = container; c2.innerHTML = ''; renderFields(c2, obj, fields, key, parent); }
      }, obj));
    });
  }

  function wrap(f, input, id) {
    var w = el('div', { class: 'field' });
    w.appendChild(f.type === 'bool' ? el('span') : el('label', { for: id, text: f.label }));
    w.appendChild(input);
    if (f.help) w.appendChild(el('div', { class: 'help', text: f.help }));
    return w;
  }

  function field(obj, f, key, onType, self) {
    var id = 'f' + (++uid), v = obj[f.key];
    var change = function (val) { obj[f.key] = val; setDirty(); };
    switch (f.type) {
      case 'textarea':
        return wrap(f, el('textarea', { id: id, oninput: function (e) { change(e.target.value); } }, [v || '']), id);
      case 'number':
        return wrap(f, el('input', { id: id, type: 'number', min: '0', value: v == null ? '' : v, oninput: function (e) { change(e.target.value === '' ? '' : Number(e.target.value)); } }), id);
      case 'date':
        return wrap(f, el('input', { id: id, type: 'date', value: v || '', oninput: function (e) { change(e.target.value); } }), id);
      case 'url':
        return wrap(f, el('input', { id: id, type: 'text', inputmode: 'url', value: v || '', placeholder: 'https://… or /page', oninput: function (e) { change(e.target.value.trim()); } }), id);
      case 'bool': {
        var cb = el('input', { id: id, type: 'checkbox', onchange: function (e) { change(e.target.checked); } });
        cb.checked = v !== false && v !== undefined && v !== '' ? Boolean(v) : false;
        return wrap(f, el('label', { class: 'check', for: id }, [cb, f.label]), id);
      }
      case 'select': {
        var s = el('select', { id: id, onchange: function (e) { change(e.target.value); if (onType) onType(); } });
        f.options.forEach(function (o, i) { var op = el('option', { value: o, text: (f.optionLabels && f.optionLabels[i]) || o || '(none)' }); if (o === (v || '')) op.selected = true; s.appendChild(op); });
        return wrap(f, s, id);
      }
      case 'color': {
        var txt = el('input', { id: id, type: 'text', value: v || '', style: 'max-width:140px', oninput: function (e) { change(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) pick.value = e.target.value; } });
        var pick = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#2e6bff', oninput: function (e) { txt.value = e.target.value.toUpperCase(); change(txt.value); } });
        return wrap(f, el('div', { class: 'color' }, [pick, txt]), id);
      }
      case 'tags': return wrap(f, f.long ? linesInput(obj, f, id) : tagsInput(obj, f, id), id);
      case 'image': return wrap(f, imageInput(obj, f, id), id);
      case 'markdown': return wrap(f, markdownInput(obj, f, id), id);
      case 'object': {
        if (!obj[f.key] || typeof obj[f.key] !== 'object') obj[f.key] = {};
        var box = el('div', { class: 'obj' }); renderFields(box, obj[f.key], f.fields, key, obj);
        var w = el('div', { class: 'field' }, [el('span', { class: 'lbl', text: f.label }), box]); return w;
      }
      case 'list': {
        if (!Array.isArray(obj[f.key])) obj[f.key] = [];
        var lw = el('div', { class: 'field sub' }, [el('span', { class: 'lbl', text: f.label })]);
        lw.appendChild(listEditor(obj[f.key], { fields: f.fields, itemLabel: f.itemLabel, addLabel: f.addLabel || 'Add item', parent: self }, key));
        if (f.help) lw.appendChild(el('div', { class: 'help', text: f.help }));
        return lw;
      }
      default: { // text
        var inp = el('input', { id: id, type: 'text', value: v == null ? '' : v, oninput: function (e) { change(e.target.value); } });
        var control = inp;
        if (f.prefix) control = el('div', { class: 'prefix' }, [el('span', { text: f.prefix }), inp]);
        if (f.slugFrom) {
          control = el('div', { class: 'row' }, [control, el('button', { type: 'button', class: 'btn ghost small', text: 'Generate from title', onclick: function () {
            inp.value = slugify(obj[f.slugFrom] || ''); change(inp.value);
          } })]);
          control.firstChild.style.flex = '1';
        }
        if (f.key === 'slug') inp.addEventListener('blur', function () { inp.value = slugify(inp.value); change(inp.value); });
        return wrap(f, control, id);
      }
    }
  }
  function slugify(s) { return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

  function tagsInput(obj, f, id) {
    if (!Array.isArray(obj[f.key])) obj[f.key] = [];
    var arr = obj[f.key], box = el('div', { class: 'tags' });
    var input = el('input', { id: id, type: 'text', placeholder: 'Type and press Enter' });
    function draw() {
      box.querySelectorAll('.tag').forEach(function (t) { t.remove(); });
      arr.forEach(function (t, i) {
        box.insertBefore(el('span', { class: 'tag' }, [t, el('button', { type: 'button', 'aria-label': 'Remove ' + t, text: '✕', onclick: function () { arr.splice(i, 1); setDirty(); draw(); } })]), input);
      });
    }
    function add() { var val = input.value.trim().replace(/,$/, ''); if (val) { arr.push(val); setDirty(); draw(); } input.value = ''; }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
      else if (e.key === 'Backspace' && !input.value && arr.length) { arr.pop(); setDirty(); draw(); }
    });
    input.addEventListener('blur', add);
    box.appendChild(input); draw();
    box.addEventListener('click', function (e) { if (e.target === box) input.focus(); });
    return box;
  }
  function linesInput(obj, f, id) {
    if (!Array.isArray(obj[f.key])) obj[f.key] = [];
    var ta = el('textarea', { id: id, placeholder: 'One per line' }, [obj[f.key].join('\n')]);
    ta.addEventListener('input', function () { obj[f.key] = ta.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); setDirty(); });
    var w = el('div', {}, [ta, el('div', { class: 'help', text: 'One per line.' })]);
    return w;
  }

  /* image upload with client-side resize */
  function imageInput(obj, f, id) {
    var prev = el('div', { class: 'img-prev' });
    var url = el('input', { id: id, type: 'text', value: obj[f.key] || '', placeholder: '/images/… or https://…' });
    function draw() { prev.innerHTML = ''; if (obj[f.key]) prev.appendChild(el('img', { src: obj[f.key], alt: '' })); else prev.textContent = 'No image'; }
    url.addEventListener('input', function () { obj[f.key] = url.value.trim(); setDirty(); draw(); });
    var file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', 'aria-label': 'Upload image' });
    var upBtn = el('span', { class: 'btn ghost small upl' }, ['Upload image', file]);
    file.addEventListener('change', function () {
      var fl = file.files[0]; if (!fl) return;
      upBtn.firstChild.textContent = 'Uploading…';
      prepare(fl).then(function (dataUrl) { return api('POST', 'upload', { name: fl.name, data: dataUrl }); })
        .then(function (r) {
          obj[f.key] = r.url; url.value = r.url; setDirty(); draw();
          toast(r.committed ? 'Image uploaded. Click "Save & publish" to use it on the site.' : 'Image uploaded to the server (not backed up to GitHub). Click "Save & publish".', !r.committed);
        })
        .catch(function (e) { toast(e.message, true); })
        .finally(function () { upBtn.firstChild.textContent = 'Upload image'; file.value = ''; });
    });
    var clear = el('button', { type: 'button', class: 'btn ghost small', text: 'Remove', onclick: function () { obj[f.key] = ''; url.value = ''; setDirty(); draw(); } });
    draw();
    return el('div', { class: 'img-field' }, [prev, el('div', {}, [url, el('div', { class: 'row' }, [upBtn, clear])])]);
  }
  function prepare(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onerror = function () { reject(new Error('Could not read that file.')); };
      r.onload = function () {
        var data = r.result;
        if (/svg|gif/.test(file.type)) return resolve(data);
        var img = new Image();
        img.onload = function () {
          var max = 2000, w = img.width, h = img.height;
          if (w <= max && h <= max && file.size < 1.5e6) return resolve(data);
          var k = Math.min(1, max / Math.max(w, h)), cv = document.createElement('canvas');
          cv.width = Math.round(w * k); cv.height = Math.round(h * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
        };
        img.onerror = function () { reject(new Error('That file is not a valid image.')); };
        img.src = data;
      };
      r.readAsDataURL(file);
    });
  }

  /* markdown editor with toolbar + preview */
  function markdownInput(obj, f, id) {
    var ta = el('textarea', { id: id, class: 'md' + (f.tall ? ' tall' : '') }, [obj[f.key] || '']);
    var prev = el('div', { class: 'md-prev', hidden: true });
    ta.addEventListener('input', function () { obj[f.key] = ta.value; setDirty(); });
    function wrapSel(before, after, ph) {
      var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || ph;
      ta.setRangeText(before + sel + after, s, e, 'end'); ta.focus(); obj[f.key] = ta.value; setDirty();
    }
    function linePrefix(pre) {
      var s = ta.selectionStart, start = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.setRangeText(pre, start, start, 'end'); ta.focus(); obj[f.key] = ta.value; setDirty();
    }
    var tog = el('button', { type: 'button', text: 'Preview', onclick: function () {
      var showing = !prev.hidden; prev.hidden = showing; ta.hidden = !showing; tog.textContent = showing ? 'Preview' : 'Edit';
      if (!showing) prev.innerHTML = mdRender(ta.value);
    } });
    var bar = el('div', { class: 'md-bar' }, [
      el('button', { type: 'button', text: 'B', title: 'Bold', onclick: function () { wrapSel('**', '**', 'bold text'); } }),
      el('button', { type: 'button', html: '<i>I</i>', title: 'Italic', onclick: function () { wrapSel('*', '*', 'italic text'); } }),
      el('button', { type: 'button', text: 'Link', onclick: function () { wrapSel('[', '](https://)', 'link text'); } }),
      el('button', { type: 'button', text: 'Heading', onclick: function () { linePrefix('## '); } }),
      el('button', { type: 'button', text: '• List', onclick: function () { linePrefix('- '); } }),
      el('button', { type: 'button', text: '1. List', onclick: function () { linePrefix('1. '); } }),
      el('button', { type: 'button', text: '❝ Quote', onclick: function () { linePrefix('> '); } }),
      el('span', { class: 'sp' }), tog
    ]);
    return el('div', { style: 'display:grid;gap:8px' }, [bar, ta, prev]);
  }
  function mdEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mdInline(s) {
    return mdEsc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
  }
  function mdRender(src) {
    var L = String(src || '').split('\n'), out = [], i = 0, m, buf;
    while (i < L.length) {
      var l = L[i];
      if (!l.trim()) { i++; continue; }
      if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) { var n = Math.max(2, m[1].length); out.push('<h' + n + '>' + mdInline(m[2]) + '</h' + n + '>'); i++; continue; }
      if (/^>\s?/.test(l)) { buf = []; while (i < L.length && /^>\s?/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, '')); out.push('<blockquote>' + mdInline(buf.join(' ')) + '</blockquote>'); continue; }
      if (/^\s*[-*]\s+/.test(l)) { buf = []; while (i < L.length && /^\s*[-*]\s+/.test(L[i])) buf.push('<li>' + mdInline(L[i++].replace(/^\s*[-*]\s+/, '')) + '</li>'); out.push('<ul>' + buf.join('') + '</ul>'); continue; }
      if (/^\s*\d+[.)]\s+/.test(l)) { buf = []; while (i < L.length && /^\s*\d+[.)]\s+/.test(L[i])) buf.push('<li>' + mdInline(L[i++].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'); out.push('<ol>' + buf.join('') + '</ol>'); continue; }
      buf = []; while (i < L.length && L[i].trim() && !/^(#{1,4}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(L[i])) buf.push(L[i++]);
      out.push('<p>' + mdInline(buf.join(' ')) + '</p>');
    }
    return out.join('');
  }

  /* ---------------- list editor ---------------- */
  function blank(fields) {
    var o = {};
    fields.forEach(function (f) { o[f.key] = f.type === 'list' || f.type === 'tags' ? [] : f.type === 'bool' ? false : f.type === 'object' ? blank(f.fields) : f.type === 'select' ? f.options[0] : ''; });
    return o;
  }
  function listEditor(arr, opt, key) {
    var box = el('div', {});
    var listEl = el('div', { class: 'list' });
    function label(it, i) {
      var t = it && opt.itemLabel ? it[opt.itemLabel] : '';
      t = String(t || '').replace(/==|~~|__/g, '');
      if (it && it.type && opt.fields.some(function (f) { return f.key === 'type'; })) {
        var tf = opt.fields.find(function (f) { return f.key === 'type'; });
        var ix = tf.options.indexOf(it.type); return [t || 'Untitled', (tf.optionLabels && tf.optionLabels[ix]) || it.type];
      }
      if (it && it.published === false) return [t || 'Item ' + (i + 1), 'Draft'];
      return [t || 'Item ' + (i + 1), ''];
    }
    function draw() {
      listEl.innerHTML = '';
      arr.forEach(function (it, i) {
        var k = key + '[' + i + ']';
        var item = el('div', { class: 'item' + (openItems[k] ? ' open' : '') });
        var lb = label(it, i);
        var del = el('button', { type: 'button', title: 'Delete', text: '🗑', class: 'del', onclick: function (e) {
          e.stopPropagation();
          if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'Delete?'; setTimeout(function () { del.classList.remove('armed'); del.textContent = '🗑'; }, 3000); return; }
          arr.splice(i, 1); shiftOpen(key, i, -1); setDirty(); draw();
        } });
        var tools = el('div', { class: 'tools' }, [
          opt.viewItem ? el('button', { type: 'button', title: 'View on site', text: '↗', onclick: function (e) { e.stopPropagation(); window.open(opt.viewItem(it), '_blank', 'noopener'); } }) : null,
          el('button', { type: 'button', title: 'Move up', text: '↑', disabled: i === 0, onclick: function (e) { e.stopPropagation(); if (!i) return; var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; swapOpen(key, i, i - 1); setDirty(); draw(); } }),
          el('button', { type: 'button', title: 'Move down', text: '↓', disabled: i === arr.length - 1, onclick: function (e) { e.stopPropagation(); if (i === arr.length - 1) return; var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; swapOpen(key, i, i + 1); setDirty(); draw(); } }),
          el('button', { type: 'button', title: 'Duplicate', text: '⧉', onclick: function (e) { e.stopPropagation(); var copy = JSON.parse(JSON.stringify(it)); if (copy.slug) copy.slug += '-copy'; arr.splice(i + 1, 0, copy); shiftOpen(key, i + 1, 1); setDirty(); draw(); } }),
          del
        ]);
        var head = el('div', { class: 'item-head', role: 'button', tabindex: '0', 'aria-expanded': openItems[k] ? 'true' : 'false', onclick: function () { toggle(); }, onkeydown: function (e) { if (e.target === head && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(); } } },
          [el('span', { class: 'chev', text: '›' }), el('span', { class: 'num', text: String(i + 1) }), el('span', { class: 'ttl' }, [lb[0], lb[1] ? el('small', { text: lb[1] }) : null]), tools]);
        var body = el('div', { class: 'item-body' });
        var rendered = false;
        function fill() { if (rendered) return; rendered = true; renderFields(body, it, opt.fields, k, opt.parent); body.addEventListener('input', function () { var nl = label(it, i); head.querySelector('.ttl').firstChild.nodeValue = nl[0]; }); }
        function toggle() { openItems[k] = !openItems[k]; item.classList.toggle('open', openItems[k]); head.setAttribute('aria-expanded', openItems[k] ? 'true' : 'false'); if (openItems[k]) fill(); }
        if (openItems[k]) fill();
        item.appendChild(head); item.appendChild(body); listEl.appendChild(item);
      });
      if (!arr.length) listEl.appendChild(el('p', { class: 'help', text: 'Nothing here yet.' }));
    }
    function shiftOpen(k, from, d) { var n = {}; Object.keys(openItems).forEach(function (x) { var m = x.indexOf(k + '[') === 0 && /^\[(\d+)\]/.exec(x.slice(k.length)); if (m && Number(m[1]) >= from) n[k + '[' + (Number(m[1]) + d) + ']' + x.slice(k.length + m[0].length)] = openItems[x]; else if (!m) n[x] = openItems[x]; }); openItems = n; }
    function swapOpen(k, a, b) { var A = k + '[' + a + ']', B = k + '[' + b + ']', t = openItems[A]; openItems[A] = openItems[B]; openItems[B] = t; }
    var add = el('button', { type: 'button', class: 'btn ghost small add', text: '+ ' + (opt.addLabel || 'Add item'), onclick: function () {
      var it = opt.newItem ? opt.newItem() : blank(opt.fields);
      arr.push(it); openItems[key + '[' + (arr.length - 1) + ']'] = true; setDirty(); draw();
      var last = listEl.lastElementChild; if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } });
    box.appendChild(listEl); box.appendChild(add); draw();
    return box;
  }

  /* ---------------- save ---------------- */
  function save() {
    if (!state || $('#saveBtn').disabled) return;
    var btn = $('#saveBtn'); btn.disabled = true; btn.textContent = 'Publishing…';
    var snapshot = JSON.stringify(state);
    api('PUT', 'content', state).then(function (r) {
      saved = snapshot; setDirty();
      if (r.committed) toast('Saved and published. Backed up to GitHub' + (r.url ? ' (<a href="' + r.url + '" target="_blank" rel="noopener">view commit</a>)' : '') + '.', false, true);
      else toast('Saved and published. ' + (r.note || ''), true);
    }).catch(function (e) { toast('Not saved: ' + e.message, true); setDirty(); })
      .finally(function () { btn.textContent = 'Save & publish'; setDirty(); });
  }
  $('#saveBtn').addEventListener('click', save);
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  window.addEventListener('beforeunload', function (e) { if (state && JSON.stringify(state) !== saved) { e.preventDefault(); e.returnValue = ''; } });

  boot();
})();
