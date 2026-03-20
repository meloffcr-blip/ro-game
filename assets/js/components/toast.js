/**
 * ════════════════════════════════════════
 *  Toast Component — إشعارات بسيطة
 * ════════════════════════════════════════
 */

const Toast = (() => {

  let container;

  function _ensureContainer() {
    if (container) return;
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      zIndex: '9999',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  /**
   * show - يعرض toast
   * @param {string} message
   * @param {'success'|'error'|'info'|'love'} type
   * @param {number} duration بالمللي ثانية
   */
  function show(message, type = 'love', duration = 3000) {
    _ensureContainer();

    const colors = {
      success: '#4caf50',
      error:   '#e8556d',
      info:    '#2196f3',
      love:    'linear-gradient(135deg,#e8556d,#f7a3b0)',
    };

    const icons = {
      success: '✅',
      error:   '❌',
      info:    'ℹ️',
      love:    '💌',
    };

    const el = document.createElement('div');
    el.textContent = `${icons[type] ?? '💌'} ${message}`;
    Object.assign(el.style, {
      background: colors[type] ?? colors.love,
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '50px',
      fontSize: '14px',
      fontFamily: 'Tajawal, Cairo, sans-serif',
      fontWeight: '600',
      direction: 'rtl',
      boxShadow: '0 4px 20px rgba(0,0,0,.18)',
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'all .3s cubic-bezier(.175,.885,.32,1.275)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    });

    container.appendChild(el);

    // fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });

    // fade out
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      setTimeout(() => el.remove(), 350);
    }, duration);
  }

  function success(msg, duration) { show(msg, 'success', duration); }
  function error(msg, duration)   { show(msg, 'error',   duration); }
  function info(msg, duration)    { show(msg, 'info',    duration); }
  function love(msg, duration)    { show(msg, 'love',    duration); }

  return { show, success, error, info, love };
})();

// تصدير عالمي
window.Toast = Toast;
window.showToast = Toast.show; // للتوافق مع الكود القديم
