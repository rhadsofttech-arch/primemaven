(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- twinkling stars ---------- */
  var stars = document.getElementById('nfStars');
  if (stars && !reduce) {
    for (var i = 0; i < 40; i++) {
      var s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.setProperty('--t', (3 + Math.random() * 4).toFixed(1) + 's');
      s.style.setProperty('--d', (-Math.random() * 5).toFixed(1) + 's');
      if (Math.random() > 0.8) { s.style.width = s.style.height = '4px'; s.style.background = '#4FD1FF'; }
      stars.appendChild(s);
    }
  }

  /* ---------- 404 digits: follow the pointer, bounce on tap ---------- */
  var digits = document.querySelectorAll('#nfDigits .d');
  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      digits.forEach(function (d) {
        var k = Number(d.getAttribute('data-depth')) || 15;
        d.style.transform = 'translate(' + (x * k).toFixed(1) + 'px,' + (y * k).toFixed(1) + 'px) rotateY(' + (x * 18).toFixed(1) + 'deg) rotateX(' + (-y * 18).toFixed(1) + 'deg)';
      });
    }, { passive: true });
  }
  digits.forEach(function (d) {
    d.addEventListener('click', function () { d.classList.remove('boing'); void d.offsetWidth; d.classList.add('boing'); });
    d.addEventListener('animationend', function (e) { if (e.animationName === 'boing') d.classList.remove('boing'); });
  });

  /* ---------- Snake ---------- */
  var cv = document.getElementById('gCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var N = 20;                              // grid cells per side
  var overlay = document.getElementById('gOverlay'), title = document.getElementById('gTitle'), msg = document.getElementById('gMsg');
  var scoreEl = document.getElementById('gScore'), bestEl = document.getElementById('gBest');
  var best = 0;
  try { best = Number(localStorage.getItem('pm_snake_best')) || 0; } catch (e) { /* storage unavailable */ }
  bestEl.textContent = best;

  var snake, dir, queue, food, score, running = false, paused = false, timer = null, speed, eatPulse = 0, size = 400;

  function resize() {
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = Math.max(200, Math.round(r.width));
    cv.width = size * dpr; cv.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function reset() {
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 }; queue = []; score = 0; speed = 130;
    scoreEl.textContent = '0';
    placeFood();
  }
  function placeFood() {
    do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
    while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }

  function turn(name) {
    var d = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[name];
    if (!d) return;
    if (!running) { start(); }
    var last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return;  // no reversing into yourself
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 3) queue.push(d);
  }

  function step() {
    if (queue.length) dir = queue.shift();
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // wrap around the edges, like the classic Nokia game
    head.x = (head.x + N) % N; head.y = (head.y + N) % N;
    if (snake.some(function (s, i) { return i < snake.length - 1 && s.x === head.x && s.y === head.y; })) return gameOver();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1; scoreEl.textContent = score; eatPulse = 1;
      speed = Math.max(60, 130 - score * 3);
      placeFood();
      clearInterval(timer); timer = setInterval(tick, speed);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { /* ignore */ } }
    } else {
      snake.pop();
    }
  }
  function tick() { step(); draw(); }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    var c = size / N;
    ctx.clearRect(0, 0, size, size);
    // board checker
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if ((x + y) % 2) { ctx.fillStyle = 'rgba(169,196,255,0.035)'; ctx.fillRect(x * c, y * c, c, c); }
    }
    if (!snake) return;
    // food: glowing "bit"
    var t = Date.now() / 300, pr = c * (0.32 + Math.sin(t) * 0.04);
    var fx = food.x * c + c / 2, fy = food.y * c + c / 2;
    var glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, c * 1.1);
    glow.addColorStop(0, 'rgba(79,209,255,0.55)'); glow.addColorStop(1, 'rgba(79,209,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(fx - c * 1.1, fy - c * 1.1, c * 2.2, c * 2.2);
    ctx.fillStyle = '#4FD1FF'; ctx.beginPath(); ctx.arc(fx, fy, pr, 0, Math.PI * 2); ctx.fill();
    // snake: gradient from cyan head to deep blue tail
    for (var i = snake.length - 1; i >= 0; i--) {
      var s = snake[i], k = i / Math.max(1, snake.length - 1);
      var r1 = Math.round(79 + (31 - 79) * k), g1 = Math.round(209 + (79 - 209) * k), b1 = Math.round(255 + (216 - 255) * k);
      ctx.fillStyle = 'rgb(' + r1 + ',' + g1 + ',' + b1 + ')';
      var pad = i === 0 ? 1 : 2;
      roundRect(s.x * c + pad, s.y * c + pad, c - pad * 2, c - pad * 2, c * 0.3); ctx.fill();
    }
    // eyes
    var h = snake[0], ex = h.x * c + c / 2, ey = h.y * c + c / 2, off = c * 0.18;
    ctx.fillStyle = '#050E26';
    [[-1, 1]].forEach(function () {
      var px = dir.y !== 0 ? off : 0, py = dir.x !== 0 ? off : 0;
      ctx.beginPath(); ctx.arc(ex + dir.x * c * 0.15 + px, ey + dir.y * c * 0.15 + py, c * 0.08, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + dir.x * c * 0.15 - px, ey + dir.y * c * 0.15 - py, c * 0.08, 0, 7); ctx.fill();
    });
    if (eatPulse > 0) {
      ctx.strokeStyle = 'rgba(79,209,255,' + eatPulse + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ex, ey, c * (1.6 - eatPulse), 0, 7); ctx.stroke();
      eatPulse = Math.max(0, eatPulse - 0.2);
    }
  }

  function show(t, m) { title.textContent = t; msg.textContent = m; overlay.hidden = false; }
  function start() {
    if (running && !paused) return;
    if (!running) reset();
    running = true; paused = false; overlay.hidden = true;
    clearInterval(timer); timer = setInterval(tick, speed);
    draw();
  }
  function pause() {
    if (!running) return;
    if (paused) return start();
    paused = true; clearInterval(timer); show('Paused', 'Press Space or tap to continue');
  }
  function gameOver() {
    running = false; clearInterval(timer);
    if (score > best) { best = score; bestEl.textContent = best; try { localStorage.setItem('pm_snake_best', String(best)); } catch (e) { /* ignore */ } }
    var line = score >= 20 ? 'Legendary. You should be building games.' : score >= 10 ? 'Nice run!' : score >= 3 ? 'Not bad. Go again?' : 'Ouch. Try again?';
    show('Score: ' + score, line + ' Tap to play again');
    draw();
  }

  overlay.addEventListener('click', start);
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var k = e.key.toLowerCase(), map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    if (map[k]) {
      var r = cv.getBoundingClientRect();
      if (running || (r.top < window.innerHeight && r.bottom > 0)) { e.preventDefault(); if (paused) start(); turn(map[k]); }
    } else if (k === ' ' || k === 'enter') {
      if (document.activeElement && document.activeElement !== document.body && document.activeElement !== overlay) return;
      e.preventDefault(); running && !paused ? pause() : start();
    } else if (k === 'p' || k === 'escape') { pause(); }
  });
  document.querySelectorAll('.g-pad button').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (paused) start(); turn(b.getAttribute('data-dir')); });
  });
  // swipe controls
  var sx = 0, sy = 0;
  cv.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  cv.addEventListener('touchmove', function (e) { if (running) e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && running && !paused) pause(); });

  // idle animation so the board isn't static before play
  reset(); resize();
  window.addEventListener('resize', resize);
  (function idle() { if (!running) draw(); requestAnimationFrame(idle); })();
})();
