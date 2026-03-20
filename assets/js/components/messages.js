/**
 * ════════════════════════════════════════
 *  Messages Component
 *  رسائل الحب + تكامل تيليجرام
 * ════════════════════════════════════════
 */

const MessagesComponent = (() => {

  const compliments = [
    "رحمتي، أنتِ أجمل من القمر والنجوم مجتمعين ✨",
    "ضحكتك بتنور يومي كله يا حبيبتي 😊",
    "أنتِ السبب في كل فرحة في حياتي ❤️",
    "عيونك فيها كل الدنيا الحلوة 👀",
    "صوتك أحلى موسيقى في الكون 🎵",
    "وجودك في حياتي هو أحلى هدية من ربنا 🌹",
    "كل يوم بيصحصح وانتِ في بالي يبقى يوم مميز 💫",
    "أنتِ مش بس حبيبتي، أنتِ أحسن صاحبة عندي 🤍",
  ];

  let lastIndex = -1;

  function _getRandomCompliment() {
    let idx;
    do { idx = Math.floor(Math.random() * compliments.length); }
    while (idx === lastIndex && compliments.length > 1);
    lastIndex = idx;
    return compliments[idx];
  }

  function init() {
    const complimentBtn = document.getElementById('compliment-btn');
    const revealBtn     = document.getElementById('reveal-btn');
    const shareBtn      = document.getElementById('share-msg-btn');
    const resultDiv     = document.getElementById('activity-result');
    const secretDiv     = document.getElementById('secret-message');
    const copyBtns      = document.querySelectorAll('[data-copy-msg]');

    if (!complimentBtn) return;

    // ─── رسالة جديدة ───
    complimentBtn.addEventListener('click', () => {
      const msg = _getRandomCompliment();

      resultDiv.innerHTML = `
        <p style="margin-bottom:12px;">${msg}</p>
        <button class="message-btn" id="share-current-msg" style="font-size:.85rem;padding:8px 18px;">
          شاركي الرسالة في تيليجرام 💌
        </button>
      `;
      resultDiv.classList.remove('hidden');
      secretDiv.classList.add('hidden');

      // Haptic
      window.Telegram_App?.Haptic?.light?.();

      // زرار المشاركة
      document.getElementById('share-current-msg')?.addEventListener('click', () => {
        _shareMessage(msg);
      });

      // قلوب صغيرة
      FloatingHearts.burst({ count: 8 });
    });

    // ─── الرسالة السرية ───
    revealBtn?.addEventListener('click', () => {
      secretDiv.classList.remove('hidden');
      resultDiv.classList.add('hidden');
      window.Telegram_App?.Haptic?.success?.();
      FloatingHearts.burst({ count: 15 });

      // إشعار للبوت إن رحمة شافت الرسالة السرية
      window.Telegram_App?.notifyBot('secret_revealed', { timestamp: Date.now() });
    });

    // ─── Copy buttons ───
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copyMsg ?? btn.closest('[data-msg]')?.dataset.msg;
        if (text) _copyToClipboard(text);
      });
    });

    // ─── Telegram Main Button ───
    if (window.Telegram_App?.isInTelegram()) {
      window.Telegram_App.showMainButton('شاركي رسالة 💌', () => {
        const msg = _getRandomCompliment();
        _shareMessage(msg);
      });
    }
  }

  function _shareMessage(text) {
    if (window.Telegram_App?.isInTelegram()) {
      window.Telegram_App.sendData({ type: 'love_message', message: text });
      Toast.love('تم إرسال الرسالة! 💌');
    } else {
      // fallback: فتح تيليجرام share
      const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
    window.Telegram_App?.Haptic?.success?.();
  }

  function _copyToClipboard(text) {
    navigator.clipboard?.writeText(text)
      .then(() => Toast.love('تم النسخ! 💌'))
      .catch(() => Toast.error('فشل النسخ ❌'));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => MessagesComponent.init());
