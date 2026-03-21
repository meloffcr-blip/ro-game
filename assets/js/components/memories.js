/**
 * ════════════════════════════════════════
 *  Memories Component
 * ════════════════════════════════════════
 */

const MemoriesComponent = (() => {

  const memories = [
    { text: "أول مرة شفتك فيها... قلبي وقف عن الخفقان لثانية", emoji: "💫" },
    { text: "لما ضحكتي أول مرة قدامي... عرفت إن ده صوت السعادة", emoji: "😊" },
    { text: "أول مرة مسكت إيدك... حسيت بالأمان", emoji: "🤝" },
    { text: "لما قولتيلي بتحبيني... كان أحلى يوم في حياتي", emoji: "❤️" },
    { text: "كل يوم معاكي ذكرى جديدة أحبها", emoji: "🌹" },
    { text: "لما بتبصيلي وبتبتسمي... ده أحلى منظر في الدنيا", emoji: "✨" },
    { text: "لما بنتكلم لساعات... الوقت بيعدي من غير ما نحس", emoji: "💬" },
  ];

  let current = 0;
  let isAnimating = false;

  function init() {
    const caption = document.querySelector('.memory-caption');
    const prevBtn = document.getElementById('prev-memory-btn');
    const nextBtn = document.getElementById('next-memory-btn');
    const counter = document.getElementById('memory-counter');
    const emojiEl = document.getElementById('memory-emoji');
    const likeBtn = document.getElementById('like-memory-btn');

    if (!caption) return;

    _show(current, caption, counter, emojiEl, false);

    prevBtn?.addEventListener('click', () => {
      if (isAnimating) return;
      current = (current - 1 + memories.length) % memories.length;
      _show(current, caption, counter, emojiEl, true, 'right');
    });

    nextBtn?.addEventListener('click', () => {
      if (isAnimating) return;
      current = (current + 1) % memories.length;
      _show(current, caption, counter, emojiEl, true, 'left');
    });

    likeBtn?.addEventListener('click', () => {
      FloatingHearts.fromElement(likeBtn, { count: 12 });
      Toast.love('أنتِ أحلى حاجة في الدنيا! 💖');
    });

    _addSwipeSupport(document.getElementById('memory-lane-container'), {
      onLeft:  () => nextBtn?.click(),
      onRight: () => prevBtn?.click(),
    });
  }

  function _show(idx, caption, counter, emojiEl, animate = false, dir = 'left') {
    const mem = memories[idx];
    if (!caption) return;

    if (animate) {
      isAnimating = true;
      caption.style.opacity = '0';
      caption.style.transform = `translateX(${dir === 'left' ? '-20px' : '20px'})`;
      caption.style.transition = 'all .25s ease';

      setTimeout(() => {
        caption.textContent = mem.text;
        if (emojiEl) emojiEl.textContent = mem.emoji;
        caption.style.transform = `translateX(${dir === 'left' ? '20px' : '-20px'})`;

        requestAnimationFrame(() => {
          caption.style.opacity   = '1';
          caption.style.transform = 'translateX(0)';
          isAnimating = false;
        });
      }, 250);
    } else {
      caption.textContent = mem.text;
      if (emojiEl) emojiEl.textContent = mem.emoji;
    }

    if (counter) counter.textContent = `${idx + 1} / ${memories.length}`;
  }

  function _addSwipeSupport(el, { onLeft, onRight }) {
    if (!el) return;
    let startX = 0;
    el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) onLeft?.();
        else onRight?.();
      }
    }, { passive: true });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => MemoriesComponent.init());
