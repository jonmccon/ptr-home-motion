/* =============================================================
   ROTATE VIDEO CAROUSEL — logic (vanilla JS, no dependencies)
   ============================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     1. CONFIG — edit these to swap videos / behaviour
     ----------------------------------------------------------- */
  const VIDEOS = [
    { id: 'OuIS6H7y40c', title: 'Short 01' },
    { id: '7LOwQBEuYMw', title: 'Short 02' },
    { id: 'ANDcdraQc_c', title: 'Short 03' },
    { id: 'YDGs8lDET0I', title: 'Short 04' },
    { id: 'f5_FljsGp1Y', title: 'Short 05' },
  ];

  const SETTINGS = {
    autoplay: true,       // auto-advance through the carousel
    autoplaySeconds: 3.5, // fixed seconds between auto-advances
    startIndex: 0,       // which video is centered on load (0-based)
  };

  /* -----------------------------------------------------------
     2. INTERNALS — no need to edit below here
     ----------------------------------------------------------- */
  const FADE_MS = 220;          // wrap-around fade duration (matches styles.css)
  const DRAG_THRESHOLD = 80;    // px before a drag counts as a swipe

  const root = document.getElementById('vc-root');
  if (!root) return;

  const track = root.querySelector('#vc-track');
  const dotsWrap = root.querySelector('#vc-dots');
  const prevBtn = root.querySelector('#vc-prev');
  const nextBtn = root.querySelector('#vc-next');
  const carousel = root.querySelector('.vc-carousel');

  const videos = normalizeVideos(VIDEOS);
  if (!videos.length) return;

  const n = videos.length;
  const state = {
    active: clampIndex(SETTINGS.startIndex),
    timer: null,
    playingIndex: -1,
    loadingIndex: -1,
  };

  function clampIndex(i) { return ((i % n) + n) % n; }
  function pad(num) { return String(num).padStart(2, '0'); }
  function thumb(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  function isVideoBusy() { return state.loadingIndex !== -1 || state.playingIndex !== -1; }

  /* ---- Build the cards ---- */
  videos.forEach((video, i) => {
    const card = document.createElement('div');
    card.className = 'vc-card';
    card.dataset.index = String(i);
    card.innerHTML =
      '<div class="vc-card__media">' +
        '<img class="vc-card__thumb" src="' + thumb(video.id) + '" alt="' + escapeHtml(video.title) + '" />' +
      '</div>' +
      '<button class="vc-card__close" type="button" aria-label="Close video and resume carousel">Close</button>' +
      '<button class="vc-card__play" type="button" aria-label="Play ' + escapeHtml(video.title) + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>' +
      '</button>' +
      '<div class="vc-card__chrome">' +
        '<div class="vc-card__num">' + pad(i + 1) + ' / ' + pad(n) + '</div>' +
        '<div class="vc-card__name">' + escapeHtml(video.title) + '</div>' +
      '</div>';

    card.addEventListener('click', (e) => {
      if (e.target.closest('.vc-card__close')) {
        closeAndResume(Number(card.dataset.index));
        return;
      }
      if (e.target.closest('iframe')) return;           // let the player handle its own clicks
      const pos = Number(card.dataset.pos);
      if (pos === 0) {
        playActive();
      } else {
        if (isVideoBusy()) return;
        setActive(Number(card.dataset.index));
        restartAutoplay();
      }
    });

    track.appendChild(card);
  });
  const cards = Array.from(track.children);

  /* ---- Build the dots ---- */
  videos.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'vc-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Go to video ' + (i + 1));
    dot.addEventListener('click', () => {
      if (isVideoBusy()) return;
      setActive(i);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  /* ---- Position math (shortest path around the loop) ---- */
  function shortestOffset(i, active) {
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  /* ---- Layout: assign every card its position slot ---- */
  function layout() {
    cards.forEach((card) => {
      const i = Number(card.dataset.index);
      const newPos = shortestOffset(i, state.active);
      const oldPos = card.dataset.pos === undefined ? newPos : Number(card.dataset.pos);
      const travels = Math.abs(newPos - oldPos);

      card.dataset.hidden = Math.abs(newPos) > 2 ? 'true' : 'false';

      if (travels > 2) {
        // Wrap-around: would visually fly across the stage.
        // Fade out in place, snap to the new slot, fade back in.
        card.classList.add('vc-fade-out');
        setTimeout(() => {
          card.classList.add('vc-no-anim');
          card.dataset.pos = String(newPos);
          void card.offsetHeight;                 // commit the snap without animating
          card.classList.remove('vc-no-anim');
          requestAnimationFrame(() => card.classList.remove('vc-fade-out'));
        }, FADE_MS);
      } else {
        card.dataset.pos = String(newPos);
      }
    });

    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === state.active));
  }

  /* ---- Video playback (only the centered card can play) ---- */
  function stopPlayback(index) {
    if (index < 0 || index >= n) return;
    const card = cards[index];
    const video = videos[index];
    card.querySelector('.vc-card__media').innerHTML =
      '<img class="vc-card__thumb" src="' + thumb(video.id) + '" alt="' + escapeHtml(video.title) + '" />';
    card.querySelector('.vc-card__play').style.display = '';
    card.querySelector('.vc-card__play').disabled = false;
    card.dataset.loading = 'false';
    card.dataset.playing = 'false';
    if (state.loadingIndex === index) state.loadingIndex = -1;
    if (state.playingIndex === index) state.playingIndex = -1;
  }

  function closeAndResume(index) {
    if (index < 0 || index >= n) return;
    if (state.loadingIndex !== index && state.playingIndex !== index) return;
    stopPlayback(index);
    setAutoplay(true);
  }

  function playActive() {
    if (state.playingIndex === state.active) return;
    if (state.loadingIndex === state.active) return;
    if (state.playingIndex !== -1) stopPlayback(state.playingIndex);

    const index = state.active;
    const video = videos[index];
    const card = cards[index];
    const media = card.querySelector('.vc-card__media');
    const playBtn = card.querySelector('.vc-card__play');
    const iframe = document.createElement('iframe');

    state.loadingIndex = index;
    card.dataset.loading = 'true';
    card.dataset.playing = 'false';
    playBtn.disabled = true;

    iframe.src = buildEmbedUrl(video.id);
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'eager';

    iframe.addEventListener('load', () => {
      state.loadingIndex = -1;
      state.playingIndex = index;
      card.dataset.loading = 'false';
      card.dataset.playing = 'true';
      playBtn.style.display = 'none';
      playBtn.disabled = false;
    }, { once: true });

    iframe.addEventListener('error', () => {
      stopPlayback(index);
    }, { once: true });

    media.innerHTML = '';
    media.appendChild(iframe);

    setAutoplay(false);   // don't yank the video away mid-watch
  }

  /* ---- Navigation ---- */
  function setActive(i, opts) {
    opts = opts || {};
    if (isVideoBusy() && !opts.force) return;
    const newIndex = clampIndex(i);
    if (newIndex === state.active && !opts.force) return;

    if (state.playingIndex !== -1 && state.playingIndex !== newIndex) {
      stopPlayback(state.playingIndex);
      state.playingIndex = -1;
    }
    state.active = newIndex;
    layout();
  }
  function next() { setActive(state.active + 1); }
  function prev() { setActive(state.active - 1); }

  prevBtn.addEventListener('click', () => {
    if (isVideoBusy()) return;
    prev();
    restartAutoplay();
  });
  nextBtn.addEventListener('click', () => {
    if (isVideoBusy()) return;
    next();
    restartAutoplay();
  });

  /* ---- Autoplay (fixed cadence) ---- */
  function setAutoplay(on) {
    SETTINGS.autoplay = on;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (on) state.timer = setInterval(next, SETTINGS.autoplaySeconds * 1000);
  }
  function restartAutoplay() { if (SETTINGS.autoplay) setAutoplay(true); }

  /* ---- Drag / swipe ---- */
  let dragging = false;
  let dragStartX = 0;
  let dragDX = 0;

  track.addEventListener('pointerdown', (e) => {
    if (e.target.closest('iframe')) return;   // don't hijack player interactions
    if (isVideoBusy()) return;
    dragging = true;
    dragStartX = e.clientX;
    dragDX = 0;
    carousel.classList.add('vc-dragging');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragDX = e.clientX - dragStartX;
    track.style.transform = 'translateX(' + dragDX * 0.4 + 'px)';
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    carousel.classList.remove('vc-dragging');
    track.style.transform = '';
    if (Math.abs(dragDX) > DRAG_THRESHOLD) {
      const steps = Math.min(2, Math.round(Math.abs(dragDX) / 140));
      if (dragDX < 0) setActive(state.active + steps);
      else setActive(state.active - steps);
      restartAutoplay();
    }
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('pointerleave', endDrag);

  /* ---- Small helper ---- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function buildEmbedUrl(id) {
    const params = new URLSearchParams({
      autoplay: '1',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1',
    });

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      params.set('origin', window.location.origin);
    }

    return 'https://www.youtube-nocookie.com/embed/' + id + '?' + params.toString();
  }

  function normalizeVideos(items) {
    const normalized = [];
    items.forEach((item, i) => {
      const source = item && (item.id || item.url || item.video);
      const id = extractYouTubeId(source);
      if (!id) return;
      normalized.push({
        id,
        title: item.title || ('Video ' + (i + 1)),
      });
    });
    return normalized;
  }

  function extractYouTubeId(source) {
    if (!source) return '';
    const raw = String(source).trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    let url;
    try {
      url = new URL(raw);
    } catch (err) {
      return '';
    }

    const host = url.hostname.replace(/^www\./, '');
    const path = url.pathname;

    if (host === 'youtu.be') {
      const id = path.split('/').filter(Boolean)[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
    }

    if (host !== 'youtube.com' && host !== 'm.youtube.com') return '';

    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    const parts = path.split('/').filter(Boolean);
    const candidates = [];
    if (parts[0] === 'embed' && parts[1]) candidates.push(parts[1]);
    if (parts[0] === 'shorts' && parts[1]) candidates.push(parts[1]);
    if (parts[0] === 'watch' && parts[1]) candidates.push(parts[1]);

    for (let i = 0; i < candidates.length; i += 1) {
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidates[i])) return candidates[i];
    }

    return '';
  }

  /* ---- Init ---- */
  layout();
  if (SETTINGS.autoplay) setAutoplay(true);
})();
