/**
 * Pablo Martín Altera - Landing Page & Portfolio Interactive Controller
 * Hardened & Audited Version
 * Security Features:
 *  - Strict theme allowlist (prevents DOM attribute pollution / CSS injection)
 *  - Safe DOM node creation (eliminates innerHTML sink / DOM XSS vectors)
 *  - Input sanitization & CRLF stripping for external mailto / WhatsApp links
 *  - Reverse Tabnabbing mitigation via noopener,noreferrer
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initCounters();
  initProjectFilters();
  initCopyButtons();
  initContactHelper();
  initBackToTop();
});

/* ---------- THEME SWITCHER (DARK / LIGHT) ---------- */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const htmlElement = document.documentElement;
  const VALID_THEMES = ['dark', 'light'];

  // Safe read from localStorage with validation
  let savedTheme = null;
  try {
    const rawTheme = localStorage.getItem('pablo_theme');
    if (VALID_THEMES.includes(rawTheme)) {
      savedTheme = rawTheme;
    }
  } catch (e) {
    // LocalStorage might be disabled in private/sandboxed mode
  }

  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      try {
        localStorage.setItem('pablo_theme', newTheme);
      } catch (e) {}
    });
  }

  function applyTheme(theme) {
    const safeTheme = VALID_THEMES.includes(theme) ? theme : 'dark';
    htmlElement.setAttribute('data-theme', safeTheme);
    if (themeIcon) {
      if (safeTheme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Cambiar a modo claro');
      } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Cambiar a modo oscuro');
      }
    }
  }
}

/* ---------- NAVBAR & SCROLLSPY ---------- */
function initNavbar() {
  const navbar = document.querySelector('.navbar-custom');
  const navLinks = document.querySelectorAll('#navbarMain .nav-link:not(.btn)');
  const navCollapse = document.getElementById('navbarMain');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  // Auto close mobile nav on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap?.Collapse?.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  // IntersectionObserver for active link highlighting
  const sections = document.querySelectorAll('header[id], section[id]');
  if (!sections.length) return;

  const observerOptions = {
    threshold: 0.25,
    rootMargin: '-80px 0px -40% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));
}

/* ---------- ANIMATED STAT COUNTERS (SECURE DOM INSERTION) ---------- */
function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  let hasAnimated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        statNumbers.forEach(counter => {
          const rawTarget = counter.getAttribute('data-target');
          const target = parseInt(rawTarget, 10);
          if (isNaN(target)) return;

          const prefix = counter.getAttribute('data-prefix') || '';
          const suffix = counter.getAttribute('data-suffix') || '';
          const duration = 1800; // ms
          const stepTime = 30;
          const totalSteps = duration / stepTime;
          const increment = target / totalSteps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }

            // Safe DOM insertion without innerHTML sink
            counter.textContent = '';
            const textNode = document.createTextNode(`${prefix}${Math.floor(current)}`);
            counter.appendChild(textNode);

            if (suffix) {
              const highlightSpan = document.createElement('span');
              highlightSpan.className = 'stat-highlight';
              highlightSpan.textContent = suffix;
              counter.appendChild(highlightSpan);
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-grid');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

/* ---------- PROJECT & EXPERIENCE FILTERING ---------- */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const expCards = document.querySelectorAll('.exp-card-modern');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter') || 'all';

      expCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        const categoryList = categories.split(' ').map(c => c.trim());

        if (filterValue === 'all' || categoryList.includes(filterValue)) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ---------- COPY TO CLIPBOARD WITH TOAST ---------- */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('[data-copy]');
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer = null;

  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy') || '';
      const label = btn.getAttribute('data-label') || 'Información';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`¡${label} copiado al portapapeles!`);
        }).catch(() => {
          fallbackCopy(textToCopy, label);
        });
      } else {
        fallbackCopy(textToCopy, label);
      }
    });
  });

  function fallbackCopy(text, label) {
    const tempInput = document.createElement('input');
    tempInput.setAttribute('readonly', '');
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    tempInput.style.top = '0';
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(`¡${label} copiado!`);
    } catch (err) {
      showToast('Error al copiar');
    }
    document.body.removeChild(tempInput);
  }

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

/* ---------- CONTACT MESSAGE GENERATOR (SANITIZED) ---------- */
function initContactHelper() {
  const sendWhatsAppBtn = document.getElementById('btnSendWhatsApp');
  const sendEmailBtn = document.getElementById('btnSendEmail');
  const clientNameInput = document.getElementById('clientName');
  const clientContactInput = document.getElementById('clientContact');
  const clientMessageInput = document.getElementById('clientMessage');

  // Input sanitizer: strips control characters and CRLF to prevent header/URL injection
  function sanitizeSingleLine(str) {
    if (!str) return '';
    return str.replace(/[\r\n\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
  }

  function sanitizeMultiLine(str) {
    if (!str) return '';
    return str.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, 2000);
  }

  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = sanitizeSingleLine(clientNameInput?.value);
      const contact = sanitizeSingleLine(clientContactInput?.value);
      const msg = sanitizeMultiLine(clientMessageInput?.value);

      let text = 'Hola Pablo, estuve viendo tu portfolio profesional.';
      if (name) text += ` Mi nombre es ${name}.`;
      if (contact) text += ` Mi contacto: ${contact}.`;
      if (msg) text += ` Consulta: ${msg}`;
      else text += ' Me gustaría conversar sobre una oportunidad / proyecto.';

      const encodedText = encodeURIComponent(text);
      // Hardened window.open with reverse tabnabbing defense
      window.open(`https://wa.me/5491160127001?text=${encodedText}`, '_blank', 'noopener,noreferrer');
    });
  }

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = sanitizeSingleLine(clientNameInput?.value);
      const contact = sanitizeSingleLine(clientContactInput?.value);
      const msg = sanitizeMultiLine(clientMessageInput?.value);

      const safeSubject = `Consulta Profesional - ${name || 'Contacto Portfolio'}`;
      let body = `Hola Pablo,\n\n`;
      if (msg) body += `${msg}\n\n`;
      else body += `Me gustaría contactarte para evaluar una oportunidad o proyecto conjunto.\n\n`;
      if (name) body += `Nombre: ${name}\n`;
      if (contact) body += `Contacto / Empresa: ${contact}\n`;

      window.location.href = `mailto:pabloaltera@gmail.com?subject=${encodeURIComponent(safeSubject)}&body=${encodeURIComponent(body)}`;
    });
  }
}

/* ---------- BACK TO TOP ---------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
