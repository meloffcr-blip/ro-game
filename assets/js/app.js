/**
 * ════════════════════════════════════════════════
 *  app.js — Entry Point
 *  • config في config.js منفصل
 *  • celebrate effect بـ CSS class مؤقتة
 *  • ripple على كل button click
 *  • IntersectionObserver مع rootMargin
 *  • مفيش Telegram
 * ════════════════════════════════════════════════
 */

// ─── Celebrate + Ripple CSS (inject once) ───
(function _injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes celebrateBg {
      0%   { background-position:   0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position:   0% 50%; }
    }
    body.celebrating {
      background:
        linear-gradient(135deg,#ff6b9d,#feca57,#ff9ff3,#e8556d,#ff6b6b) !important;
      background-size: 400% 400% !important;
      background-attachment: fixed !important;
      animation: celebrateBg 3s ease forwards !important;
    }
    @keyframes _ripple {
      0%   { transform:translate(-50%,-50%) scale(0); opacity:.55; }
      100% { transform:translate(-50%,-50%) scale(3.5); opacity:0; }
    }
    .btn-ripple {
      position:absolute; border-radius:50%;
      pointer-events:none; z-index:0;
      background:rgba(255,255,255,0.32);
      animation:_ripple .52s cubic-bezier(.4,0,.2,1) forwards;
    }
  `;
  document.head.appendChild(s);
})();

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
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    cards.forEach(card => {
      card.style.opacity = '0';
      io.observe(card);
    });
  }

  // ─── Celebrate Button ───
  const celebrateBtn = document.getElementById('celebrate-btn');
  if (celebrateBtn) celebrateBtn.addEventListener('click', _onCelebrate);

  // ─── Global Ripple on all buttons ───
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .celebrate-btn, .back-btn, .back-link, .start-btn, .start-game-btn');
    if (!btn) return;
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';

    const r    = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 1.5;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

});

// ─── Celebrate ───
let _celebrateTimer = null;

function _onCelebrate() {
  if (window.FloatingHearts) FloatingHearts.burst({ count: 22 });
  clearTimeout(_celebrateTimer);
  document.body.classList.add('celebrating');
  _celebrateTimer = setTimeout(() => document.body.classList.remove('celebrating'), 3200);
}