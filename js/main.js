/* ============================================
   YETI HEATING & COOLING — Main JavaScript
   ============================================ */

// ── Page load transition ──
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.page-overlay');
  if (overlay) {
    setTimeout(() => overlay.classList.add('loaded'), 100);
  }

  initNavbar();
  initHamburger();
  initReveal();
  initParticles();
  initParallax();
  initContactForm();
  initBackToTop();
  initCounters();
  initBlogFilters();
});

// ── Navbar scroll effect ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Mobile hamburger ──
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── Scroll reveal ──
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => observer.observe(el));
}

// ── Floating particles in hero ──
function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;

  const count = window.innerWidth < 768 ? 12 : 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = (Math.random() > 0.7 ? 3 : 2) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

// ── Subtle parallax on hero ──
function initParallax() {
  const hero = document.querySelector('#hero');
  const heroContent = document.querySelector('.hero-content');
  if (!hero || !heroContent || window.innerWidth < 768) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        if (scrollY < heroHeight) {
          heroContent.style.transform = `translateY(${scrollY * 0.25}px)`;
          heroContent.style.opacity = 1 - (scrollY / heroHeight) * 1.4;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ── Animated number counters ──
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── Contact form ──
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      const success = document.getElementById('form-success');
      if (success) success.style.display = 'block';
    }, 1200);
  });
}

// ── Back to top ──
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Blog filters ──
function initBlogFilters() {
  const filters = document.querySelectorAll('.blog-filter');
  const cards = document.querySelectorAll('.blog-card[data-category]');
  if (!filters.length || !cards.length) return;

  filters.forEach(f => {
    f.addEventListener('click', () => {
      filters.forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      const cat = f.dataset.filter;

      cards.forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.style.display = match ? '' : 'none';
        card.style.opacity = '0';
        if (match) {
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease';
            card.style.opacity = '1';
          });
        }
      });
    });
  });
}

// ── Smooth hover tilt on cards ──
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.service-card, .testimonial-card').forEach(card => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;

    if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) {
      card.style.transform = `perspective(1000px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) translateY(-4px)`;
    }
  });
});

document.addEventListener('mouseleave', () => {
  document.querySelectorAll('.service-card, .testimonial-card').forEach(card => {
    card.style.transform = '';
  });
});

// Reset tilt when mouse leaves card
document.querySelectorAll && document.querySelectorAll('.service-card, .testimonial-card').forEach(card => {
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
