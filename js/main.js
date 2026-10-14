/* RPR — Landing page. JavaScript puro, sem dependências. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Animação de entrada ao rolar ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
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

  /* ---------- 5. Carrossel de avaliações (troca com fade, autoplay 5s) ---------- */
  document.querySelectorAll('[data-reviews]').forEach(function (root) {
    var items = Array.prototype.slice.call(root.querySelectorAll('.review'));
    var dotsBox = root.querySelector('[data-dots]');
    var idx = 0, paused = false, inView = false, timer = null;
    var dots = items.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Ver avaliação ' + (i + 1));
      b.addEventListener('click', function () { show(i); });
      dotsBox.appendChild(b); return b;
    });
    function show(i) {
      idx = (i + items.length) % items.length;
      items.forEach(function (it, n) { it.classList.toggle('is-active', n === idx); it.setAttribute('aria-hidden', n === idx ? 'false' : 'true'); });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', n === idx ? 'true' : 'false'); });
    }
    root.querySelector('[data-prev]').addEventListener('click', function () { show(idx - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { show(idx + 1); });
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (t) { root.addEventListener(t, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (t) { root.addEventListener(t, function () { paused = false; }); });
    root.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 6000); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(root);
    } else { inView = true; }
    if (!reduceMotion) {
      timer = setInterval(function () { if (!paused && inView && !document.hidden) show(idx + 1); }, 5000);
    }
    show(0);
  });
})();
