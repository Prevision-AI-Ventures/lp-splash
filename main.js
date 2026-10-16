(function () {
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('#nav');
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu';
  }
  menu.addEventListener('click', function () {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close' : 'Menu';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const type = document.querySelector('#review-type');
  document.querySelectorAll('[data-offering]').forEach(a => a.addEventListener('click', function () {
    type.value = a.dataset.offering;
    document.querySelector('#email-ready').hidden = true;
  }));
  const form = document.querySelector('#inquiry-form');
  const ready = document.querySelector('#email-ready');
  form.addEventListener('change', () => { ready.hidden = true; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const role = document.querySelector('#role').value;
    const body = `Hello,\n\nI would like to discuss: ${type.value}.\nMy role: ${role}.\n\nGeneral stage and purpose: [add a brief, non-confidential description]\nDocuments available: [describe the types of documents]\nAny deadline: [add the date and time zone, if applicable]\n\nPlease confirm the scope and next steps for this review.\n\nNo confidential records are attached.`;
    document.querySelector('#email-link').href = `mailto:precision-ai-ventures@proton.me,info@legalprecision.ai?subject=${encodeURIComponent('LegalPrecision AI inquiry: '+type.value)}&body=${encodeURIComponent(body)}`;
    ready.hidden = false;
    ready.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
})();
