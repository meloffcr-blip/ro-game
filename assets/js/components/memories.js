/**
 * ════════════════════════════════════════
 *  Memories Component
 *  ذكريات مع تكامل تيليجرام و CloudStorage
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
    const shareBtn = document.getElementById('share-memory-btn');
    const likeBtn  = document.getElementById('like-memory-btn');

    if (!caption) return;

    // تحميل آخر ذكرى من CloudStorage
    _loadSavedIndex().then(idx => {
      current = idx;
      _show(current, caption, counter, emojiEl, false);
    });

    prevBtn?.addEventListener('click', () => {
      if (isAnimating) return;
      current = (current - 1 + memories.length) % memories.length;
      _show(current, caption, counter, emojiEl, true, 'right');
      window.Telegram_App?.Haptic?.select?.();
    });

    nextBtn?.addEventListener('click', () => {
      if (isAnimating) return;
      current = (current + 1) % memories.length;
      _show(current, caption, counter, emojiEl, true, 'left');
      window.Telegram_App?.Haptic?.select?.();
    });

    shareBtn?.addEventListener('click', () => {
      _shareMemory(memories[current]);
    });

    likeBtn?.addEventListener('click', () => {
      FloatingHearts.fromElement(likeBtn, { count: 12 });
      window.Telegram_App?.Haptic?.success?.();
      window.Telegram_App?.notifyBot('memory_liked', { index: current, text: memories[current].text });
      Toast.love('أنتِ أحلى حاجة في الدنيا! 💖');
    });

    // Swipe support
    _addSwipeSupport(document.getElementById('memory-lane-container'), {
      onLeft:  () => nextBtn?.click(),
      onRight: () => prevBtn?.click(),
    });

    // Telegram Main Button
    if (window.Telegram_App?.isInTelegram()) {
      window.Telegram_App.showMainButton('شاركي الذكرى 📸', () => {
        _shareMemory(memories[current]);
      });
    }
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

    // حفظ الإندكس في CloudStorage
    window.Telegram_App?.CloudStorage?.set('memory_index', String(idx)).catch(() => {});
  }

  async function _loadSavedIndex() {
    try {
      const val = await window.Telegram_App?.CloudStorage?.get('memory_index');
      const idx = parseInt(val, 10);
      return isNaN(idx) ? 0 : Math.min(idx, memories.length - 1);
    } catch {
      return 0;
    }
  }

  function _shareMemory(mem) {
    const text = `${mem.emoji} ${mem.text}\n\n💌 من محمد لرحمة`;
    if (window.Telegram_App?.isInTelegram()) {
      window.Telegram_App.sendData({ type: 'share_memory', text });
      Toast.love('تم مشاركة الذكرى! 💌');
    } else {
      window.Telegram_App?.openShareLink(window.location.href, text);
    }
    window.Telegram_App?.Haptic?.success?.();
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
