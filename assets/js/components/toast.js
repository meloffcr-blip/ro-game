/**
 * ════════════════════════════════════════
 *  toast.js — إشعارات
 *  التحسينات:
 *   • Max queue (3) — منع التراكم
 *   • dir="rtl" native
 *   • Singleton container محمي
 *   • cleanup تلقائي
 * ════════════════════════════════════════
 */

const Toast = (() => {

  const MAX_VISIBLE = 3;
  let container     = null;
  let activeCount   = 0;
  const queue       = [];

  const COLORS = {
    success: { bg: 'linear-gradient(135deg,#4caf50,#81c784)', icon: '✅' },
    error:   { bg: 'linear-gradient(135deg,#e8556d,#ef9a9a)', icon: '❌' },
    info:    { bg: 'linear-gradient(135deg,#2196f3,#64b5f6)', icon: 'ℹ️' },
    love:    { bg: 'linear-gradient(135deg,#e8556d,#f7a3b0)', icon: '💌' },
  };

  function _ensureContainer() {
    if (container && document.body.contains(container)) return;
    container = document.createElement('div');
    container.id  = 'toast-container';
    container.dir = 'rtl';
    Object.assign(container.style, {
      position:       'fixed',
      bottom:         '24px',
      left:           '50%',
      transform:      'translateX(-50%)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '10px',
      zIndex:         '9999',
      pointerEvents:  'none',
      minWidth:       '200px',
    });
    document.body.appendChild(container);
  }

  function _processQueue() {
    if (!queue.length || activeCount >= MAX_VISIBLE) return;
    const next = queue.shift();
    _render(next.message, next.type, next.duration);
  }

  function _render(message, type = 'love', duration = 3000) {
    _ensureContainer();
    activeCount++;

    const cfg = COLORS[type] ?? COLORS.love;
    const el  = document.createElement('div');

    el.textContent = `${cfg.icon} ${message}`;
    Object.assign(el.style, {
      background:    cfg.bg,
      color:         '#fff',
      padding:       '12px 22px',
      borderRadius:  '50px',
      fontSize:      '14px',
      fontFamily:    'Tajawal, Cairo, sans-serif',
      fontWeight:    '600',
      boxShadow:     '0 4px 20px rgba(0,0,0,.18)',
      opacity:       '0',
      transform:     'translateY(20px)',
      transition:    'opacity .3s cubic-bezier(.175,.885,.32,1.275), transform .3s cubic-bezier(.175,.885,.32,1.275)',
      pointerEvents: 'none',
      whiteSpace:    'nowrap',
      willChange:    'opacity, transform',
    });

    container.appendChild(el);

    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      });
    });

    // Fade out
    const timer = setTimeout(() => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        el.remove();
        activeCount = Math.max(0, activeCount - 1);
        _processQueue();
      }, 320);
    }, duration);

    // تنظيف لو الصفحة اتبنت من جديد
    el._cleanup = () => { clearTimeout(timer); el.remove(); };
  }

  /**
   * show — الدالة الرئيسية
   * @param {string} message
   * @param {'success'|'error'|'info'|'love'} type
   * @param {number} duration ms
   */
  function show(message, type = 'love', duration = 3000) {
    if (activeCount < MAX_VISIBLE) {
      _render(message, type, duration);
    } else {
      queue.push({ message, type, duration });
    }
  }

  const success = (msg, dur) => show(msg, 'success', dur);
  const error   = (msg, dur) => show(msg, 'error',   dur);
  const info    = (msg, dur) => show(msg, 'info',    dur);
  const love    = (msg, dur) => show(msg, 'love',    dur);

  return { show, success, error, info, love };
})();

window.Toast    = Toast;
window.showToast = Toast.show;