/**
 * ════════════════════════════════════════
 *  FloatingHearts Component
 *  قلوب متطايرة بتشتغل في أي صفحة
 * ════════════════════════════════════════
 */

const FloatingHearts = (() => {

  const EMOJIS = ['❤️','💕','💖','💗','💓','💞','🌹','✨','💫'];

  /**
   * burst - يطلق عدد من القلوب
   * @param {object} opts
   * @param {number} opts.count - عدد القلوب (افتراضي 20)
   * @param {number} opts.originX - نقطة البداية (vw, افتراضي random)
   * @param {number} opts.duration - مدة الحركة بالثانية (افتراضي 3-5)
   * @param {string[]} opts.emojis - إيموجيز مخصصة
   */
  function burst({ count = 20, originX = null, duration = null, emojis = null } = {}) {
    const pool = emojis ?? EMOJIS;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'float-heart';
        el.textContent = pool[Math.floor(Math.random() * pool.length)];

        const x = originX !== null ? originX : Math.random() * 95;
        const d = duration ?? (2.5 + Math.random() * 2.2);
        const size = (1.1 + Math.random() * 1.5);

        Object.assign(el.style, {
          position: 'fixed',
          left: `${x}vw`,
          bottom: '10vh',
          fontSize: `${size}rem`,
          animationDuration: `${d}s`,
          zIndex: '9998',
          pointerEvents: 'none',
        });

        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }, i * 85);
    }
  }

  /**
   * fromElement - يطلق قلوب من عنصر معين
   * @param {HTMLElement} el
   */
  function fromElement(el, opts = {}) {
    const rect = el.getBoundingClientRect();
    const xVw = (rect.left + rect.width / 2) / window.innerWidth * 100;
    burst({ ...opts, originX: xVw });
  }

  /**
   * confetti - خليط من القلوب والنجوم
   */
  function confetti(count = 30) {
    burst({ count, emojis: ['❤️','💖','💗','⭐','✨','💫','🌸','🌟','💝'] });
  }

  return { burst, fromElement, confetti };
})();

window.FloatingHearts = FloatingHearts;
