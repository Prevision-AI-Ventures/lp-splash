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

// AI in the Courts newsletter signup
(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;
  var status = document.getElementById('signup-status');
  var consentText = document.getElementById('signup-consent-text').textContent.trim();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'signup-status';
    var email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'Please enter a valid email address.'; status.className = 'signup-status error'; form.elements.email.focus(); return;
    }
    if (!form.elements.consent.checked) {
      status.textContent = 'Please tick the box so we can email you.'; status.className = 'signup-status error'; form.elements.consent.focus(); return;
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; status.textContent = 'Signing you up...';
    fetch('/api/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, consent: true, consent_text: consentText, page: location.href, company: form.elements.company.value })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.body && res.body.error) || 'error');
        form.reset(); status.textContent = 'Thanks, you\u2019re signed up.';
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again, or email precision-ai-ventures@proton.me.'; status.className = 'signup-status error';
      })
      .finally(function () { btn.disabled = false; });
  });
})();
