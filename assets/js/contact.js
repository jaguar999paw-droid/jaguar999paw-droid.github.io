// Contact form validation + submit handler.
//
// Mirrors the rules enforced server-side in
// portfolio-gateway/src/index.js (POST /api/portfolio/contact).
// This file only exists to give the user instant feedback - the
// gateway re-validates everything and is the actual source of truth,
// since client JS can always be bypassed or disabled.

(() => {
  const GATEWAY = 'https://portfolio-gateway-production.jaguar999paw.workers.dev';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const form = document.getElementById('contact-form');
  if (!form) return; // form not on this page

  const fields = {
    name: form.querySelector('#cf-name'),
    email: form.querySelector('#cf-email'),
    message: form.querySelector('#cf-message'),
  };
  const submitBtn = form.querySelector('#cf-submit');
  const statusEl = form.querySelector('#cf-status');

  function setFieldError(field, msg) {
    const errEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = fields[field];
    if (errEl) errEl.textContent = msg || '';
    if (inputEl) inputEl.classList.toggle('cf-invalid', Boolean(msg));
  }

  function validate() {
    const errors = {};
    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const message = fields.message.value.trim();

    if (!name) errors.name = 'Name is required.';
    else if (name.length < 2) errors.name = 'Name is too short.';
    else if (name.length > 100) errors.name = 'Name is too long.';

    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    else if (email.length > 254) errors.email = 'Email is too long.';

    if (!message) errors.message = 'Message is required.';
    else if (message.length < 10) errors.message = 'Message is too short (min 10 characters).';
    else if (message.length > 5000) errors.message = 'Message is too long (max 5000 characters).';

    ['name', 'email', 'message'].forEach((f) => setFieldError(f, errors[f]));

    return { valid: Object.keys(errors).length === 0, name, email, message };
  }

  // Live validation once a field has been touched, so errors clear
  // as the user fixes them instead of only appearing on submit.
  ['name', 'email', 'message'].forEach((f) => {
    fields[f].addEventListener('blur', validate);
    fields[f].addEventListener('input', () => {
      if (fields[f].classList.contains('cf-invalid')) validate();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { valid, name, email, message } = validate();
    if (!valid) {
      statusEl.textContent = 'Please fix the errors above.';
      statusEl.className = 'cf-status cf-status-error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = 'Sending...';
    statusEl.className = 'cf-status';

    try {
      const res = await fetch(`${GATEWAY}/api/portfolio/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          _hp: form.querySelector('#cf-hp').value, // honeypot, should stay empty
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        statusEl.textContent = "Message sent - I'll get back to you soon.";
        statusEl.className = 'cf-status cf-status-ok';
        form.reset();
      } else if (data.errors) {
        Object.entries(data.errors).forEach(([field, msg]) => setFieldError(field, msg));
        statusEl.textContent = 'Please fix the errors above.';
        statusEl.className = 'cf-status cf-status-error';
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      statusEl.textContent = "Couldn't send right now - try emailing me directly instead.";
      statusEl.className = 'cf-status cf-status-error';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
