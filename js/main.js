/* RPR — Landing page. JavaScript puro, sem dependências. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Animação de entrada ao rolar ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target;
          t.classList.add('is-visible'); io.unobserve(t);
          // depois da entrada, o hover dos cards volta a ser rápido (ver effects.css)
          setTimeout(function () { t.classList.add('is-done'); }, 1400);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 2. Rastreamento dos botões de WhatsApp ---------- */
  // Cada clique vira o evento "whatsapp_click" no dataLayer (Google Tag Manager / Google Ads).
  window.dataLayer = window.dataLayer || [];
  document.querySelectorAll('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      window.dataLayer.push({ event: 'whatsapp_click', cta_location: a.getAttribute('data-cta') });
    });
  });

  /* ---------- 3. Slider antes/depois ---------- */
  document.querySelectorAll('[data-ba]').forEach(function (ba) {
    var handle = ba.querySelector('.ba__handle');
    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--pos', pct + '%');
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100);
    }
    handle.addEventListener('pointerdown', function (e) {
      dragging = true; handle.setPointerCapture(e.pointerId); e.preventDefault();
    });
    handle.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      handle.addEventListener(t, function () { dragging = false; });
    });
    // Toque na imagem também move a linha (sem atrapalhar a rolagem do carrossel)
    ba.addEventListener('click', function (e) { if (e.target !== handle && !handle.contains(e.target)) fromEvent(e); });
    handle.addEventListener('keydown', function (e) {
      var cur = parseFloat(handle.getAttribute('aria-valuenow'));
      if (e.key === 'ArrowLeft') { setPos(cur - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPos(cur + 5); e.preventDefault(); }
      if (e.key === 'Home') { setPos(0); e.preventDefault(); }
      if (e.key === 'End') { setPos(100); e.preventDefault(); }
    });
  });

  /* ---------- 4. Carrossel de resultados (rolagem nativa + setas + pontos + autoplay 5s) ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var viewport = root.querySelector('.carousel__viewport');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
    var dotsBox = root.querySelector('[data-dots]');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dots = [];
    var timer = null, paused = false, inView = false;

    function step() { return slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(slides[0].parentNode).columnGap || 0); }
    function perView() { return Math.max(1, Math.round(viewport.clientWidth / step())); }
    function maxIndex() { return Math.max(0, slides.length - perView()); }
    function current() { return Math.min(maxIndex(), Math.round(viewport.scrollLeft / step())); }
    function goTo(i) {
      i = Math.max(0, Math.min(maxIndex(), i));
      viewport.scrollTo({ left: i * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    function buildDots() {
      dotsBox.innerHTML = ''; dots = [];
      for (var i = 0; i <= maxIndex(); i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button'; b.setAttribute('aria-label', 'Ir para o item ' + (idx + 1));
          b.addEventListener('click', function () { goTo(idx); });
          dotsBox.appendChild(b); dots.push(b);
        })(i);
      }
      update();
    }
    function update() {
      var c = current();
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === c ? 'true' : 'false'); });
    }
    function play() {
      stop();
      if (reduceMotion) return;
      timer = setInterval(function () {
        if (paused || !inView || document.hidden) return;
        var c = current();
        goTo(c >= maxIndex() ? 0 : c + 1);
      }, 5000);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    prev.addEventListener('click', function () { goTo(current() - 1); });
    next.addEventListener('click', function () { goTo(current() >= maxIndex() ? 0 : current() + 1); });
    viewport.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { goTo(current() + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { goTo(current() - 1); e.preventDefault(); }
    });
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (t) { root.addEventListener(t, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (t) { root.addEventListener(t, function () { paused = false; }); });
    root.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 6000); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(root);
    } else { inView = true; }
    window.addEventListener('resize', buildDots);
    buildDots(); play();
  });

  /* ---------- 5. Lista completa de cada serviço (dobra 3): botão "Ver serviços" abre o <dialog> ---------- */
  // O <dialog> nativo já prende o foco, fecha com Esc e devolve o foco ao botão.
  // Ao fechar, toca a animação de saída (.is-closing, 200ms no CSS) e só depois fecha de verdade.
  document.querySelectorAll('[data-dialog]').forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('data-dialog'));
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var closeTimer;
    function closeDlg() {
      if (reduceMotion) { dlg.close(); return; }
      if (dlg.classList.contains('is-closing')) return;
      dlg.classList.add('is-closing');
      closeTimer = setTimeout(function () { dlg.close(); }, 200);
    }
    btn.addEventListener('click', function () {
      dlg.showModal(); btn.setAttribute('aria-expanded', 'true');
    });
    dlg.addEventListener('close', function () {
      clearTimeout(closeTimer); dlg.classList.remove('is-closing');
      btn.setAttribute('aria-expanded', 'false');
    });
    // Esc também usa a animação de saída
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDlg(); });
    dlg.querySelector('[data-close]').addEventListener('click', closeDlg);
    // Clique fora do painel (no fundo escurecido) também fecha
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
  });

  /* ---------- 6. Fotos que passam sozinhas nos cards de serviço (dobra 3) ---------- */
  // Desliza uma foto por vez, devagar. A primeira foto é copiada para o fim: ao chegar nela, volta ao
  // início sem animação e o giro parece contínuo. Só roda com o card na tela e a aba aberta.
  document.querySelectorAll('[data-slides]').forEach(function (box) {
    var track = box.querySelector('.sol__track');
    var total = track.children.length;
    if (total < 2 || reduceMotion) return;
    var clone = track.children[0].cloneNode(true);
    clone.alt = ''; clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);

    var dots = document.createElement('div');
    dots.className = 'sol__dots'; dots.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < total; k++) dots.appendChild(document.createElement('span'));
    box.appendChild(dots);

    var i = 0, timer = null, onScreen = false;
    function show(n, animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translateX(' + (-100 * n) + '%)';
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle('is-active', j === n % total); });
    }
    function next() {
      if (i >= total) { i = 0; show(0, false); void track.offsetWidth; } // volta da cópia, caso o fim da animação tenha se perdido
      i++; show(i, true);
    }
    track.addEventListener('transitionend', function () { if (i === total) { i = 0; show(0, false); } });
    function start() { if (!timer && onScreen && !document.hidden) timer = setInterval(next, 5000); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting; onScreen ? start() : stop();
      }, { threshold: 0.3 }).observe(box);
    } else { onScreen = true; start(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    show(0, false);
  });
})();
