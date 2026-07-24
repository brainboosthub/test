(() => {
  'use strict';

  /* URL /exec ของโปรเจกต์ Apps Script ห้องเรียน */
  const CLASSROOM_WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbysu0yLm0UuP0t5HN_PouiI2-C9OR9TD9XI31hKcdqLpfscWlAAumMEx6JcXukh3twGJg/exec';

  const API_URL = CLASSROOM_WEB_APP_URL + '?mode=classroomBox';

  let videos = [];
  let pageIndex = 0;
  let cardsPerPage = 3;
  let pageCount = 1;
  let timer = null;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function isConfigured() {
    return /^https:\/\/script\.google\.com\/.*\/exec(?:\?|$)/i.test(CLASSROOM_WEB_APP_URL);
  }

  async function loadClassroomBox() {
    const track = $('classroomTrack');
    const openAll = $('classroomOpenAll');
    if (!track || !openAll) return;

    openAll.href = CLASSROOM_WEB_APP_URL;

    if (!isConfigured()) {
      track.innerHTML = '<div class="classroom-loading">กรุณากำหนด URL Web App ห้องเรียนใน classroom-box.js</div>';
      return;
    }

    try {
      const response = await fetch(API_URL + '&_t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
      }

      const rawVideos = result.videos || result.data?.videos || [];
      videos = Array.isArray(rawVideos) ? rawVideos.filter(item => item && item.thumb) : [];

      renderVideos();
      bindControls();
      startAutoSlide();
    } catch (error) {
      console.error('Classroom Box:', error);
      track.innerHTML = `
        <div class="classroom-loading classroom-error">
          โหลดวิดีโอห้องเรียนไม่สำเร็จ<br>
          <small>${esc(error.message)}</small>
        </div>`;
      $('classroomPrev')?.setAttribute('hidden', '');
      $('classroomNext')?.setAttribute('hidden', '');
      $('classroomDots').innerHTML = '';
    }
  }

  function renderVideos() {
    const track = $('classroomTrack');

    if (!videos.length) {
      track.innerHTML = '<div class="classroom-loading">ยังไม่มีรายการวิดีโอในห้องเรียน</div>';
      $('classroomDots').innerHTML = '';
      return;
    }

    track.innerHTML = videos.map(video => `
      <article class="classroom-card">
        <button class="classroom-video-link" type="button" data-classroom-open aria-label="เปิดห้องเรียน ${esc(video.title || '')}">
          <span class="classroom-card-image">
            <img src="${esc(video.thumb)}" alt="${esc(video.title || 'วิดีโอห้องเรียน')}" loading="lazy"
              onerror="this.onerror=null;this.src='https://placehold.co/640x360?text=Video';">
            <span class="classroom-play" aria-hidden="true">▶</span>
            ${video.subject ? `<span class="classroom-subject">${esc(video.subject)}</span>` : ''}
          </span>
          <span class="classroom-card-body">
            <strong>${esc(video.title || 'วิดีโอการเรียนรู้')}</strong>
            <small>คลิกเพื่อเข้าสู่ห้องเรียน</small>
          </span>
        </button>
      </article>`).join('');

    track.querySelectorAll('[data-classroom-open]').forEach(button => {
      button.addEventListener('click', openClassroom);
    });

    updateResponsiveCount();
    goToPage(0, false);
  }

  function updateResponsiveCount() {
    if (window.matchMedia('(max-width: 620px)').matches) cardsPerPage = 1;
    else if (window.matchMedia('(max-width: 960px)').matches) cardsPerPage = 2;
    else cardsPerPage = 3;

    pageCount = Math.max(1, Math.ceil(videos.length / cardsPerPage));
    if (pageIndex >= pageCount) pageIndex = pageCount - 1;
    renderDots();
  }

  function goToPage(index, restart = true) {
    if (!videos.length) return;

    pageIndex = (index + pageCount) % pageCount;
    const firstCard = $('classroomTrack').querySelector('.classroom-card');
    if (!firstCard) return;

    const gap = 18;
    const distance = (firstCard.getBoundingClientRect().width + gap) * cardsPerPage;
    $('classroomTrack').style.transform = `translateX(-${pageIndex * distance}px)`;
    renderDots();

    if (restart) startAutoSlide();
  }

  function renderDots() {
    const dots = $('classroomDots');
    if (!dots) return;

    dots.innerHTML = Array.from({ length: pageCount }, (_, index) => `
      <button class="classroom-dot ${index === pageIndex ? 'active' : ''}"
        type="button" data-classroom-page="${index}" aria-label="หน้าที่ ${index + 1}"></button>`).join('');

    dots.querySelectorAll('[data-classroom-page]').forEach(button => {
      button.addEventListener('click', () => goToPage(Number(button.dataset.classroomPage)));
    });

    const disableArrows = videos.length <= cardsPerPage;
    $('classroomPrev').disabled = disableArrows;
    $('classroomNext').disabled = disableArrows;
  }

  function bindControls() {
    $('classroomPrev').onclick = () => goToPage(pageIndex - 1);
    $('classroomNext').onclick = () => goToPage(pageIndex + 1);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const previous = cardsPerPage;
        updateResponsiveCount();
        goToPage(previous === cardsPerPage ? pageIndex : 0, false);
      }, 150);
    });
  }

  function startAutoSlide() {
    clearInterval(timer);
    if (pageCount <= 1) return;
    timer = setInterval(() => goToPage(pageIndex + 1, false), 4500);
  }

  function openClassroom() {
    window.open(CLASSROOM_WEB_APP_URL, '_blank', 'noopener');
  }

  document.addEventListener('DOMContentLoaded', loadClassroomBox);
})();
