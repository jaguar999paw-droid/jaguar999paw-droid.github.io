/*!
 * Portfolio interactivity layer
 * Vanilla JS — no dependencies, WebView-safe (this page also runs inside a
 * Telegram Mini App, which has crashed in the past on position:fixed and
 * backdrop-filter — see nav CSS comments — so this file avoids both).
 */
(function () {
  'use strict';

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
   * Telegram Mini App bootstrap
   * ------------------------------------------------------------------- */
  function initTelegram() {
    var twa = window.Telegram && window.Telegram.WebApp;
    if (twa) {
      twa.ready();
      twa.expand();
    }
  }

  /* ---------------------------------------------------------------------
   * Scroll reveal — staggered, unobserves once animated (perf), skips
   * entirely for prefers-reduced-motion users.
   * ------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
   * Nav: active-section highlight (IntersectionObserver) + scrolled state
   * (rAF-throttled scroll listener, passive).
   * ------------------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector('nav');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!nav || !links.length) return;

    var linkByHash = {};
    links.forEach(function (a) { linkByHash[a.getAttribute('href')] = a; });

    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    function setActive(hash) {
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === hash); });
    }

    if (sections.length && typeof IntersectionObserver !== 'undefined') {
      var sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive('#' + entry.target.id);
          });
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
      );
      sections.forEach(function (s) { sectionObserver.observe(s); });
    }

    // rAF-throttled scroll: only toggle the shrink class, cheap + smooth.
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle('nav-scrolled', window.scrollY > 12);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
   * Animated stat counters — parses leading digits from the existing
   * text ("155+", "4th", "8"), counts up once when scrolled into view.
   * ------------------------------------------------------------------- */
  function animateCount(el) {
    var raw = el.textContent.trim();
    var match = raw.match(/^(\d+)(.*)$/);
    if (!match) return; // nothing numeric to animate, leave as-is

    var target = parseInt(match[1], 10);
    var suffix = match[2] || '';
    var duration = 900;
    var start = null;

    function easeOutQuad(t) { return t * (2 - t); }

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var value = Math.round(easeOutQuad(progress) * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var stats = document.querySelectorAll('.stat-num');
    if (!stats.length) return;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') return;

    var container = document.querySelector('.hero-stats');
    if (!container) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stats.forEach(animateCount);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(container);
  }

  /* ---------------------------------------------------------------------
   * Magnetic hover glow on project cards — CSS custom properties driven
   * by pointermove, rAF-throttled so we never queue more than one paint.
   * Delegated at a common ancestor rather than per-card listeners.
   * ------------------------------------------------------------------- */
  function initTilt() {
    var host = document.querySelector('#projects');
    if (!host) return;

    var raf = null;
    var activeEl = null;
    var pendingX = 0;
    var pendingY = 0;

    function paint() {
      raf = null;
      if (!activeEl) return;
      activeEl.style.setProperty('--mx', pendingX + 'px');
      activeEl.style.setProperty('--my', pendingY + 'px');
    }

    host.addEventListener(
      'pointermove',
      function (e) {
        var card = e.target.closest('.proj-card, .project-featured');
        if (!card) return;
        var rect = card.getBoundingClientRect();
        pendingX = e.clientX - rect.left;
        pendingY = e.clientY - rect.top;
        activeEl = card;
        if (!raf) raf = requestAnimationFrame(paint);
      },
      { passive: true }
    );

    host.addEventListener(
      'pointerover',
      function (e) {
        var card = e.target.closest('.proj-card, .project-featured');
        if (card) card.classList.add('tilt-active');
      },
      { passive: true }
    );

    host.addEventListener(
      'pointerout',
      function (e) {
        var card = e.target.closest('.proj-card, .project-featured');
        var toCard = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.proj-card, .project-featured');
        if (card && card !== toCard) card.classList.remove('tilt-active');
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------
   * Event delegation: one click listener on document handles unrelated
   * interactive bits (stack-badge copy-to-clipboard) instead of wiring
   * a listener per element.
   * ------------------------------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older WebViews without the async Clipboard API.
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function initDelegatedClicks() {
    document.addEventListener('click', function (e) {
      var badge = e.target.closest('.stack-badge');
      if (!badge || badge.classList.contains('copied')) return;

      var label = badge.textContent.trim();
      var original = label;

      copyText(label)
        .then(function () {
          badge.textContent = 'Copied ✓';
          badge.classList.add('copied');
        })
        .catch(function () {
          // Clipboard denied/unavailable — fail silently, no broken UI.
        })
        .finally(function () {
          setTimeout(function () {
            badge.textContent = original;
            badge.classList.remove('copied');
          }, 1100);
        });
    });
  }

  /* ---------------------------------------------------------------------
   * Async backend status — pings the Cloudflare Pages Function with a
   * timeout (AbortController) and a couple of retries with backoff.
   * Resolves quietly to "offline" on GitHub Pages, where /api doesn't
   * exist, and to "online" on the Cloudflare deployment.
   * ------------------------------------------------------------------- */
  function fetchWithTimeout(url, ms, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    var opts = Object.assign({ signal: controller.signal, cache: 'no-store' }, options || {});
    return fetch(url, opts).finally(function () {
      clearTimeout(timer);
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function pingBackendWithRetry(attempts, timeoutMs) {
    for (var i = 0; i < attempts; i++) {
      try {
        var res = await fetchWithTimeout('/api/hello', timeoutMs);
        if (res.ok) return true;
      } catch (err) {
        // network error or abort — fall through to retry/backoff
      }
      if (i < attempts - 1) await wait(300 * Math.pow(2, i)); // 300ms, 600ms...
    }
    return false;
  }

  async function initBackendStatus() {
    var dot = document.getElementById('api-status');
    if (!dot) return;

    var online = await pingBackendWithRetry(3, 2500);
    dot.classList.add(online ? 'online' : 'offline');
    dot.title = online ? 'backend online' : 'backend unavailable (static hosting has no /api)';
  }

  /* ---------------------------------------------------------------------
   * Contact form — client-side validation + submission to /api/contact.
   *
   * Frontend/backend contract:
   *   POST /api/contact  { name, email, subject, message, company }
   *   -> 200 { ok: true }
   *   -> 422 { ok: false, errors: { field: "message", ... } }   (validation)
   *   -> 4xx/5xx { ok: false, error: "message" }                (server/relay)
   *
   * `company` is a honeypot: it's always sent, always empty for real users.
   * The Pages Function (functions/api/contact.js) re-validates everything
   * server-side — client validation here is only a UX layer, never trusted
   * as the source of truth.
   * ------------------------------------------------------------------- */
  var CF_VALIDATORS = {
    name: function (v) {
      if (v.trim().length < 2) return 'Enter your name (at least 2 characters).';
      if (v.trim().length > 80) return 'Keep it under 80 characters.';
      return null;
    },
    email: function (v) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v.trim())) return 'Enter a valid email address.';
      return null;
    },
    subject: function (v) {
      if (v.trim().length < 3) return 'Subject is too short.';
      if (v.trim().length > 120) return 'Keep the subject under 120 characters.';
      return null;
    },
    message: function (v) {
      if (v.trim().length < 20) return 'Message needs at least 20 characters.';
      if (v.trim().length > 4000) return 'Message is too long (4000 character max).';
      return null;
    },
  };

  function cfSetFieldState(group, errorEl, message) {
    if (message) {
      group.classList.add('invalid');
      group.classList.remove('valid');
      errorEl.textContent = message;
    } else {
      group.classList.remove('invalid');
      group.classList.add('valid');
      errorEl.textContent = '';
    }
  }

  function cfValidateField(form, fieldName) {
    var input = form.elements[fieldName];
    var group = form.querySelector('[data-field="' + fieldName + '"]');
    var errorEl = document.getElementById('cf-' + fieldName + '-error');
    if (!input || !group || !errorEl) return true;

    var message = CF_VALIDATORS[fieldName] ? CF_VALIDATORS[fieldName](input.value) : null;
    cfSetFieldState(group, errorEl, message);
    return !message;
  }

  function cfValidateAll(form) {
    var fields = ['name', 'email', 'subject', 'message'];
    var valid = true;
    fields.forEach(function (f) {
      if (!cfValidateField(form, f)) valid = false;
    });
    return valid;
  }

  function cfShowStatus(statusEl, kind, message) {
    statusEl.textContent = message;
    statusEl.className = 'form-status show ' + kind;
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var submitBtn = document.getElementById('cf-submit');
    var statusEl = document.getElementById('cf-status');
    var messageInput = document.getElementById('cf-message');
    var messageCount = document.getElementById('cf-message-count');

    // Live character count for the message field.
    if (messageInput && messageCount) {
      messageInput.addEventListener('input', function () {
        messageCount.textContent = messageInput.value.length;
      });
    }

    // Validate on blur (don't nag the user while they're still typing the
    // first draft of a field) and re-validate on input once a field has
    // already been marked invalid (so the error clears the moment it's fixed).
    ['name', 'email', 'subject', 'message'].forEach(function (fieldName) {
      var input = form.elements[fieldName];
      if (!input) return;

      input.addEventListener('blur', function () {
        cfValidateField(form, fieldName);
      });

      input.addEventListener('input', function () {
        var group = form.querySelector('[data-field="' + fieldName + '"]');
        if (group && group.classList.contains('invalid')) {
          cfValidateField(form, fieldName);
        }
      });
    });

    // Staggered entrance for the form fields once the form scrolls into view —
    // separate from the site-wide .reveal system since these are nested
    // inside a single .reveal container and need their own stagger.
    var groups = Array.prototype.slice.call(form.querySelectorAll('.form-group'));
    if (groups.length && !prefersReducedMotion && typeof IntersectionObserver !== 'undefined') {
      var groupObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            groups.forEach(function (g, i) {
              setTimeout(function () { g.classList.add('in-view'); }, i * 90);
            });
            groupObserver.disconnect();
          });
        },
        { threshold: 0.2 }
      );
      groupObserver.observe(form);
    } else {
      groups.forEach(function (g) { g.classList.add('in-view'); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!cfValidateAll(form)) {
        cfShowStatus(statusEl, 'error', 'Please fix the highlighted fields and try again.');
        return;
      }

      var payload = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        subject: form.elements.subject.value.trim(),
        message: form.elements.message.value.trim(),
        company: form.elements.company.value, // honeypot — should always be empty
      };

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      statusEl.className = 'form-status'; // hide any previous status while sending

      fetchWithTimeout('/api/contact', 10000, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            cfShowStatus(statusEl, 'success', 'Message sent — thanks for reaching out. I\u2019ll reply within 24\u201348 hours.');
            form.reset();
            groups.forEach(function (g) { g.classList.remove('valid', 'invalid'); });
            if (messageCount) messageCount.textContent = '0';
            return;
          }

          if (result.data && result.data.errors) {
            // Server-side validation caught something the client missed —
            // surface it against the right field.
            Object.keys(result.data.errors).forEach(function (field) {
              var group = form.querySelector('[data-field="' + field + '"]');
              var errorEl = document.getElementById('cf-' + field + '-error');
              if (group && errorEl) cfSetFieldState(group, errorEl, result.data.errors[field]);
            });
            cfShowStatus(statusEl, 'error', 'Please fix the highlighted fields and try again.');
            return;
          }

          cfShowStatus(
            statusEl,
            'error',
            (result.data && result.data.error) || 'Something went wrong sending your message. Please email me directly instead.'
          );
        })
        .catch(function () {
          cfShowStatus(statusEl, 'error', 'Network error — please check your connection and try again, or email me directly.');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        });
    });
  }

  /* ---------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTelegram();
    initReveal();
    initNav();
    initCounters();
    if (!prefersReducedMotion) initTilt();
    initDelegatedClicks();
    initBackendStatus();
    initContactForm();
  });
})();
