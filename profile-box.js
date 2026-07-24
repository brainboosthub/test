(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const FALLBACK_PHOTO = 'https://static.wixstatic.com/media/a503e5_9064df4bf13044dab24382c889fa7d87~mv2.png';

  const $ = id => document.getElementById(id);

  function getStudent() {
    try {
      return JSON.parse(localStorage.getItem('LEARN_STUDENT') || 'null');
    } catch (_) {
      return null;
    }
  }

  function safePhoto(url) {
    const value = String(url || '').trim();
    return value || FALLBACK_PHOTO;
  }
function hideProfileBox() {
  const profileBox = $('profileBox');
  const backdrop = $('profilePopupBackdrop');

  if (profileBox) {
    profileBox.classList.add('editing-profile');
  }

  if (backdrop) {
    backdrop.classList.add('editing-profile');
  }
}

function resetProfileBox() {
  const profileBox = document.getElementById('profileBox');
  const backdrop = document.getElementById('profilePopupBackdrop');

  if (profileBox) {
    profileBox.classList.remove(
      'profile-box-popup-open',
      'editing-profile'
    );
  }

  if (backdrop) {
    backdrop.classList.remove(
      'show',
      'editing-profile',
      'active',
      'open'
    );

    backdrop.style.display = 'none';
  }

  document.body.classList.remove('profile-popup-open');
}
  async function getTotalHours(studentId) {
    if (!studentId) return 0;

    const url = new URL(API_URL);
    url.searchParams.set('mode', 'learning');
    url.searchParams.set('action', 'getStudentTotalHours');
    url.searchParams.set('studentId', studentId);
    url.searchParams.set('_t', Date.now());

    const response = await fetch(url.toString(), { cache: 'no-store' });
    const result = await response.json();

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || `โหลด${window.LearningBase?.getHourText?.() || 'ข้อมูลกิจกรรม'}ไม่สำเร็จ`);
    }

    const value = Object.prototype.hasOwnProperty.call(result, 'data')
      ? result.data
      : result;

    return Number(value) || 0;
  }

async function renderProfile(studentOverride) {
  const student =
    studentOverride === undefined
      ? getStudent()
      : studentOverride;

  const photo = $('profilePhoto');
  const name = $('profileName');
  const status = $('profileStatus');
  const hours = $('profileHours');
  const loginBtn = $('profileLoginBtn');
  const logoutBtn = $('profileLogoutBtn');
  const cartBtn = $('profileCartBtn');

  // ไม่บังคับ profileStatus และ cartBtn
  // เพราะบางขนาดหน้าจออาจถูกซ่อนหรือย้ายตำแหน่ง
  if (!photo || !name || !hours || !loginBtn) {
    console.error('ไม่พบ Element สำหรับแสดง Profile', {
      photo,
      name,
      hours,
      loginBtn
    });
    return;
  }

  photo.onerror = () => {
    photo.onerror = null;
    photo.src = FALLBACK_PHOTO;
  };

  /*
   * ยังไม่เข้าสู่ระบบ
   */
  if (!student) {
    photo.src = FALLBACK_PHOTO;
    name.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    hours.textContent = '0';
    loginBtn.textContent = 'Login';
    if (logoutBtn) logoutBtn.hidden = true;

    if (status) {
      status.textContent =
        'กรุณา Login เพื่อดูข้อมูลกิจกรรม';
    }

    if (cartBtn) {
      cartBtn.innerHTML =
        '<i class="fa fa-shopping-cart"></i> 0 ตะกร้า';
    }

    return;
  }

  /*
   * รองรับชื่อฟิลด์หลายรูปแบบ
   */
  const studentPhoto =
    student.photo ||
    student.photoUrl ||
    student.image ||
    student.imageUrl ||
    '';

  const studentName =
    student.fullname ||
    student.fullName ||
    student.name ||
    'สมาชิก';

  const studentId =
    student.studentId ||
    student.studentID ||
    student.id ||
    '';

  photo.src = safePhoto(studentPhoto);
  name.textContent = studentName;
  loginBtn.textContent = 'บัญชีผู้ใช้';
  if (logoutBtn) logoutBtn.hidden = false;
  hours.textContent = '...';

  if (status) {
    status.textContent = student.phone
      ? `เบอร์โทร ${student.phone}`
      : 'สมาชิกเว็บไซต์ห้องสมุด';
  }

  /*
   * โหลดชั่วโมงกิจกรรม
   */
  if (!studentId) {
    console.warn(
      'ข้อมูลนักเรียนไม่มี studentId:',
      student
    );

    hours.textContent = '0';
  } else {
    try {
      const totalHours =
        await getTotalHours(studentId);

      hours.textContent =
        String(totalHours || 0);
    } catch (error) {
      console.error(
        `โหลด${window.LearningBase?.getHourText?.() || 'ข้อมูล'}ใน Profile ไม่สำเร็จ:`,
        error
      );

      hours.textContent = '0';
    }
  }

  /*
   * จำนวนตะกร้าจะอัปเดตจาก learning-base.js
   * ภายหลังสามารถเชื่อมกับ API ได้
   */

}

function openAccount() {
  const currentStudent = getStudent();

  // ปิด Profile Popup และ Backdrop ก่อนทุกครั้ง
  resetProfileBox();

  if (!currentStudent) {
    window.LearningBase?.openStudentModal();
    return;
  }

  window.LearningBase?.openEditProfile();
}

  function openCart() {
    if (window.LearningBase?.openCart) {
      window.LearningBase.openCart();
    }
  }

  function logout() {
    localStorage.removeItem('LEARN_STUDENT');

    window.dispatchEvent(
      new CustomEvent('LEARN_AUTH_CHANGED', {
        detail: { student: null }
      })
    );
  }

document.addEventListener('DOMContentLoaded', () => {
  $('profileLoginBtn')?.addEventListener(
    'click',
    openAccount
  );

  $('profileLogoutBtn')?.addEventListener(
    'click',
    logout
  );

  $('profileCartBtn')?.addEventListener(
    'click',
    openCart
  );

document
  .querySelector('.profile-stat')
  ?.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopPropagation();

      if (
        window.LearningBase &&
        typeof window.LearningBase.openScoreModal ===
          'function'
      ) {
        window.LearningBase.openScoreModal();
      } else {
        console.error(
          'ไม่พบฟังก์ชัน LearningBase.openScoreModal'
        );
      }
    }
  );

  renderProfile();
});

window.addEventListener(
  'LEARN_AUTH_CHANGED',
  event => {
    const newStudent =
      event.detail?.student || getStudent();

    renderProfile(newStudent);
  }
);
  window.addEventListener('storage', event => {
    if (event.key === 'LEARN_STUDENT') renderProfile();
  });
window.ProfileBox = {
  renderProfile,
  resetProfileBox,
  hideProfileBox
};

})();

