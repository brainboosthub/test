(() => {
  'use strict';

  const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const IMAGE_API_URL = WEB_APP_URL + '?mode=images';

  const NEWS_API_URL = WEB_APP_URL + '?mode=news';

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.textContent = isOpen ? '✕' : '☰';
    });

    document.querySelectorAll('.main-nav a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      });
    });
  }

async function loadWebsiteImages() {
  try {
    const response = await fetch(
      IMAGE_API_URL + '&_t=' + Date.now(),
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success === false) {
      throw new Error(
        result.message || 'โหลดรูปภาพไม่สำเร็จ'
      );
    }

    const images = result.data || result;

    // B2 = URL โลโก้
    // B3 = ชื่อเว็บไซต์
    // B4 = URL รูปหัวเว็บ
    // B5 = หัวข้อบรรทัดที่ 1
    // B6 = หัวข้อบรรทัดที่ 2
    const brandIconUrl =
      String(images.brandIcon || '').trim();

    const brandName =
      String(images.siteTitle || '').trim();

    const heroOverlayUrl =
      String(images.heroImage || '').trim();

    const heroTitleLine1 =
      String(images.heroTitle1 || '').trim();

    const heroTitleLine2 =
      String(images.heroTitle2 || '').trim();

    if (brandIconUrl) {
      document
        .querySelectorAll('[data-website-brand-icon]')
        .forEach(icon => {
          icon.textContent = '';
          icon.style.backgroundImage =
            `url("${brandIconUrl}")`;

          icon.style.backgroundSize = 'cover';
          icon.style.backgroundPosition = 'center';
          icon.style.backgroundRepeat = 'no-repeat';
        });
    }

    if (brandName) {
      document
        .querySelectorAll('[data-website-brand-name]')
        .forEach(name => {
          name.textContent = brandName;
        });

      document.title = brandName;
    }

if (heroOverlayUrl) {
  const overlay = document.getElementById('websiteHeroOverlay');

  if (overlay) {
    const heroImage = new Image();

    heroImage.onload = () => {
      overlay.style.backgroundImage =
        `linear-gradient(
          90deg,
          rgba(5,28,44,.96) 0%,
          rgba(5,28,44,.79) 40%,
          rgba(5,28,44,.1) 78%
        ),
        url("${heroOverlayUrl}")`;

      overlay.style.backgroundSize = 'cover';
      overlay.style.backgroundPosition = 'center';
      overlay.style.backgroundRepeat = 'no-repeat';

      overlay.classList.add('website-hero-ready');
    };

    heroImage.onerror = () => {
      overlay.classList.add('website-hero-ready');
    };

    heroImage.src = heroOverlayUrl;
  }
}

    if (heroTitleLine1) {
      const line1 =
        document.getElementById('heroTitleLine1');

      if (line1) {
        line1.textContent = heroTitleLine1;
      }
    }

    if (heroTitleLine2) {
      const line2 =
        document.getElementById('heroTitleLine2');

      if (line2) {
        line2.textContent = heroTitleLine2;
      }
    }

  } catch (error) {
    console.error(
      'โหลด URL รูปภาพเว็บไซต์ไม่สำเร็จ:',
      error
    );
  }
}


  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  let newsSlides = [];
  let newsIndex = 0;
  let newsTimer = null;
  let newsAutoEnabled = false;
  let newsAutoStoppedByUser = false;
  let newsPopupOpen = false;

  function stopNewsAutoSlide() {
    if (newsTimer) {
      clearInterval(newsTimer);
      newsTimer = null;
    }
  }

  function startNewsAutoSlide() {
    stopNewsAutoSlide();

    if (
      !newsAutoEnabled ||
      newsAutoStoppedByUser ||
      newsPopupOpen ||
      newsSlides.length <= 1
    ) {
      return;
    }

    newsTimer = setInterval(() => {
      newsIndex = (newsIndex + 1) % newsSlides.length;
      renderNews();
    }, 3000);
  }

  function stopNewsAutoByUser() {
    newsAutoStoppedByUser = true;
    stopNewsAutoSlide();
  }

  function normalizeNewsItem(item, index) {
    if (typeof item === 'string') {
      return {
        newsNo: index + 1,
        title: `ข่าวสาร ${index + 1}`,
        image: String(item).trim(),
        detail: '',
        detailUrl: '',
        date: ''
      };
    }

    const source = item && typeof item === 'object' ? item : {};

    return {
      newsNo: source.newsNo || source.no || source.id || index + 1,
      title: String(
        source.title || source.heading || source.mainTitle || `ข่าวสาร ${index + 1}`
      ).trim(),
      image: String(
        source.image || source.url || source.imageUrl || source.poster || ''
      ).trim(),
      detail: String(
        source.detail || source.description || source.summary || ''
      ).trim(),
      detailUrl: String(
        source.detailUrl || source.link || source.moreUrl || source.urlDetail || ''
      ).trim(),
      date: String(
        source.date || source.newsDate || source.publishedAt || ''
      ).trim()
    };
  }

  async function loadNews() {
    const slider = document.getElementById('newsSlider');
    const slidesBox = document.getElementById('newsSlides');
    if (!slider || !slidesBox) return;

    try {
      const response = await fetch(
        NEWS_API_URL + '&_t=' + Date.now(),
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'โหลดข่าวสารไม่สำเร็จ');
      }

      const raw = result.slides || result.data?.slides || result.data || [];

      newsSlides = (Array.isArray(raw) ? raw : [])
        .map(normalizeNewsItem)
        .filter(item => item.image);

      const mode = String(
        result.mode || result.data?.mode || ''
      ).toLowerCase();

      if (!newsSlides.length) {
        slider.classList.add('is-empty');
        return;
      }

      slider.classList.remove('is-empty');
      slider.classList.toggle(
        'single-slide',
        mode !== 'block' || newsSlides.length <= 1
      );

      newsIndex = 0;
      newsAutoEnabled = mode === 'block' && newsSlides.length > 1;
      newsAutoStoppedByUser = false;
      newsPopupOpen = false;

      renderNews();
      startNewsAutoSlide();

    } catch (error) {
      slidesBox.innerHTML =
        `<div class="news-loading">โหลดข่าวสารไม่สำเร็จ: ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderNews() {
    const slidesBox = document.getElementById('newsSlides');
    const dots = document.getElementById('newsDots');
    if (!slidesBox || !dots || !newsSlides.length) return;

    slidesBox.innerHTML = newsSlides.map((item, index) => `
      <div
        class="news-slide ${index === newsIndex ? 'active' : ''}"
        data-news-slide="${index}"
        role="button"
        tabindex="${index === newsIndex ? '0' : '-1'}"
        aria-label="เปิดรายละเอียด ${escapeHtml(item.title)}">
        <img
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.title)}"
          loading="lazy">
      </div>`).join('');

    slidesBox.querySelectorAll('[data-news-slide]').forEach(slide => {
      const openCurrentNews = () => {
        const index = Number(slide.dataset.newsSlide);
        if (!Number.isInteger(index) || !newsSlides[index]) return;
        openNewsPopup(newsSlides[index]);
      };

      slide.addEventListener('click', openCurrentNews);
      slide.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCurrentNews();
        }
      });
    });

    dots.innerHTML = newsSlides.map((_, index) => `
      <button
        class="news-dot ${index === newsIndex ? 'active' : ''}"
        type="button"
        data-news-dot="${index}"
        aria-label="ข่าวลำดับที่ ${index + 1}">
      </button>`).join('');

    dots.querySelectorAll('[data-news-dot]').forEach(btn => {
      btn.addEventListener('click', () => {
        stopNewsAutoByUser();
        newsIndex = Number(btn.dataset.newsDot);
        renderNews();
      });
    });
  }

async function openNewsPopup(item) {
  if (!item) return;

  newsPopupOpen = true;
  stopNewsAutoSlide();

  const hasDetailUrl = Boolean(
    String(item.detailUrl || '').trim()
  );

  const safeTitle = escapeHtml(
    item.title || 'ข่าวสาร'
  );

  const safeImage = escapeHtml(
    item.image || ''
  );

  const safeDetail = escapeHtml(
    item.detail || 'ไม่มีรายละเอียดเพิ่มเติม'
  ).replace(/\n/g, '<br>');

  const safeDate = escapeHtml(
    item.date || ''
  );

  const popupHtml = `
    <div class="news-popup-content">

      ${safeDate ? `
        <div class="news-popup-date">
          <i class="fa fa-calendar" aria-hidden="true"></i>
          ${safeDate}
        </div>
      ` : ''}

      ${safeImage ? `
        <img
          class="news-popup-image"
          src="${safeImage}"
          alt="${safeTitle}">
      ` : ''}

      <div class="news-popup-detail">
        ${safeDetail}
      </div>

    </div>
  `;

  try {
    const result = await Swal.fire({
      title: safeTitle,
      html: popupHtml,

      showCloseButton: true,
      showCancelButton: false,

      showConfirmButton: hasDetailUrl,
      confirmButtonText: 'รายละเอียด',

      allowOutsideClick: true,
      allowEscapeKey: true,

      width: 760,

      customClass: {
        popup: 'news-popup-box',
        title: 'news-popup-title',
        closeButton: 'news-close-btn',
        confirmButton: 'news-detail-btn'
      },

      buttonsStyling: false
    });

    if (result.isConfirmed && hasDetailUrl) {
      window.open(
        item.detailUrl,
        '_blank',
        'noopener,noreferrer'
      );
    }

  } catch (error) {
    console.error('เปิด Popup ข่าวไม่สำเร็จ:', error);

  } finally {
    newsPopupOpen = false;

    /*
     * เมื่อปิด Popup ให้ Slider กลับมาทำงาน
     * เฉพาะกรณีที่ผู้ใช้ไม่ได้กด Prev, Next หรือ Dot
     */
    startNewsAutoSlide();
  }
}
  function bindNewsControls() {
    const slider = document.getElementById('newsSlider');
    const prev = document.getElementById('newsPrev');
    const next = document.getElementById('newsNext');

    slider?.addEventListener('mouseenter', () => {
      stopNewsAutoSlide();
    });

    slider?.addEventListener('mouseleave', () => {
      startNewsAutoSlide();
    });

    prev?.addEventListener('click', () => {
      if (!newsSlides.length) return;
      stopNewsAutoByUser();
      newsIndex = (newsIndex - 1 + newsSlides.length) % newsSlides.length;
      renderNews();
    });

    next?.addEventListener('click', () => {
      if (!newsSlides.length) return;
      stopNewsAutoByUser();
      newsIndex = (newsIndex + 1) % newsSlides.length;
      renderNews();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNewsControls();

    loadWebsiteImages();
    loadNews();

  });
})();
