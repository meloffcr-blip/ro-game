/**
 * ════════════════════════════════════════
 *  floating-hearts.js
 *  التحسينات:
 *   • Object Pooling — عناصر جاهزة بدل createElement كل مرة
 *   • will-change: transform, opacity — GPU layer
 *   • staggering بـ setTimeout مضبوط
 * ════════════════════════════════════════
 */

const FloatingHearts = (() => {

  const EMOJIS = ['❤️','💕','💖','💗','💓','💞','🌹','✨','💫'];

  // ─── Pool ───
  const POOL_SIZE = 40;
  const _pool     = [];

  function _initPool() {
    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement('div');
      el.className = 'float-heart';
      Object.assign(el.style, {
        position:       'fixed',
        pointerEvents:  'none',
        zIndex:         '9998',
        willChange:     'transform, opacity',
        display:        'none',
      });
      document.body.appendChild(el);
      _pool.push(el);
    }
  }

  function _acquire() {
    return _pool.find(el => el.style.display === 'none') ?? null;
  }

  function _release(el) {
    el.style.display    = 'none';
    el.style.animation  = 'none';
    el.style.opacity    = '';
  }

  // ─── Burst ───
  /**
   * @param {object} opts
   * @param {number} opts.count    عدد القلوب (افتراضي 20)
   * @param {number} opts.originX  نقطة البداية vw (افتراضي random)
   * @param {number} opts.duration مدة الحركة بالثانية (افتراضي random 2.5–4.7)
   * @param {string[]} opts.emojis إيموجيز مخصصة
   */
  function burst({ count = 20, originX = null, duration = null, emojis = null } = {}) {
    if (!_pool.length) _initPool();
    const pool = emojis ?? EMOJIS;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = _acquire();
        if (!el) return;

        const x    = originX !== null ? originX : Math.random() * 92;
        const d    = duration ?? (2.5 + Math.random() * 2.2);
        const size = (1.1 + Math.random() * 1.4).toFixed(2);

        el.textContent            = pool[Math.floor(Math.random() * pool.length)];
        el.style.left             = `${x}vw`;
        el.style.bottom           = `${8 + Math.random() * 6}vh`;
        el.style.fontSize         = `${size}rem`;
        el.style.animationDuration = `${d}s`;
        el.style.filter           = 'drop-shadow(0 2px 6px rgba(232,85,109,0.38))';
        el.style.display          = 'block';

        // force reflow قبل الـ animation عشان مش تتجاهل
        void el.offsetWidth;
        el.style.animation = `floatUp ${d}s ease-in forwards`;

        const handler = () => {
          _release(el);
          el.removeEventListener('animationend', handler);
        };
        el.addEventListener('animationend', handler, { once: true });

      }, i * 75);
    }
  }

  /**
   * fromElement - قلوب من عنصر معين
   */
  function fromElement(el, opts = {}) {
    const rect = el.getBoundingClientRect();
    const xVw  = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1);
    burst({ ...opts, originX: Number(xVw) });
  }

  /**
   * confetti - خليط قلوب ونجوم
   */
  function confetti(count = 30) {
    burst({
      count,
      emojis: ['❤️','💖','💗','⭐','✨','💫','🌸','🌟','💝'],
    });
  }

  // ─── تهيئة Pool عند أول استخدام ───
  document.addEventListener('DOMContentLoaded', _initPool, { once: true });

  return { burst, fromElement, confetti };
})();

window.FloatingHearts = FloatingHearts;