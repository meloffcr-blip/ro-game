/**
 * ════════════════════════════════════════════════
 *  App Config & Entry Point
 *  الإعدادات العامة ونقطة تشغيل التطبيق
 * ════════════════════════════════════════════════
 *
 *  ⚠️ عدّل هنا فقط للإعدادات
 */

window.APP_CONFIG = {
  // ─── بيانات البوت (اختياري) ───
  // webhookUrl: 'https://your-server.com/webhook',  // URL السيرفر لو عايز إشعارات

  // ─── إعدادات اللعبة ───
  catchGame: {
    duration: 15,    // ثانية
    moveSpeed: 900,  // ms بين كل حركة
  },

  heartCatcher: {
    totalTime: 60,
  },

  // ─── إعدادات الكويز ───
  quiz: {
    questionsCount: 15,
    timePerQuestion: null, // null = بدون وقت محدد
  },
};

/**
 * ════════════════════════════════════════════════
 *  Main Entry — يشتغل في كل الصفحات
 * ════════════════════════════════════════════════
 */
document.addEventListener('DOMContentLoaded', () => {

  // ─── Card Entrance Animations ───
  const cards = document.querySelectorAll('.activity-card, [data-animate]');
  if (cards.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            e.target.style.animation = 'fadeUp .55s both';
            e.target.style.opacity   = '1';
          }, i * 80);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(c => {
      c.style.opacity = '0';
      io.observe(c);
    });
  }

  // ─── Celebrate Button ───
  const celebrateBtn = document.getElementById('celebrate-btn');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', () => {
      FloatingHearts.burst({ count: 22 });

      // تأثير الخلفية
      document.body.style.transition = 'background 0.5s';
      document.body.style.background = 'linear-gradient(45deg,#ff6b6b,#feca57,#48dbfb,#ff9ff3)';
      document.body.style.backgroundSize = '400% 400%';
      setTimeout(() => {
        document.body.style.background = '';
      }, 3000);
    });
  }

});
