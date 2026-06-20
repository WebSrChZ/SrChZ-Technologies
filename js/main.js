/* SrChZ Technologies — interactions */
(() => {
  'use strict';
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  const toTop = document.getElementById('toTop');
  const progress = document.getElementById('progress');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* sticky nav background + back-to-top + scroll progress */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 24);
    if (toTop) {
      const show = y > 600;
      toTop.hidden = false;
      toTop.classList.toggle('show', show);
    }
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); menu.hidden = true; };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.hidden = open;
    toggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* back to top */
  if (toTop) toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* reveal on scroll */
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* count-up stats */
  const counters = document.querySelectorAll('.stat-n[data-count]');
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target + suffix; return; }
    const dur = 1100, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  }

  /* current year */
  const y = document.getElementById('year');
  if (y) y.textContent = '© ' + new Date().getFullYear() + ' Rafael Cordeiro';

  /* active section highlight in nav */
  const sections = [...document.querySelectorAll('section[id]')];
  const links = new Map([...document.querySelectorAll('.nav-links a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && links.size) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          const a = links.get(en.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* lead form -> Supabase (insert-only, tabela srchz_leads) */
  const SB_URL = 'https://aqbwwiarinvmgqfaqvnr.supabase.co';
  const SB_KEY = 'sb_publishable_N0Xq3_7aAqpKlNQ3rgUh3w_7Svto18O';
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    const statusEl = document.getElementById('leadStatus');
    const setStatus = (msg, cls) => { statusEl.textContent = msg; statusEl.className = 'lead-status' + (cls ? ' ' + cls : ''); };
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(leadForm);
      if ((fd.get('website') || '').trim()) return;          // honeypot: provável bot
      const name = (fd.get('name') || '').trim();
      const contact = (fd.get('contact') || '').trim();
      if (!name || contact.length < 3) { setStatus('Preencha nome e um contato válido.', 'err'); return; }

      const btn = leadForm.querySelector('.lead-btn');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Enviando…'; setStatus('', '');
      try {
        const res = await fetch(SB_URL + '/rest/v1/srchz_leads', {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': 'Bearer ' + SB_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            name, contact,
            segment: (fd.get('segment') || '').trim() || null,
            message: (fd.get('message') || '').trim() || null,
            user_agent: (navigator.userAgent || '').slice(0, 400)
          })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        leadForm.reset();
        setStatus('✓ Recebido! Rafael entra em contato em breve.', 'ok');
      } catch (err) {
        setStatus('Não consegui enviar agora. Tente pelo WhatsApp acima.', 'err');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  }
})();
