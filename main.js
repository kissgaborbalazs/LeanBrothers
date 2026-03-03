/* =====================================================
   LeanBrothers – main.js
   Navigációs logika, animációk, akkordeon, nyelv váltó.

   Tartalom forrása: /translations/hu.json, en.json
   Design:           style.css
   Szerkezet:        index.html
   ===================================================== */

// ==============================================
// KONFIGURÁCIÓ
// ==============================================
const SECTION_IDS = [
  'hero','problema','modszer','szolgaltatasok',
  'miert-mi','rolunk','gyik','cta','kapcsolat'
];

const wrapper     = document.getElementById('scroll-wrapper');
const navbar      = document.getElementById('navbar');
const sectionNav  = document.getElementById('sectionNav');
const sections    = SECTION_IDS.map(id => document.getElementById(id)).filter(Boolean);
const navLinks    = document.querySelectorAll('.nav-links a');
const backToTopBtn = document.getElementById('back-to-top');

let currentIdx  = 0;
let isScrolling = false;
const isMobile  = () => window.innerWidth <= 768;

// ==============================================
// 1. PONTNAVIGÁTOR FELÉPÍTÉSE
// ==============================================
sections.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.addEventListener('click', () => goToSection(i));
  sectionNav.appendChild(btn);
});

// ==============================================
// 2. UI FRISSÍTÉS (nav + pontok + back-to-top)
// ==============================================
function updateUI() {
  navLinks.forEach(a => {
    const idx = parseInt(a.getAttribute('data-idx') ?? '-1');
    a.classList.toggle('active', idx === currentIdx);
  });
  sectionNav.querySelectorAll('button').forEach((btn, i) => {
    btn.classList.toggle('active', i === currentIdx);
  });
  if (backToTopBtn) backToTopBtn.classList.toggle('visible', currentIdx > 0);
}

// ==============================================
// 3. SZEKCIÓ UGRÁS
// ==============================================
function goToSection(idx) {
  if (idx < 0 || idx >= sections.length) return;
  currentIdx = idx;
  if (isMobile()) {
    sections[idx].scrollIntoView({ behavior: 'smooth' });
  } else {
    isScrolling = true;
    wrapper.scrollTo({ top: sections[idx].offsetTop, behavior: 'smooth' });
    setTimeout(() => { isScrolling = false; }, 850);
  }
  updateUI();
}

// ==============================================
// 4. EGÉRGÖRGŐ (csak desktop)
// ==============================================
wrapper.addEventListener('wheel', (e) => {
  if (isMobile()) return;
  if (isScrolling) { e.preventDefault(); return; }
  e.preventDefault();
  goToSection(e.deltaY > 0 ? currentIdx + 1 : currentIdx - 1);
}, { passive: false });

// ==============================================
// 5. BILLENTYŰZET (csak desktop)
// ==============================================
document.addEventListener('keydown', (e) => {
  if (isMobile()) return;
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault(); goToSection(currentIdx + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault(); goToSection(currentIdx - 1);
  }
});

// ==============================================
// 6. INTERSECTION OBSERVER – pozíciókövetés
// ==============================================
const posObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !isScrolling) {
      const idx = sections.indexOf(entry.target);
      if (idx !== -1) { currentIdx = idx; updateUI(); }
    }
  });
}, { root: isMobile() ? null : wrapper, threshold: 0.5 });
sections.forEach(s => posObserver.observe(s));

// ==============================================
// 7. SCROLL-FADE ANIMÁCIÓ
// ==============================================
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { root: isMobile() ? null : wrapper, threshold: 0.08 });
fadeEls.forEach(el => fadeObserver.observe(el));

// ==============================================
// 8. NAVBAR ÁRNYÉK
// ==============================================
const onScroll = () => {
  const scrollTop = isMobile() ? window.scrollY : wrapper.scrollTop;
  navbar.classList.toggle('scrolled', scrollTop > 20);
};
wrapper.addEventListener('scroll', onScroll);
window.addEventListener('scroll', onScroll);

// ==============================================
// 9. HAMBURGER MENÜ
// ==============================================
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ==============================================
// 10. AVATAR POPUP – hover nagyítás
// ==============================================
const popup = document.createElement('div');
popup.className = 'avatar-popup';
const popupImg = document.createElement('img');
popup.appendChild(popupImg);
document.body.appendChild(popup);

document.querySelectorAll('.team-avatar').forEach(avatar => {
  const src = avatar.querySelector('img')?.src;
  if (!src) return;
  avatar.addEventListener('mouseenter', (e) => {
    popupImg.src = src;
    popup.classList.add('show');
    positionPopup(e);
  });
  avatar.addEventListener('mousemove', positionPopup);
  avatar.addEventListener('mouseleave', () => popup.classList.remove('show'));
});

