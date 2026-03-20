/**
 * ════════════════════════════════════════════════
 *  app.js — Entry Point
 *  التحسينات:
 *   • CONFIG انفصل لـ config.js
 *   • celebrate effect بـ CSS class مؤقتة بدل inline style
 *   • IntersectionObserver مع rootMargin للـ preload
 *   • مفيش أي ارتباط بـ Telegram
 * ════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Card Entrance Animations ───
  const cards = document.querySelectorAll('.activity-card, [data-animate]');

  if (cards.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => {
          entry.target.style.animation = 'fadeUp .55s both';
          entry.target.style.opacity   = '1';
        }, i * 80);
        io.unobserve(entry.target);
      });
    }, {
      threshold:  0.08,
      rootMargin: '0px 0px -50px 0px', // يبدأ قبل ما تظهر بـ 50px
    });

    cards.forEach(card => {
      card.style.opacity = '0';
      io.observe(card);
    });
  }

  // ─── Celebrate Button ───
  const celebrateBtn = document.getElementById('celebrate-btn');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', _onCelebrate);
  }

});

// ─── Celebrate Effect ───
// (CSS class مؤقتة بدل override على body.style)
(function _injectCelebrateCss() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes celebrateBg {
      0%   { background-position: 0% 50%;   }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%;   }
    }
    body.celebrating {
      background:
        linear-gradient(135deg, #ff6b9d, #feca57, #ff9ff3, #e8556d, #ff6b6b) !important;
      background-size: 400% 400% !important;
      animation: celebrateBg 3s ease forwards !important;
      background-attachment: fixed !important;
    }
  `;
  document.head.appendChild(style);
})();

function _onCelebrate() {
  // قلوب
  if (window.FloatingHearts) FloatingHearts.burst({ count: 22 });

  // تأثير الخلفية عبر CSS class
  document.body.classList.add('celebrating');
  setTimeout(() => document.body.classList.remove('celebrating'), 3200);
}