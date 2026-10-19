// comments.js — approved-comments list + submit form, backed by the
// portfolio-gateway Worker (GET/POST /api/portfolio/comments).
//
// Behaviour notes:
//  - Everything is inserted with textContent; comment text is never parsed as HTML.
//  - Comments are moderated server-side (status 'pending' until approved).
//  - Elements marked [data-needs-notes] stay hidden until the GET succeeds, so
//    a visitor never sees a comment box that cannot work (gateway down, route
//    not deployed, or the GitHub Pages copy of the site being blocked by CORS).
(function () {
  'use strict';

  var root = document.getElementById('comments');
  if (!root) return;

  var API = (root.getAttribute('data-api') ||
    'https://portfolio-gateway-production.jaguar999paw.workers.dev').replace(/\/$/, '');
  var SITE = root.getAttribute('data-site') || 'jaguar999paw';
  var PAGE = root.getAttribute('data-page') || 'home';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var list = root.querySelector('.note-list');
  var form = root.querySelector('form');
  var statusEl = root.querySelector('.cf-status');
  var submitBtn = root.querySelector('button[type="submit"]');
  var fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    body: form.querySelector('[name="body"]')
  };

  function reveal() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-needs-notes]'), function (el) {
      el.removeAttribute('hidden');
    });
  }

  function setFieldError(field, msg) {
    var errEl = form.querySelector('[data-error-for="' + field + '"]');
    if (errEl) errEl.textContent = msg || '';
    if (fields[field]) fields[field].classList.toggle('cf-invalid', Boolean(msg));
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg || '';
    statusEl.className = 'cf-status' + (kind ? ' cf-status-' + kind : '');
  }

  function render(comments) {
    list.textContent = '';
    if (!comments.length) {
      var empty = document.createElement('li');
      empty.className = 'note-empty';
      empty.textContent = 'No notes yet. Yours could be the first.';
      list.appendChild(empty);
      return;
    }
    comments.forEach(function (c) {
      var li = document.createElement('li');
      li.className = 'note';
      var meta = document.createElement('div');
      meta.className = 'note-meta';
      var who = document.createElement('strong');
      who.textContent = c.display_name;
      var when = document.createElement('time');
      var d = new Date(c.created_at);
      when.dateTime = d.toISOString();
      when.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      meta.appendChild(who);
      meta.appendChild(when);
      var p = document.createElement('p');
      p.textContent = c.body;
      li.appendChild(meta);
      li.appendChild(p);
      list.appendChild(li);
    });
  }

  function load() {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    var url = API + '/api/portfolio/comments?site=' + encodeURIComponent(SITE) +
      '&page=' + encodeURIComponent(PAGE);
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        render(Array.isArray(data.comments) ? data.comments : []);
        reveal();
      })
      .catch(function () { /* backend unavailable: keep the notes UI hidden */ })
      .then(function () { clearTimeout(timer); });
  }

  function validate() {
    var name = fields.name.value.trim();
    var email = fields.email.value.trim();
    var body = fields.body.value.trim();
    var errors = {};
    if (name.length < 2) errors.name = name ? 'Name is too short.' : 'Name is required.';
    else if (name.length > 100) errors.name = 'Name is too long.';
    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
    if (body.length < 3) errors.body = body ? 'Note is too short.' : 'Note is required.';
    else if (body.length > 2000) errors.body = 'Note is too long (max 2000 characters).';
    ['name', 'email', 'body'].forEach(function (f) { setFieldError(f, errors[f]); });
    return { valid: Object.keys(errors).length === 0, name: name, email: email, body: body };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = validate();
    if (!v.valid) { setStatus('Please fix the errors above.', 'error'); return; }

    submitBtn.disabled = true;
    setStatus('Sending…');

    fetch(API + '/api/portfolio/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: SITE,
        page_slug: PAGE,
        name: v.name,
        email: v.email,
        body: v.body,
        _hp: form.querySelector('[name="_hp"]').value
      })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { res: res, data: data }; });
      })
      .then(function (r) {
        if (r.res.ok && r.data.success) {
          setStatus('Thanks. Your note will appear once I have reviewed it.', 'ok');
          form.reset();
          return;
        }
        var errs = r.data.errors || {};
        ['name', 'email', 'body'].forEach(function (f) { setFieldError(f, errs[f]); });
        setStatus(errs._rate || errs._body || 'Please fix the errors above.', 'error');
      })
      .catch(function () {
        setStatus('Could not send right now. Try again later, or email me directly.', 'error');
      })
      .then(function () { submitBtn.disabled = false; });
  });

  load();
})();