function positionPopup(e) {
  const margin = 16, pw = 220, ph = 220;
  let x = e.clientX + margin;
  let y = e.clientY - ph / 2;
  if (x + pw > window.innerWidth - margin) x = e.clientX - pw - margin;
  y = Math.max(margin, Math.min(y, window.innerHeight - ph - margin));
  popup.style.left = x + 'px';
  popup.style.top  = y + 'px';
}

// ==============================================
// 11. GYIK MODAL POPUP
// Kártyára kattintva modal ablakban nyílik a válasz,
// előző/következő navigációval, ESC bezárással.
// ==============================================

const faqModal    = document.getElementById('faqModal');
const faqModalQ   = document.getElementById('faqModalQ');
const faqModalA   = document.getElementById('faqModalA');
const faqModalBadge = document.getElementById('faqModalBadge');
const faqCounter  = document.getElementById('faqCounter');
const faqPrevBtn  = document.getElementById('faqPrevBtn');
const faqNextBtn  = document.getElementById('faqNextBtn');

let faqCurrentIdx = 0;
let faqItems = [];   // {q, a} tömbök – a translations-ból vagy a DOM-ból töltve

// Betölti a kérdéseket a translations objektumból vagy DOM-ból
function buildFaqItems() {
  // Ha van betöltött translation, abból dolgozik
  if (translations && translations.faq && translations.faq.items) {
    faqItems = translations.faq.items.map(item => ({ q: item.q, a: item.a }));
    return;
  }
  // Fallback: DOM-ból olvassa ki a data-hu (vagy data-en) attribútumokat
  const lang = currentLang || 'hu';
  faqItems = Array.from(document.querySelectorAll('#faqGrid .faq-q')).map(btn => ({
    q: btn.getAttribute('data-' + lang) || btn.textContent.trim(),
    a: ''
  }));
}

function openFaqModal(idx) {
  buildFaqItems();
  faqCurrentIdx = idx;
  renderFaqModal();
  faqModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFaqModal() {
  faqModal.classList.remove('open');
  document.body.style.overflow = '';
}

function renderFaqModal() {
  const total  = faqItems.length;
  const item   = faqItems[faqCurrentIdx] || {};
  const lang   = currentLang || 'hu';
  const badge  = lang === 'hu' ? 'GYIK' : 'FAQ';
  const ofWord = lang === 'hu' ? '/' : '/';

  faqModalBadge.textContent = `${badge} ${faqCurrentIdx + 1} ${ofWord} ${total}`;
  faqCounter.textContent    = `${faqCurrentIdx + 1} / ${total}`;
  faqModalQ.textContent     = item.q || '';
  faqModalA.textContent     = item.a || '';

  faqPrevBtn.disabled = faqCurrentIdx === 0;
  faqNextBtn.disabled = faqCurrentIdx === total - 1;

  // Újraindítja az animációt
  const box = faqModal.querySelector('.faq-modal-box');
  box.style.animation = 'none';
  box.offsetHeight;  // reflow
  box.style.animation = '';
}

function faqNavigate(dir) {
  const next = faqCurrentIdx + dir;
  if (next < 0 || next >= faqItems.length) return;
  faqCurrentIdx = next;
  renderFaqModal();
}

// Overlay kattintás → bezárás
faqModal?.addEventListener('click', (e) => {
  if (e.target === faqModal) closeFaqModal();
});

// ESC → bezárás (bővíti a meglévő kezelőt)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && faqModal?.classList.contains('open')) closeFaqModal();
  if (e.key === 'ArrowLeft'  && faqModal?.classList.contains('open')) faqNavigate(-1);
  if (e.key === 'ArrowRight' && faqModal?.classList.contains('open')) faqNavigate(1);
});

// ==============================================
// 12. NYELV VÁLTÓ – JSON-alapú i18n
// Betölt: /translations/{lang}.json
// Frissít minden [data-i18n] attribútummal rendelkező elemet
// ==============================================
let currentLang = localStorage.getItem('lb_lang') || 'hu';
let translations = {};

