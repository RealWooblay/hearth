/* ==========================================================
   LUMA — interactions
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

  /* -------- Modes horizontal scroll progress -------- */
  const track = document.querySelector('.modes-track');
  const progress = document.querySelector('.modes-progress-fill');
  if (track && progress) {
    const updateProgress = () => {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max <= 0 ? 1 : Math.min(1, Math.max(0, track.scrollLeft / max));
      // Always show some fill so it doesn't look broken at start
      const visualPct = 0.18 + pct * 0.82;
      progress.style.width = (visualPct * 100).toFixed(1) + '%';
    };
    track.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    /* Allow horizontal scroll via mouse wheel on desktop */
    track.addEventListener('wheel', (e) => {
      if (window.innerWidth <= 700) return; // mobile is vertical
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  /* -------- Mode modal -------- */
  const modeContent = {
    play: {
      eyebrow: '01 — Play Mode',
      title: 'Stories that respond.',
      copy: 'Books read themselves and listen back. Puzzles project onto the floor and react to where a child stands. No tablets to hand over, no feeds to scroll, no ads to swipe past. When LUMA hears bedtime, it dims.',
      list: [
        'Adaptive stories that respond to a child\'s voice',
        'Floor games for two or more',
        'No ads. No social. No data sold.',
        'Parents control modes from the app',
      ],
    },
    kitchen: {
      eyebrow: '02 — Kitchen Mode',
      title: 'The recipe is on the counter.',
      copy: 'Project a recipe onto the worktop and your hands stay where they are. Ask a question with batter on them and LUMA hears. Timers live on the backsplash. The cookbook stand retires.',
      list: [
        'Recipes projected step-by-step onto the counter',
        'Voice control with wet, sticky, or busy hands',
        'Timers, conversions, substitutions in light',
        'Works with your existing recipe library',
      ],
    },
    workshop: {
      eyebrow: '03 — Workshop Mode',
      title: 'Schematics on the workbench.',
      copy: 'Cut lines onto plywood, exploded views onto the bench, dimensions onto the wall. LUMA sees what you\'re doing and shows you what comes next. The manual disappears because you don\'t need it.',
      list: [
        'CNC, woodworking, and electronics overlays',
        'Cut lines that follow the material',
        'IKEA assembly without flipping pages',
        'Compatible with Fusion 360, Onshape, plain PDFs',
      ],
    },
    bedroom: {
      eyebrow: '04 — Bedroom Mode',
      title: 'Ceilings become skies.',
      copy: 'Stars when the lights go down. A gentle sunrise on the wall when the alarm starts. Wind-down stories that fade as you fall asleep. Mornings that don\'t shout.',
      list: [
        'Star-field and weather projections on the ceiling',
        'Sunrise alarm via projected light, not sound',
        'Wind-down audio stories that auto-stop',
        'Sleep-safe — dim warm light, no blue',
      ],
    },
    studio: {
      eyebrow: '05 — Studio Mode',
      title: 'The mirror that thinks.',
      copy: 'Yoga form notes projected onto the floor next to you. Posture cues on the wall. Sketch overlays for life drawing. LUMA watches the way a good teacher does, and intervenes only when it should.',
      list: [
        'Yoga, pilates, strength training form feedback',
        'Posture and movement coaching, on-device',
        'Sketch and life-drawing overlays',
        'Private. Video never leaves the room.',
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

  /* -------- Reserve form: serial number + persistence -------- */
  const form = document.getElementById('reserve-form');
  const success = document.getElementById('reserve-success');
  const serialEl = document.getElementById('success-serial');

  const SERIAL_KEY = 'luma_serial';
  const COUNT_KEY = 'luma_count';
  const STARTING_SERIAL = 347; // small ego hit — we're "real" already

  if (form && success && serialEl) {
    /* Restore prior success state if user already reserved */
    const prior = localStorage.getItem(SERIAL_KEY);
    if (prior) {
      serialEl.textContent = prior;
      success.hidden = false;
      form.hidden = true;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        form.email.focus();
        form.email.style.borderColor = '#ff6b53';
        setTimeout(() => { form.email.style.borderColor = ''; }, 1400);
        return;
      }

      /* Increment local counter — TODO: wire to Resend / Apps Script for real persistence
         Resend endpoint example:
           fetch('/api/reserve', { method: 'POST', body: JSON.stringify({email}) })
         Google Apps Script:
           fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({email}) })
      */
      let count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
      count += 1;
      localStorage.setItem(COUNT_KEY, String(count));

      const serial = '#' + String(STARTING_SERIAL + count).padStart(5, '0');
      localStorage.setItem(SERIAL_KEY, serial);

      /* Also persist the email locally so we don't lose signups before backend exists */
      const list = JSON.parse(localStorage.getItem('luma_waitlist') || '[]');
      list.push({ email, serial, at: new Date().toISOString() });
      localStorage.setItem('luma_waitlist', JSON.stringify(list));

      serialEl.textContent = serial;
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* -------- Easter egg: type "luma" -------- */
  const eggEl = document.getElementById('easter-egg');
  let buffer = '';
  const target = 'luma';
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
