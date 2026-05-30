/* =====================================================================
   RELIEF CAROUSEL — behaviour
   Rotate transition only. No external dependencies.

   ---- EDIT YOUR CONTENT HERE -----------------------------------------
   The three steps and the autoplay settings live in CONFIG below.
   Everything under "ENGINE" rarely needs touching.
   ===================================================================== */

(function () {
  'use strict';

  var CONFIG = {
    // Auto-advance on a timer. Set autoplay to true to enable.
    autoplay: false,
    autoplaySpeedSec: 3.5,   // seconds between slides when autoplay is on

    // The cards, in order. Edit text / swap icon paths freely.
    steps: [
      {
        title: 'Step 1: Evaluation',
        desc:  'Start with a complimentary personalized back taxes consultation through a quick phone call. During this call, we will assess your unique situation, explain your options, and outline a tailored plan to help you manage and reduce your tax debt.',
        icon:  'assets/icon-evaluation.png'
      },
      {
        title: 'Step 2: Solution',
        desc:  'Promptly engage with the IRS to evaluate your tax situation and devise the optimal plan for your financial future. Our dedicated professionals will work tirelessly to negotiate with the IRS on your behalf, ensuring you receive the best possible outcome and the relief you deserve.',
        icon:  'assets/icon-solution.png'
      },
      {
        title: 'Step 3: Relief',
        desc:  "Our expert tax professionals craft a customized tax strategy to deliver a compliant and effective resolution. From negotiating with the IRS to implementing a comprehensive plan that addresses your specific needs, we're here to guide you through the entire process.",
        icon:  'assets/icon-relief.png'
      }
    ]
  };

  /* ====================== ENGINE (no edits needed) ===================== */

  function initCarousel(root) {
    if (!root) return;

    var steps      = CONFIG.steps;
    var n          = steps.length;
    var TRANSITION_MS = 700;   // must match --rc-dur in styles.css
    var FADE_MS    = 220;      // wrap-around cross-fade
    var DRAG_THRESHOLD = 80;   // px before a drag counts as a swipe

    var carousel = root.querySelector('[data-rc-carousel]');
    var track    = root.querySelector('[data-rc-track]');
    var dotsWrap = root.querySelector('[data-rc-dots]');
    var prevBtn  = root.querySelector('[data-rc-prev]');
    var nextBtn  = root.querySelector('[data-rc-next]');

    var state = { active: 0, autoplayTimer: null };

    // ---- Build cards ----
    steps.forEach(function (s, i) {
      var card = document.createElement('div');
      card.className = 'rc-card';
      card.dataset.index = i;
      card.innerHTML =
        '<div class="rc-icon"><img src="' + s.icon + '" alt="' + s.title + ' icon" /></div>' +
        '<div class="rc-body">' +
          '<h3 class="rc-title">' + s.title + '</h3>' +
          '<p class="rc-desc">' + s.desc + '</p>' +
        '</div>';
      card.addEventListener('click', function () {
        if (Number(card.dataset.pos) !== 0) {
          setActive(Number(card.dataset.index));
          restartAutoplay();
        }
      });
      track.appendChild(card);
    });
    var cards = Array.prototype.slice.call(track.children);

    // ---- Build dots ----
    steps.forEach(function (_, i) {
      var b = document.createElement('button');
      b.className = 'rc-dot';
      b.setAttribute('aria-label', 'Go to step ' + (i + 1));
      b.addEventListener('click', function () { setActive(i); restartAutoplay(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    // ---- Position maths ----
    function shortestOffset(i, active) {
      var d = (i - active) % n;
      if (d >  n / 2) d -= n;
      if (d < -n / 2) d += n;
      return d;
    }

    function layout() {
      cards.forEach(function (c) {
        var i = Number(c.dataset.index);
        var newPos = shortestOffset(i, state.active);
        var oldPos = c.dataset.pos === undefined ? newPos : Number(c.dataset.pos);
        var travels = Math.abs(newPos - oldPos);

        if (travels > 2) {
          // jumping across the seam: fade in place, snap, fade back in
          c.classList.add('is-fading');
          setTimeout(function () {
            c.classList.add('no-transition');
            c.dataset.pos = String(newPos);
            void c.offsetHeight;               // force reflow
            c.classList.remove('no-transition');
            requestAnimationFrame(function () { c.classList.remove('is-fading'); });
          }, FADE_MS);
        } else {
          c.dataset.pos = String(newPos);
        }

        c.style.pointerEvents = Math.abs(newPos) > 2 ? 'none' : '';
      });

      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === state.active); });
    }

    function setActive(i) {
      var idx = ((i % n) + n) % n;
      if (idx === state.active) return;
      state.active = idx;
      layout();
    }
    function next() { setActive(state.active + 1); }
    function prev() { setActive(state.active - 1); }

    // ---- Arrows ----
    prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });
    nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });

    // ---- Autoplay ----
    function startAutoplay() {
      stopAutoplay();
      if (!CONFIG.autoplay) return;
      state.autoplayTimer = setInterval(next, CONFIG.autoplaySpeedSec * 1000);
    }
    function stopAutoplay() {
      if (state.autoplayTimer) { clearInterval(state.autoplayTimer); state.autoplayTimer = null; }
    }
    function restartAutoplay() {
      // after a manual interaction, reset the timer so it doesn't jump immediately
      if (CONFIG.autoplay) startAutoplay();
    }

    // ---- Drag / swipe ----
    var dragging = false, dragStartX = 0, dragDX = 0;

    track.addEventListener('pointerdown', function (e) {
      dragging = true; dragStartX = e.clientX; dragDX = 0;
      carousel.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dragDX = e.clientX - dragStartX;
      track.style.transform = 'translateX(' + (dragDX * 0.4) + 'px)';
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      carousel.classList.remove('is-dragging');
      track.style.transform = '';
      if (Math.abs(dragDX) > DRAG_THRESHOLD) {
        if (dragDX < 0) next(); else prev();
        restartAutoplay();
      }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // ---- Go ----
    layout();
    startAutoplay();
  }

  function boot() {
    var roots = document.querySelectorAll('.relief-carousel');
    Array.prototype.forEach.call(roots, initCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
