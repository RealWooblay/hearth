/* ==========================================================
   WISP — interactions
   ========================================================== */

(() => {
  'use strict';

  /* -------- Reveal on scroll -------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* -------- Modes horizontal scroll: arrows, drag, progress -------- */
  const track = document.querySelector('.modes-track');
  const progress = document.querySelector('.modes-progress-fill');
  const prevBtn = document.querySelector('.modes-prev');
  const nextBtn = document.querySelector('.modes-next');

  if (track) {
    const getStep = () => {
      const card = track.querySelector('.mode');
      if (!card) return 400;
      return card.offsetWidth + 28; // card width + gap
    };

    const updateState = () => {
      const max = track.scrollWidth - track.clientWidth;
      const x = track.scrollLeft;
      if (progress) {
        const pct = max <= 0 ? 1 : Math.min(1, Math.max(0, x / max));
        progress.style.width = (18 + pct * 82).toFixed(1) + '%';
      }
      if (prevBtn) prevBtn.disabled = x <= 4;
      if (nextBtn) nextBtn.disabled = x >= max - 4;
    };

    track.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState);
    /* initial state after layout settles */
    requestAnimationFrame(updateState);

    /* Manual rAF smooth scroll — doesn't depend on CSS scroll-behavior */
    let animId = null;
    const animateScrollTo = (target, duration = 500) => {
      if (animId) cancelAnimationFrame(animId);
      const start = track.scrollLeft;
      const change = target - start;
      if (Math.abs(change) < 1) return;
      const t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        track.scrollLeft = start + change * ease(t);
        if (t < 1) animId = requestAnimationFrame(step);
        else animId = null;
      };
      animId = requestAnimationFrame(step);
    };

    const scrollByStep = (dir) => {
      const max = track.scrollWidth - track.clientWidth;
      const target = Math.max(0, Math.min(max, track.scrollLeft + dir * getStep()));
      animateScrollTo(target);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => scrollByStep(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByStep(1));

    /* Drag to scroll (desktop only — mobile uses native touch) */
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onDown = (e) => {
      if (window.innerWidth <= 700) return;
      if (e.target.closest('button, a')) return; // don't hijack control clicks
      isDown = true;
      moved = false;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.classList.add('dragging');
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('dragging');
    };

    track.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    track.addEventListener('mouseleave', onUp);

    /* Swallow click after a drag so links/buttons don't fire */
    track.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    /* Keyboard arrows when track is focused */
    track.tabIndex = 0;
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollByStep(1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollByStep(-1); }
    });
  }

  /* -------- Mode modal -------- */
  const modeContent = {
    play: {
      eyebrow: '01 — Play Mode',
      title: 'Stories that respond.',
      copy: 'Books read themselves and listen back. Puzzles project onto the floor and react to where a child stands. No tablets to hand over, no feeds to scroll, no ads to swipe past. When WISP hears bedtime, it dims.',
      list: [
        'Adaptive stories that respond to a child\'s voice',
        'Floor games for two or more',
        'No ads. No social. No data sold.',
        'Parents control modes from the app',
      ],
    },
    kitchen: {
      eyebrow: '02 — Kitchen Mode',
      title: 'A cook in the room with you.',
      copy: 'Tell WISP what you have and it tells you what to make. It reads recipes out at your pace, halves the quantities when you ask, suggests a swap when you\'re out of butter, and warns you when the pan is about to burn. The cookbook stand retires.',
      list: [
        'Recipes read aloud, paced to your hands',
        'Substitutions and quantity scaling, on the fly',
        'Technique tips — "fold, don\'t stir", "let it rest"',
        'Timers, temperatures, and conversions in light',
        'Voice control with wet, sticky, or busy hands',
      ],
    },
    workshop: {
      eyebrow: '03 — Workshop Mode',
      title: 'Schematics on the workbench.',
      copy: 'Cut lines onto plywood, exploded views onto the bench, dimensions onto the wall. WISP sees what you\'re doing and shows you what comes next. The manual disappears because you don\'t need it.',
      list: [
        'CNC, woodworking, and electronics overlays',
        'Cut lines that follow the material',
        'IKEA assembly without flipping pages',
        'Compatible with Fusion 360, Onshape, plain PDFs',
      ],
    },
    house: {
      eyebrow: '04 — House Mode',
      title: 'A roving eye for the house.',
      copy: 'Turn the lantern toward a problem and it draws it out in light. Point at a plant and it circles the leaf with spider mites. Point at a ceiling corner and it marks the damp before the mold. Point at the outlet running warm. The problems live in the room with you, not in an app.',
      list: [
        'Plant health — pests, rot, leaf disease',
        'Damp and mold-prone corners, before they spread',
        'Warm outlets and electrical hazards',
        'Wear, rust, and small repairs you missed',
        'On-device vision. Nothing leaves the room.',
      ],
    },
  };

  const modal = document.getElementById('mode-modal');
  const modalClose = document.getElementById('modal-close');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalTitle = document.getElementById('modal-title');
  const modalCopy = document.getElementById('modal-copy');
  const modalList = document.getElementById('modal-list');

  const openModal = (mode) => {
    const data = modeContent[mode];
    if (!data || !modal) return;
    modalEyebrow.textContent = data.eyebrow;
    modalTitle.textContent = data.title;
    modalCopy.textContent = data.copy;
    modalList.innerHTML = data.list.map((s) => `<li>${s}</li>`).join('');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-mode-link]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.modeLink));
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* -------- Reserve form: serial number + Formspree -------- */

  /* === CONFIGURE HERE ============================================
     Set this to your Formspree endpoint to receive real signups.
     Setup (60 seconds, free):
       1. Go to https://formspree.io/
       2. Sign up using jack@wooblay.com
       3. Click "+ New Form", name it "WISP Waitlist"
       4. Copy the endpoint URL (looks like https://formspree.io/f/xyzabc)
       5. Paste it below, replacing the empty string

     While empty, signups still save to localStorage so nothing is lost.
     ================================================================ */
  const RESERVE_ENDPOINT = 'https://formspree.io/f/xredonep';

  const form = document.getElementById('reserve-form');
  const success = document.getElementById('reserve-success');
  const serialEl = document.getElementById('success-serial');

  const SERIAL_KEY = 'wisp_serial';
  const COUNT_KEY = 'wisp_count';
  const STARTING_SERIAL = 347;

  const postSignup = async (payload) => {
    if (!RESERVE_ENDPOINT || !RESERVE_ENDPOINT.startsWith('http')) {
      return { ok: false, reason: 'endpoint not configured' };
    }
    try {
      const res = await fetch(RESERVE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  };

  if (form && success && serialEl) {
    /* Restore prior success state if user already reserved */
    const prior = localStorage.getItem(SERIAL_KEY);
    if (prior) {
      serialEl.textContent = prior;
      success.hidden = false;
      form.hidden = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        form.email.focus();
        form.email.style.borderColor = '#ff6b53';
        setTimeout(() => { form.email.style.borderColor = ''; }, 1400);
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent;
      if (submitBtn) { submitBtn.textContent = 'Reserving…'; submitBtn.disabled = true; }

      /* Generate serial */
      let count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
      count += 1;
      localStorage.setItem(COUNT_KEY, String(count));
      const serial = '#' + String(STARTING_SERIAL + count).padStart(5, '0');
      localStorage.setItem(SERIAL_KEY, serial);

      /* Local backup so we never lose a signup, even if remote fails */
      const list = JSON.parse(localStorage.getItem('wisp_waitlist') || '[]');
      list.push({ email, serial, at: new Date().toISOString() });
      localStorage.setItem('wisp_waitlist', JSON.stringify(list));

      /* Post to remote endpoint (Formspree, etc.) */
      const result = await postSignup({
        email,
        serial,
        source: 'wisp-waitlist',
        page: window.location.href,
        submitted_at: new Date().toISOString(),
      });

      if (!result.ok) {
        console.warn('[WISP] Remote signup failed:', result);
      }

      serialEl.textContent = serial;
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (submitBtn && originalText) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    });
  }

  /* -------- Easter egg: type "wisp" -------- */
  const eggEl = document.getElementById('easter-egg');
  let buffer = '';
  const target = 'wisp';
  document.addEventListener('keydown', (e) => {
    /* Don't interfere with typing in inputs */
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
    if (buffer === target && eggEl) {
      eggEl.classList.remove('fire');
      // force reflow so animation re-fires
      void eggEl.offsetWidth;
      eggEl.classList.add('fire');
      buffer = '';
    }
  });

  /* -------- Watch demo placeholder -------- */
  document.querySelectorAll('[data-demo]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      /* TODO: wire to a real demo video when ready */
      btn.textContent = 'Demo coming soon';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';
      setTimeout(() => {
        btn.textContent = 'Watch the demo';
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }, 1800);
    });
  });

  /* -------- Smooth scroll for anchor links (handles fixed nav offset) -------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
