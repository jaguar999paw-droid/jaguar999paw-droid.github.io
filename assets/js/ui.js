// ui.js — mobile nav toggle, scroll-snap sliders, lazy iframe previews.
// No dependencies. Written ES5-style to match main.js (Telegram/Android WebView safe).
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  var nav = document.querySelector('nav');
  var toggle = nav && nav.querySelector('.nav-toggle');
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('.nav-links a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Sliders ---------- */
  function initSlider(root) {
    var track = root.querySelector('.slider-track');
    if (!track || !track.children.length) return;
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-slider-prev]');
    var next = root.querySelector('[data-slider-next]');
    var dotsWrap = root.querySelector('.slider-dots');
    var dots = [];

    function offsetOf(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }

    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var left = offsetOf(i);
      if (track.scrollTo) track.scrollTo({ left: left, behavior: 'smooth' });
      else track.scrollLeft = left;
    }

    function current() {
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var d = Math.abs(offsetOf(i) - track.scrollLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }

    function update() {
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      var idx = atEnd ? slides.length - 1 : current();
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
      dots.forEach(function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    if (dotsWrap) {
      slides.forEach(function (_s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slider-dot';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }
    if (prev) prev.addEventListener('click', function () { goTo(current() - 1); });
    if (next) next.addEventListener('click', function () { goTo(current() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-slider]'), initSlider);

  /* ---------- Lazy iframe previews (writeups) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-preview]'), function (btn) {
    btn.addEventListener('click', function () {
      var frame = document.getElementById(btn.getAttribute('data-preview'));
      if (!frame) return;
      var opening = frame.hasAttribute('hidden');
      if (opening) {
        var f = frame.querySelector('iframe');
        if (f && !f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src'));
        frame.removeAttribute('hidden');
      } else {
        frame.setAttribute('hidden', '');
      }
      btn.setAttribute('aria-expanded', String(opening));
      var label = btn.querySelector('.label');
      if (label) label.textContent = opening ? 'Hide preview' : 'Preview here';
    });
  });
})();
