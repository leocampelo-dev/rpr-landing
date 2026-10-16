/* RPR — Efeitos. JavaScript puro.
   1) fundo que limpa com o mouse (o cursor vira uma politriz)  ·  2) progresso de rolagem (barra do header e linha do "Como funciona") */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* =========================================================
     1. FUNDO QUE LIMPA COM O MOUSE
     O piso "sujo" é desenhado num canvas por cima da foto do piso "limpo".
     O mouse (ou o dedo) apaga a sujeira onde passa; ela volta devagar.
     Sem foto "antes" separada, a sujeira é gerada a partir da própria foto limpa.
     Para usar uma foto real de "antes", coloque data-dirty="caminho.jpg" na seção.
     ========================================================= */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }


  /* =========================================================
     0. CURSOR "POLITRIZ"
     Nas seções com data-clean, o mouse é trocado pela politriz (imagem em data-tool).
     O disco da máquina fica exatamente no ponto do mouse; ela se inclina de leve ao andar.
     Só em mouse (ponteiro fino) e sem "reduzir movimento". Sobre links e botões volta o cursor normal.
     ========================================================= */
  function makeTool() {
    var host = document.querySelector('[data-clean][data-tool]');
    if (!host || reduce || !finePointer) return null;
    var TW = 140, PX = TW * 0.753, PY = TW * 1.033;   // largura da imagem e posição do disco dentro dela (px)
    var el = document.createElement('div');
    el.className = 'tool-cursor'; el.setAttribute('aria-hidden', 'true');
    el.style.width = TW + 'px'; el.style.transformOrigin = PX + 'px ' + PY + 'px';
    var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = host.getAttribute('data-tool');
    el.appendChild(im); document.body.appendChild(el);
    document.documentElement.classList.add('has-tool');

    var x = 0, y = 0, tilt = 0, tiltT = 0, lastX = null, on = false, inside = false, autoOn = false;
    var raf = 0, last = null, sTick = false;

    function frame() {
      raf = 0;
      tilt += (tiltT - tilt) * 0.18; tiltT *= 0.88;
      el.style.transform = 'translate3d(' + (x - PX) + 'px,' + (y - PY) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)';
      if (Math.abs(tilt) > 0.05 || Math.abs(tiltT) > 0.05) raf = requestAnimationFrame(frame);
    }
    function move(nx, ny) {
      if (lastX !== null) tiltT = clamp(-(nx - lastX) * 0.7, -9, 9);
      lastX = nx; x = nx; y = ny;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function show(v) { if (v !== on) { on = v; el.classList.toggle('is-on', v); } }
    function usable(t) {
      return !!(t && t.closest && t.closest('[data-clean]') && !t.closest('a,button,input,textarea,select,label,[role="button"]'));
    }
    function sync(cx, cy, t) {
      inside = usable(t);
      if (inside) { move(cx, cy); show(true); } else if (!autoOn) { show(false); lastX = null; }
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      last = { x: e.clientX, y: e.clientY };
      sync(e.clientX, e.clientY, e.target);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { inside = false; if (!autoOn) show(false); });
    window.addEventListener('scroll', function () {   // rolou com o mouse parado: reavalia o que está embaixo dele
      if (!last || sTick) return; sTick = true;
      requestAnimationFrame(function () { sTick = false; sync(last.x, last.y, document.elementFromPoint(last.x, last.y)); });
    }, { passive: true });

    return {
      auto: function (cx, cy) { autoOn = true; if (!inside) { move(cx, cy); show(true); } },
      autoEnd: function () { autoOn = false; if (!inside) { show(false); lastX = null; } }
    };
  }
  var tool = makeTool();

  function CleanBg(root) {
    var img = root.querySelector('.section-bg');
    var canvas = root.querySelector('.clean-canvas');
    if (!img || !canvas) return;
    var ready = function () { root.classList.add('is-ready'); };
    if (reduce) { canvas.remove(); ready(); return; }
    setTimeout(ready, 3000); // garantia: nunca deixa o fundo escondido

    var ctx = canvas.getContext('2d');
    var dirt = document.createElement('canvas'), dctx = dirt.getContext('2d');
    var mask = document.createElement('canvas'), mctx = mask.getContext('2d');
    var brush = document.createElement('canvas');
    var hint = root.querySelector('.clean-hint');
    var dirtyImg = null;
    var SCALE = 0.5, LIFE = 7200, autoRuns = 0, lastAutoEnd = 0, pos = { x: 0.5, y: 0.5 };
    var W = 0, H = 0, R = 40;
    var pts = [];
    var raf = 0, running = false, visible = false;
    var lastAuto = null, auto = null, interacted = false;
    var grain = null;

    function makeGrain() {
      var g = document.createElement('canvas'); g.width = g.height = 128;
      var gc = g.getContext('2d'), id = gc.createImageData(128, 128), rnd = mulberry32(11);
      for (var i = 0; i < id.data.length; i += 4) {
        var v = 40 + rnd() * 60;
        id.data[i] = v; id.data[i + 1] = v - 4; id.data[i + 2] = v - 10; id.data[i + 3] = 40 + rnd() * 90;
      }
      gc.putImageData(id, 0, 0); return g;
    }

    function cover(c, source) {
      var iw = source.naturalWidth || source.width, ih = source.naturalHeight || source.height;
      var s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
      c.drawImage(source, (W - dw) * pos.x, (H - dh) * pos.y, dw, dh);
    }

    function isBright() {                        // foto clara pede uma sujeira mais leve (senão a hero fica toda escura)
      try {
        var pr = document.createElement('canvas'); pr.width = pr.height = 12;
        var pc = pr.getContext('2d'); pc.drawImage(dirt, 0, 0, 12, 12);
        var d = pc.getImageData(0, 0, 12, 12).data, sum = 0, n = d.length / 4;
        for (var k = 0; k < d.length; k += 4) sum += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
        return sum / n > 105;
      } catch (err) { return false; }          // file:// (canvas "tainted"): mantém a sujeira padrão
    }

    function drawDirt() {
      dctx.globalCompositeOperation = 'source-over';
      dctx.globalAlpha = 1;
      dctx.clearRect(0, 0, W, H);
      if (dirtyImg) { cover(dctx, dirtyImg); return; }
      cover(dctx, img);
      var rnd = mulberry32(42), i, bright = isBright();
      dctx.globalCompositeOperation = 'multiply';
      dctx.fillStyle = bright ? '#b3a894' : '#9b927f'; dctx.fillRect(0, 0, W, H);   // tom de poeira
      dctx.globalCompositeOperation = 'source-over';
      dctx.fillStyle = bright ? 'rgba(110,98,82,0.30)' : 'rgba(40,34,26,0.34)'; dctx.fillRect(0, 0, W, H); // véu fosco
      for (i = 0; i < 34; i++) {                                         // manchas
        var x = rnd() * W, y = rnd() * H, r = (30 + rnd() * 150) * SCALE * 1.6;
        var g = dctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(26,20,12,' + ((bright ? 0.07 : 0.16) + rnd() * (bright ? 0.12 : 0.22)) + ')');
        g.addColorStop(1, 'rgba(26,20,12,0)');
        dctx.fillStyle = g; dctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      dctx.lineCap = 'round';
      for (i = 0; i < 30; i++) {                                         // riscos
        var sx = rnd() * W, sy = rnd() * H, len = (60 + rnd() * 240) * SCALE, a = -0.35 + (rnd() - 0.5) * 0.7;
        dctx.strokeStyle = 'rgba(20,16,10,' + ((bright ? 0.06 : 0.10) + rnd() * (bright ? 0.08 : 0.16)) + ')';
        dctx.lineWidth = (1 + rnd() * 2.5) * SCALE * 1.4;
        dctx.beginPath(); dctx.moveTo(sx, sy); dctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); dctx.stroke();
      }
      grain = grain || makeGrain();
      dctx.globalAlpha = bright ? 0.28 : 0.5; dctx.fillStyle = dctx.createPattern(grain, 'repeat'); dctx.fillRect(0, 0, W, H);
      dctx.globalAlpha = 1;
    }

    function makeBrush() {
      var d = Math.ceil(R * 2);
      brush.width = brush.height = d;
      var b = brush.getContext('2d'), g = b.createRadialGradient(R, R, 0, R, R, R);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.92)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      b.fillStyle = g; b.fillRect(0, 0, d, d);
    }

    function readPos() {                        // object-position da foto (ex.: "85% 100%")
      var op = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
      var px = parseFloat(op[0]), py = parseFloat(op[1]);
      pos.x = /%$/.test(op[0]) && !isNaN(px) ? px / 100 : 0.5;
      pos.y = /%$/.test(op[1] || '') && !isNaN(py) ? py / 100 : 0.5;
    }

    function resize() {
      var r = root.getBoundingClientRect();
      readPos();
      var w = Math.max(2, Math.round(r.width * SCALE)), h = Math.max(2, Math.round(r.height * SCALE));
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = dirt.width = mask.width = W;
      canvas.height = dirt.height = mask.height = H;
      R = clamp(Math.min(r.width, r.height) * 0.06, finePointer ? 40 : 56, finePointer ? 54 : 72) * SCALE;
      makeBrush(); drawDirt(); render(performance.now());
    }

    function stamp(x, y, ref, now) {
      var p = ref.p;
      if (p) {
        var dx = x - p.x, dy = y - p.y, dist = Math.sqrt(dx * dx + dy * dy), step = R * 0.28;
        var n = Math.max(1, Math.floor(dist / step));
        for (var i = 1; i <= n; i++) pts.push({ x: p.x + dx * i / n, y: p.y + dy * i / n, t: now });
      } else { pts.push({ x: x, y: y, t: now }); }
      ref.p = { x: x, y: y };
      if (pts.length > 900) pts.splice(0, pts.length - 900);
      start();
    }

    function render(now) {
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      mctx.globalCompositeOperation = 'source-over';
      mctx.clearRect(0, 0, W, H);
      var hold = LIFE * 0.35, i, p, a;
      for (i = 0; i < pts.length; i++) {
        p = pts[i]; var age = now - p.t;
        a = age < hold ? 1 : 1 - (age - hold) / (LIFE - hold);
        mctx.globalAlpha = a < 0 ? 0 : a;
        mctx.drawImage(brush, p.x - R, p.y - R);
      }
      mctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(dirt, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    function tick(now) {
      raf = 0;
      if (auto) {
        var u = (now - auto.t0) / auto.dur;
        if (u >= 1) { endAuto(); }
        else {
          var e = u * u * (3 - 2 * u);
          var x = W * (0.06 + 0.88 * e), y = H * (auto.y + auto.amp * Math.sin(u * 6.2832 * auto.waves + auto.ph));
          stamp(x, y, { get p() { return lastAuto; }, set p(v) { lastAuto = v; } }, now);
          if (tool) { var rr = root.getBoundingClientRect(); tool.auto(rr.left + x / SCALE, rr.top + y / SCALE); }
        }
      }
      render(now);
      if (visible && (pts.length || auto)) raf = requestAnimationFrame(tick);
      else running = false;
    }
    function start() { if (!running && visible) { running = true; raf = requestAnimationFrame(tick); } }

    function endAuto() {
      auto = null; lastAuto = null; lastAutoEnd = performance.now();
      if (tool) tool.autoEnd();
    }
    function startAuto() {
      if (auto || !visible || interacted || autoRuns >= 2) return;
      autoRuns++;
      auto = { t0: performance.now(), dur: 2800, y: 0.72 + Math.random() * 0.06, amp: 0.07, waves: 1.5, ph: Math.random() * 3 };
      start();
    }

    function markInteracted() {
      if (!interacted) { interacted = true; if (hint) hint.classList.add('is-hidden'); }
      if (auto) endAuto();                      // se a pessoa pegou o mouse, a passada automática sai de cena
    }
    var userRef = { p: null };
    function toLocal(e) { var r = root.getBoundingClientRect(); return { x: (e.clientX - r.left) * SCALE, y: (e.clientY - r.top) * SCALE }; }
    root.addEventListener('pointermove', function (e) {
      var l = toLocal(e); markInteracted(); stamp(l.x, l.y, userRef, performance.now());
    }, { passive: true });
    root.addEventListener('pointerdown', function (e) {
      var l = toLocal(e); markInteracted(); userRef.p = null; stamp(l.x, l.y, userRef, performance.now());
    }, { passive: true });
    ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (t) {
      root.addEventListener(t, function () { userRef.p = null; }, { passive: true });
    });

    function init() {
      var d = root.getAttribute('data-dirty');
      var go = function () { resize(); ready(); };
      // se o navegador trocar a foto (versão mobile ↔ desktop), refaz a camada de sujeira
      img.addEventListener('load', function () { if (W) { readPos(); drawDirt(); render(performance.now()); } });
      if (d) { dirtyImg = new Image(); dirtyImg.onload = go; dirtyImg.onerror = function () { dirtyImg = null; go(); }; dirtyImg.src = d; }
      else go();
      if ('ResizeObserver' in window) {
        var to; new ResizeObserver(function () { clearTimeout(to); to = setTimeout(resize, 120); }).observe(root);
      } else { window.addEventListener('resize', resize); }
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) { start(); if (!interacted && !auto) setTimeout(startAuto, 700); }
      }, { threshold: 0.25 }).observe(root);
      // uma segunda passada sozinha, só se ninguém mexeu (no máximo 2 por seção)
      setInterval(function () {
        if (visible && !document.hidden && !interacted && autoRuns === 1 && !auto && performance.now() - lastAutoEnd > 12000) startAuto();
      }, 2000);
    }
    if (img.complete && img.naturalWidth) init();
    else { img.addEventListener('load', init, { once: true }); img.addEventListener('error', ready, { once: true }); }
  }

  $$('[data-clean]').forEach(CleanBg);

  // texto da dica muda no celular
  if (!finePointer) {
    $$('.clean-hint__text').forEach(function (el) { el.textContent = 'Deslize o dedo para limpar o piso'; });
  }

  /* =========================================================
     2. PROGRESSO DA PÁGINA (barra verde no header) E DOS PASSOS
     ========================================================= */
  var bar = document.querySelector('.progress span');
  var steps = document.querySelector('.steps');
  var stepItems = steps ? $$('li', steps) : [];
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : 0);
    }
    if (steps) {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight, line = vh * 0.62;
      steps.style.setProperty('--prog', clamp((line - r.top) / r.height, 0, 1).toFixed(3));
      stepItems.forEach(function (li) {
        var n = li.querySelector('.steps__num').getBoundingClientRect();
        li.classList.toggle('is-active', n.top + n.height / 2 < line);
      });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

})();
