/* =========================================================
   Peruvian Soul — interactions & animation
   GSAP + ScrollTrigger for scroll effects, Lenis for smooth scroll.
   Everything degrades gracefully: without the libraries (or with
   "reduce motion" on), content is simply shown without animation.
   ========================================================= */

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion;

  const header = $('.header');
  const progressBar = $('.progress__bar');
  const mobileReserve = $('.mobile-reserve');

  /* ---------- Smooth scrolling (Lenis) ---------- */
  let lenis = null;
  if (animate && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = target => {
    const offset = -(header.offsetHeight - 4);
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else {
      const y = (typeof target === 'number') ? target : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  /* ---------- Off-canvas menu ---------- */
  const toggle = $('.menu-toggle');
  const offcanvas = $('#offcanvas');
  const setMenu = open => {
    const wasOpen = document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    offcanvas.setAttribute('aria-hidden', !open);
    $('main').inert = open;
    $('footer').inert = open;
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) setTimeout(() => $('a', offcanvas).focus(), 50);
    else if (wasOpen && offcanvas.contains(document.activeElement)) toggle.focus();
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

  // Keep keyboard focus inside a dialog while it's open
  const trapFocus = (container, e) => {
    if (e.key !== 'Tab') return;
    const items = $$('a[href], button:not([disabled]), input, select, textarea', container).filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  offcanvas.addEventListener('keydown', e => trapFocus(offcanvas, e));
  header.addEventListener('keydown', e => {
    // Tab from the close button goes into the open menu
    if (e.key === 'Tab' && !e.shiftKey && document.activeElement === toggle && document.body.classList.contains('menu-open')) {
      e.preventDefault(); $('a', offcanvas).focus();
    }
  });

  /* ---------- Anchor links ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#top') return;
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
      // Move keyboard / screen reader focus to the destination too
      const focusEl = target === 0 ? $('#main') : target;
      if (!focusEl.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focusEl.tagName)) focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    });
  });

  /* ---------- Pause / play all ambient motion (WCAG 2.2.2) ---------- */
  const motionBtn = $('.motion-toggle');
  let motionPaused = reduceMotion;
  const setMotion = paused => {
    motionPaused = paused;
    document.documentElement.classList.toggle('motion-paused', paused);
    motionBtn.setAttribute('aria-pressed', paused);
    $('.motion-toggle__label', motionBtn).textContent = paused ? 'Play motion' : 'Pause motion';
    $$('video').forEach(v => paused ? v.pause() : v.play().catch(() => {}));
  };
  motionBtn.addEventListener('click', () => setMotion(!motionPaused));
  setMotion(motionPaused);

  /* ---------- Header shrink, progress bar, mobile CTA ---------- */
  const hero = $('.hero');
  const visit = $('#visit');
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 40);
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const pastHero = y > hero.offsetHeight * 0.6;
    const visitTop = visit.getBoundingClientRect().top;
    const atVisit = visitTop < window.innerHeight * 0.6 && visit.getBoundingClientRect().bottom > 0;
    mobileReserve.classList.toggle('is-visible', pastHero && !atVisit);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['food', 'menu', 'cocktails', 'story', 'atmosphere', 'visit'].forEach(id => sectionObserver.observe($('#' + id)));

  /* ---------- Cocktails: sticky video swaps with each scrolling step ---------- */
  const steps = $$('.step');
  const pourScenes = $$('.pour-scene');
  const nowName = $('.cocktails__now-name');
  const setStep = idx => {
    steps.forEach((s, n) => s.classList.toggle('is-active', n === idx));
    pourScenes.forEach((s, n) => s.classList.toggle('is-active', n === idx));
    nowName.textContent = pourScenes[idx].textContent;
  };
  const stepObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) setStep(Number(entry.target.dataset.step)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => stepObserver.observe(s));
  setStep(0);

  /* ---------- Menu tabs ---------- */
  const tabs = $$('.tab');
  const activateTab = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = $('#' + t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
      if (on && animate) {
        gsap.fromTo(panel.querySelectorAll('li'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .05, ease: 'power3.out' });
      }
    });
    if (hasGSAP) ScrollTrigger.refresh();
  };
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      activateTab(next);
    });
  });

  /* ---------- Lightbox gallery ---------- */
  const tiles = $$('.tile');
  const lightbox = $('.lightbox');
  const lbImg = $('.lightbox__img');
  const lbPh = $('.lightbox__ph');
  const lbCap = $('.lightbox__cap');
  let lbIndex = 0;
  let lastFocus = null;
  const showTile = idx => {
    lbIndex = (idx + tiles.length) % tiles.length;
    const img = tiles[lbIndex].querySelector('img');
    const src = tiles[lbIndex].querySelector('.ph');
    lbImg.hidden = !img;
    lbPh.hidden = !!img;
    if (img) {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
    } else {
      lbPh.setAttribute('style', src.getAttribute('style'));
      lbPh.dataset.label = src.dataset.label;
      lbPh.setAttribute('aria-label', src.getAttribute('aria-label'));
      lbPh.classList.toggle('ph--video', src.classList.contains('ph--video'));
    }
    lbCap.textContent = tiles[lbIndex].dataset.label;
  };
  const openLightbox = idx => {
    lastFocus = document.activeElement;
    showTile(idx);
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    if (animate) gsap.fromTo('.lightbox__figure', { scale: .92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .5, ease: 'power3.out' });
    $('.lightbox__close').focus();
  };
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  };
  tiles.forEach((t, idx) => t.addEventListener('click', () => openLightbox(idx)));
  $('.lightbox__close').addEventListener('click', closeLightbox);
  $('.lightbox__prev').addEventListener('click', () => showTile(lbIndex - 1));
  $('.lightbox__next').addEventListener('click', () => showTile(lbIndex + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    trapFocus(lightbox, e);
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showTile(lbIndex + 1);
    if (e.key === 'ArrowLeft') showTile(lbIndex - 1);
  });

  /* ---------- Reviews: drag-to-scroll rail ---------- */
  const rail = $('.reviews__rail');
  let dragging = false, startX = 0, startScroll = 0;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    dragging = true; startX = e.clientX; startScroll = rail.scrollLeft;
    rail.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', e => { if (dragging) rail.scrollLeft = startScroll - (e.clientX - startX); });
  window.addEventListener('pointerup', () => { dragging = false; rail.classList.remove('is-dragging'); });
  rail.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Reservation form ---------- */
  const form = $('#reserve');
  const dateInput = form.elements.date;
  dateInput.addEventListener('change', () => { if (dateInput.value && dateInput.value < dateInput.min) dateInput.value = dateInput.min; });
  const today = new Date();
  dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const guests = form.elements.guests;
  $$('.stepper__btn', form).forEach(b => b.addEventListener('click', () => {
    const v = Math.min(8, Math.max(1, (parseInt(guests.value, 10) || 2) + Number(b.dataset.dir)));
    guests.value = v;
  }));

  /* Spam protection (client side). These stop most bots; the server must repeat
     the checks and verify a Turnstile token once the form is connected. */
  const pageOpened = Date.now();
  const MIN_FILL_MS = 4000;          // humans take longer than this to fill a form
  const MAX_PER_HOUR = 3;            // submissions per browser per hour
  const LINK_RE = /(https?:\/\/|www\.|\[url|<a\s)/i;
  const spamCheck = (f, honeypotName) => {
    if (f.elements[honeypotName].value) return 'bot';
    if (Date.now() - pageOpened < MIN_FILL_MS) return 'fast';
    let log = [];
    try { log = JSON.parse(localStorage.getItem('ps-submits') || '[]').filter(t => Date.now() - t < 3600e3); } catch { /* storage blocked */ }
    if (log.length >= MAX_PER_HOUR) return 'rate';
    try { localStorage.setItem('ps-submits', JSON.stringify([...log, Date.now()])); } catch { /* storage blocked */ }
    return null;
  };

  const messages = {
    date: 'Choose a date from today onward.',
    time: 'Choose a time.',
    name: 'Enter your name.',
    email: 'Enter a valid email address, like name@example.com.',
    phone: 'Enter a valid phone number, or leave it blank.',
    notes: 'Please remove web links from your notes.'
  };
  const setError = (field, text) => {
    const err = $('#' + field.id + '-err');
    field.classList.toggle('is-invalid', !!text);
    field.setAttribute('aria-invalid', !!text);
    if (err) err.textContent = text || '';
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('.reserve__msg', form);
    const f = form.elements;
    let firstBad = null;
    ['date', 'time', 'name', 'email', 'phone', 'notes'].forEach(name => {
      const field = f[name];
      let bad = !field.checkValidity() || (field.required && !field.value.trim());
      if (name === 'notes') bad = LINK_RE.test(field.value);
      setError(field, bad ? messages[name] : '');
      if (bad && !firstBad) firstBad = field;
    });
    if (firstBad) {
      msg.textContent = 'Please fix the highlighted fields.';
      firstBad.focus();
      return;
    }

    const spam = spamCheck(form, 'website');
    if (spam === 'bot') { msg.textContent = 'Thank you.'; return; }   // say nothing useful to bots
    if (spam === 'fast') { msg.textContent = 'That was quick! Please check your details and press the button again.'; return; }
    if (spam === 'rate') { msg.textContent = 'You have sent several requests already. Please call us at (301) 555-0142.'; return; }

    const when = new Date(dateInput.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    form.classList.add('is-done');
    $('.btn__label', form).textContent = 'Request Sent ✓';
    msg.textContent = `Gracias, ${f.name.value.trim().split(' ')[0]}! We've received your request for ${guests.value} on ${when} at ${f.time.value}. A confirmation will follow by email. (Demo: no booking was made.)`;
  });
  $$('input, select, textarea', form).forEach(field => field.addEventListener('input', () => setError(field, '')));

  /* ---------- Newsletter ---------- */
  const news = $('.news');
  news.addEventListener('submit', e => {
    e.preventDefault();
    const out = $('.news__msg');
    const email = news.elements.email;
    if (!email.checkValidity() || !email.value.trim()) {
      email.setAttribute('aria-invalid', 'true');
      out.textContent = 'Enter a valid email address.';
      email.focus();
      return;
    }
    email.setAttribute('aria-invalid', 'false');
    const spam = spamCheck(news, 'company');
    if (spam === 'fast' || spam === 'rate') { out.textContent = 'Please try again in a moment.'; return; }
    news.querySelector('button').textContent = 'Gracias ✓';
    out.textContent = spam ? '' : "You're on the list. (Demo: no email was stored.)";
  });

  /* ---------- Preloader → intro ---------- */
  const intro = () => {
    document.documentElement.classList.add('is-loaded');
    if (!animate) return;
    gsap.timeline({ delay: .35 })
      .from('.hero__video', { scale: 1.18, duration: 2.4, ease: 'power3.out' }, 0)
      .from('.hero__title .line__inner', { yPercent: 110, duration: 1.3, stagger: .12, ease: 'power4.out' }, .2)
      .from('.hero__eyebrow', { autoAlpha: 0, y: 20, duration: .9, ease: 'power3.out' }, .5)
      .from('.hero__actions', { autoAlpha: 0, y: 24, duration: .9, ease: 'power3.out' }, .8)
      .from('.header', { autoAlpha: 0, y: -20, duration: .9, ease: 'power3.out' }, .9)
      .from('.hero__scroll', { autoAlpha: 0, duration: 1 }, 1.2);
  };
  const minDelay = reduceMotion ? 0 : 1500;
  const t0 = performance.now();
  const ready = () => setTimeout(intro, Math.max(0, minDelay - (performance.now() - t0)));
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);

  /* =========================================================
     Scroll animations (GSAP)
     ========================================================= */
  if (!animate) return;
  gsap.registerPlugin(ScrollTrigger);

  // Hero: video slowly zooms and text drifts/fades as you scroll away (scroll-linked)
  gsap.to('.hero__media', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -25, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  // One-time reveals use IntersectionObserver rather than ScrollTrigger: it still fires
  // when the page jumps straight to a section (e.g. index.html#visit), so nothing stays hidden.
  // Elements that come into view in the same frame are handed over together, so they can stagger.
  const whenVisible = (targets, onShow, margin = '0px 0px -10% 0px') => {
    let batch = [], frame = null;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); batch.push(e.target); } });
      if (batch.length && !frame) frame = requestAnimationFrame(() => { onShow(batch); batch = []; frame = null; });
    }, { rootMargin: margin });
    (typeof targets === 'string' ? $$(targets) : [].concat(targets)).forEach(el => io.observe(el));
  };

  // Reveal on scroll, staggered in batches
  gsap.set('.reveal', { autoAlpha: 0, y: 40 });
  whenVisible('.reveal', els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .1, ease: 'power3.out', overwrite: true }));

  // Intro paragraph: words light up as you scroll (scroll-driven split text)
  $$('.reveal-words').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.fromTo(p.querySelectorAll('.w'), { opacity: .15 }, {
      opacity: 1, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  });

  // Counters
  whenVisible('[data-count]', els => els.forEach(el => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: Number(el.dataset.count), duration: 2, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US'); }
    });
  }));

  // Parallax backgrounds
  $$('.parallax-bg').forEach(bg => {
    gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.parallax-img').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Chef portrait: arched clip-path reveal + signature line draws itself
  gsap.set('.clip-reveal-circle', { clipPath: 'inset(100% 0 0 0)' });
  whenVisible('.clip-reveal-circle', els => gsap.to(els, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'power4.inOut' }));
  const line = $('.story__line path');
  const len = line.getTotalLength();
  gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.story__portrait', start: 'center 80%', end: 'bottom 40%', scrub: true }
  });

  // Gallery tiles stagger in
  gsap.set('.tile', { autoAlpha: 0, y: 60, scale: .96 });
  whenVisible('.tile', els => gsap.to(els, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, stagger: .08, ease: 'power3.out' }), '0px 0px -5% 0px');

  // Reviews slide in
  gsap.set('.reviews__rail', { autoAlpha: 0, x: 120 });
  whenVisible('.reviews__rail', els => gsap.to(els, { autoAlpha: 1, x: 0, duration: 1.3, ease: 'power3.out' }));

  // Food: horizontal scroll on desktop, simple vertical reveals on mobile
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('.food__track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.food__pin',
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
    // IntersectionObserver sees the sideways movement too, so images wipe in as they slide into view
    gsap.set('.food .clip-reveal', { clipPath: 'inset(0 0 0 100%)' });
    whenVisible('.food .clip-reveal', els => gsap.to(els, { clipPath: 'inset(0 0 0 0%)', duration: 1.3, stagger: .12, ease: 'power4.inOut' }), '0px -5% 0px 0px');
  });
  mm.add('(max-width: 860px)', () => {
    gsap.set('.food .clip-reveal', { clipPath: 'inset(100% 0 0 0)' });
    whenVisible('.food .clip-reveal', els => gsap.to(els, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, stagger: .12, ease: 'power4.inOut' }));
  });

  // Recalculate once fonts settle (headline sizes change layout)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
