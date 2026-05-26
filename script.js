/* HEARTH · interactivity */

// Particle field
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let particles = [];
  const COUNT = window.innerWidth < 760 ? 40 : 80;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3 * dpr,
        vy: (Math.random() - 0.5) * 0.3 * dpr,
        r: (Math.random() * 1.5 + 0.5) * dpr,
        c: Math.random() > 0.5 ? '255,107,53' : '167,139,250',
      });
    }
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.c}, 0.6)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120 * dpr) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,107,53, ${0.15 * (1 - d / (120 * dpr))})`;
          ctx.lineWidth = 0.5 * dpr;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init(); tick();
})();

// Counter animation
(function () {
  const els = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1600;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    }
  }, { threshold: 0.3 });
  els.forEach((el) => io.observe(el));
})();

// Scroll reveal
(function () {
  document.documentElement.classList.add('js-on');
  const sels = ['.section-head','.module','.step','.specs-copy','.specs-card','.tier','.quote','.reserve-copy','.reserve-form','.faq-list details','.footer-cta-inner > *'];
  const els = document.querySelectorAll(sels.join(','));
  els.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 6) * 60 + 'ms';
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
})();

// Module hover glow
(function () {
  document.querySelectorAll('.module').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
})();

// Smooth scroll
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// Reserve form
(function () {
  const form = document.getElementById('reserve-form');
  const toast = document.getElementById('toast');
  if (!form) return;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3600);
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = (data.get('email') || '').toString().trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showToast('Enter a valid email to reserve.');
      form.querySelector('input[type=email]').focus();
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem('hearth_waitlist') || '[]');
      list.push({ email, city: data.get('city') || '', tier: data.get('tier') || '', at: new Date().toISOString() });
      localStorage.setItem('hearth_waitlist', JSON.stringify(list));
    } catch (_) {}
    form.innerHTML = `
      <div style="text-align:center; padding: 24px 8px;">
        <div style="width:64px; height:64px; margin:0 auto 18px; border-radius:50%; background: linear-gradient(135deg, #ff6b35, #f04e98); display:grid; place-items:center; box-shadow: 0 20px 40px -10px rgba(255,107,53,0.5);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <h3 style="font-family:'Space Grotesk', sans-serif; font-size:24px; margin:0 0 8px;">You're #12,848.</h3>
        <p style="color:var(--text-2); margin:0 0 24px;">We've held your spot. Check ${email} for your confirmation and Founders Slack invite.</p>
        <div style="display:inline-flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <span style="padding:8px 14px; border-radius:999px; background:rgba(255,107,53,0.1); border:1px solid rgba(255,107,53,0.25); color:var(--accent-2); font-size:13px;">$99 deposit &middot; refundable</span>
          <span style="padding:8px 14px; border-radius:999px; background:rgba(255,255,255,0.05); border:1px solid var(--line); color:var(--text-2); font-size:13px;">Ships Q4 2026</span>
        </div>
      </div>
    `;
    showToast(`You're in. Watch ${email}.`);
  });
})();

// Nav shadow on scroll
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  function onScroll() {
    nav.style.boxShadow = window.scrollY > 8 ? '0 20px 40px -20px rgba(0,0,0,0.6)' : 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