async function loadLang(lang) {
  try {
    const res = await fetch(`translations/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem('lb_lang', lang);
    applyTranslations();
    updateLangUI();
  } catch (err) {
    // Fallback: régi data-hu/data-en attribútumos rendszer
    console.warn('JSON betöltés sikertelen, fallback módba kapcsolva:', err);
    applyDataAttributes(lang);
    updateLangUI();
  }
}

function applyTranslations() {
  const t = translations;
  if (!t || Object.keys(t).length === 0) return;

  // Oldal title + meta description
  if (t.meta) {
    document.title = t.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t.meta.description);
  }

  // HTML lang attribútum
  document.getElementById('html-root')?.setAttribute('lang', currentLang);

  // Minden [data-i18n] elem feltöltése
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');    // pl. "nav.cta"
    const val = getNestedKey(t, key);
    if (val === undefined) return;
    if (typeof val === 'string') {
      el.innerHTML.includes('<') || val.includes('<')
        ? (el.innerHTML = val)
        : (el.textContent = val);
    }
  });

  // Pontnavigátor tooltipek
  const sectionLabels = {
    hu: ['Hero','A probléma','Módszerünk','Szolgáltatások','Miért mi','Csapat','GYIK','CTA','Kapcsolat'],
    en: ['Hero','The Problem','Our Method','Services','Why Us','Team','FAQ','CTA','Contact']
  };
  const labels = sectionLabels[currentLang] || sectionLabels.hu;
  sectionNav.querySelectorAll('button').forEach((btn, i) => {
    btn.title = labels[i] || '';
    btn.setAttribute('aria-label', labels[i] || '');
  });
  navbar.querySelector('.hamburger')?.setAttribute(
    'aria-label', currentLang === 'hu' ? 'Menü' : 'Menu'
  );
}

// Fallback: régi data-hu / data-en attribútumok (ha JSON nem elérhető)
function applyDataAttributes(lang) {
  document.querySelectorAll(`[data-${lang}]`).forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (!text) return;
    text.includes('<') ? (el.innerHTML = text) : (el.textContent = text);
  });
  document.getElementById('html-root')?.setAttribute('lang', lang);
  document.title = lang === 'hu'
    ? 'LeanBrothers – Lean & AI Tanácsadás KKV-knak'
    : 'LeanBrothers – Lean & AI Consulting for SMEs';
}

function updateLangUI() {
  document.getElementById('btn-hu')?.classList.toggle('active', currentLang === 'hu');
  document.getElementById('btn-en')?.classList.toggle('active', currentLang === 'en');
}

// Segédfüggvény: "nav.cta" → translations.nav.cta
function getNestedKey(obj, keyPath) {
  return keyPath.split('.').reduce((acc, k) => acc?.[k], obj);
}

// ==============================================
// INDÍTÁS
// ==============================================
updateUI();

// Próbáljuk JSON-ból betölteni, fallback a data-attribútumokra
loadLang(currentLang);

// ==============================================
// 13. KAPCSOLATI POPUP MODAL
// Formspree async submit, validáció, bilinguális
// ==============================================

const modal        = document.getElementById('contactModal');
const contactForm  = document.getElementById('contactForm');
const submitBtn    = document.getElementById('modalSubmitBtn');
const successBox   = document.getElementById('modalSuccess');
const errorBox     = document.getElementById('modalErrorMsg');
const formLangEl   = document.getElementById('formLang');

function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Frissítsük a rejtett language mezőt
  if (formLangEl) formLangEl.value = currentLang || 'hu';
  // Fókusz az első mezőre (akadálymentesség)
  setTimeout(() => document.getElementById('fieldName')?.focus(), 280);
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Kattintás az overlay-re → bezárás
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ESC billentyű → bezárás
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});

// Inline validáció – mezőnként elhagyáskor
['fieldName','fieldEmail'].forEach(id => {
  document.getElementById(id)?.addEventListener('blur', () => validateField(id));
});

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const ok = el.checkValidity() && el.value.trim() !== '';
  el.classList.toggle('error', !ok);
  return ok;
}

// Form submit – Formspree async (JSON)
contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validáció
  const nameOk  = validateField('fieldName');
  const emailOk = validateField('fieldEmail');
  const consent = document.getElementById('fieldConsent')?.checked;

  if (!nameOk || !emailOk || !consent) {
    if (!consent) {
      document.getElementById('fieldConsent')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // Loading állapot
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  errorBox?.classList.remove('show');

  try {
    const formData = new FormData(contactForm);
    const response = await fetch(contactForm.action, {
      method:  'POST',
      body:    formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      // Siker
      contactForm.style.display = 'none';
      modal.querySelector('.modal-header').style.display = 'none';
      successBox?.classList.add('show');
      contactForm.reset();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    errorBox?.classList.add('show');
    console.error('Form submit hiba:', err);
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

// Modal újranyitáskor visszaállítjuk az állapotot
modal?.addEventListener('transitionend', () => {
  if (!modal.classList.contains('open')) {
    setTimeout(() => {
      contactForm.style.display = '';
      const header = modal.querySelector('.modal-header');
      if (header) header.style.display = '';
      successBox?.classList.remove('show');
      errorBox?.classList.remove('show');
    }, 100);
  }
});
