/**
 * ════════════════════════════════════════════════
 *  Telegram Integration Component
 *  يتعامل مع Telegram Web App API + Bot Notifications
 * ════════════════════════════════════════════════
 */

const Telegram = (() => {

  // ─── State ───
  const tg = window.Telegram?.WebApp ?? null;
  let _user = null;
  let _isReady = false;

  // ─── Init ───
  function init() {
    if (!tg) return;

    tg.ready();
    tg.expand();

    // تفعيل ثيم تيليجرام تلقائياً
    _applyTheme();

    // حفظ بيانات اليوزر
    _user = tg.initDataUnsafe?.user ?? null;

    // زرار الرجوع في تيليجرام
    tg.BackButton.onClick(() => {
      const prev = document.referrer;
      if (prev) window.location.href = prev;
      else tg.close();
    });

    _isReady = true;

    // إعداد الـ Main Button
    _setupMainButton();

    console.log('[Telegram] Initialized. User:', _user?.first_name ?? 'Unknown');
  }

  // ─── Theme ───
  function _applyTheme() {
    if (!tg) return;
    const params = tg.themeParams;
    if (!params) return;
    const root = document.documentElement;
    // ممكن تخصيص CSS vars بناءً على ثيم تيليجرام
    if (params.bg_color) root.style.setProperty('--tg-bg', params.bg_color);
    if (params.text_color) root.style.setProperty('--tg-text', params.text_color);
    if (params.button_color) root.style.setProperty('--tg-btn', params.button_color);
  }

  // ─── Main Button (الزر السفلي في تيليجرام) ───
  function _setupMainButton() {
    if (!tg?.MainButton) return;
    tg.MainButton.setParams({
      text: 'أرسلي قلبك 💌',
      color: '#e8556d',
      text_color: '#ffffff',
    });
  }

  function showMainButton(text, callback) {
    if (!tg?.MainButton) return;
    tg.MainButton.setText(text ?? 'تابعي 💖');
    tg.MainButton.onClick(callback);
    tg.MainButton.show();
  }

  function hideMainButton() {
    if (!tg?.MainButton) return;
    tg.MainButton.hide();
    tg.MainButton.offClick();
  }

  // ─── Haptic Feedback ───
  const Haptic = {
    light: () => tg?.HapticFeedback?.impactOccurred('light'),
    medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
    heavy: () => tg?.HapticFeedback?.impactOccurred('heavy'),
    success: () => tg?.HapticFeedback?.notificationOccurred('success'),
    warning: () => tg?.HapticFeedback?.notificationOccurred('warning'),
    error: () => tg?.HapticFeedback?.notificationOccurred('error'),
    select: () => tg?.HapticFeedback?.selectionChanged(),
  };

  // ─── Popups & Alerts ───
  function alert(message, callback) {
    if (tg?.showAlert) {
      tg.showAlert(message, callback);
    } else {
      window.alert(message);
      callback?.();
    }
  }

  function confirm(message, callback) {
    if (tg?.showConfirm) {
      tg.showConfirm(message, (ok) => callback?.(ok));
    } else {
      const ok = window.confirm(message);
      callback?.(ok);
    }
  }

  function popup({ title, message, buttons }, callback) {
    if (tg?.showPopup) {
      tg.showPopup({ title, message, buttons: buttons ?? [{ type: 'close' }] }, callback);
    } else {
      window.alert(`${title}\n${message}`);
      callback?.('close');
    }
  }

  // ─── Send Data إلى البوت ───
  /**
   * sendData - يبعت داتا للبوت عبر WebApp
   * @param {object} payload - البيانات اللي هتتبعت
   */
  function sendData(payload) {
    if (!tg?.sendData) {
      console.warn('[Telegram] sendData غير متاح خارج WebApp');
      return;
    }
    tg.sendData(JSON.stringify(payload));
  }

  // ─── Share via Telegram ───
  /**
   * shareScore - يشارك النتيجة في المحادثة
   */
  function shareScore({ gameName, score, maxScore }) {
    const text = `🎮 ${gameName}\n🏆 نتيجتي: ${score} من ${maxScore}\n💌 العب أنت كمان!`;
    if (tg?.switchInlineQuery) {
      tg.switchInlineQuery(text);
    } else {
      // fallback: نسخ في الكليبورد
      copyToClipboard(text);
      showToast('تم نسخ النتيجة!');
    }
  }

  // ─── Bot Notification (عبر fetch إلى webhook) ───
  /**
   * notifyBot - يبعت إشعار للبوت بشكل manual
   * @param {string} event - اسم الحدث
   * @param {object} data - البيانات
   */
  async function notifyBot(event, data = {}) {
    // غيّر هذا الـ URL لـ webhook الخاص بيك
    const WEBHOOK_URL = window.APP_CONFIG?.webhookUrl ?? null;
    if (!WEBHOOK_URL) return;

    const payload = {
      event,
      user: _user,
      data,
      timestamp: Date.now(),
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Telegram] notifyBot فشل:', err.message);
    }
  }

  // ─── Cloud Storage (تيليجرام يحفظ بيانات صغيرة على السيرفر) ───
  const CloudStorage = {
    set(key, value) {
      return new Promise((res, rej) => {
        if (!tg?.CloudStorage) return rej('CloudStorage غير متاح');
        tg.CloudStorage.setItem(key, String(value), (err, stored) => {
          if (err) rej(err); else res(stored);
        });
      });
    },
    get(key) {
      return new Promise((res, rej) => {
        if (!tg?.CloudStorage) return rej('CloudStorage غير متاح');
        tg.CloudStorage.getItem(key, (err, val) => {
          if (err) rej(err); else res(val);
        });
      });
    },
    getMultiple(keys) {
      return new Promise((res, rej) => {
        if (!tg?.CloudStorage) return rej('CloudStorage غير متاح');
        tg.CloudStorage.getItems(keys, (err, vals) => {
          if (err) rej(err); else res(vals);
        });
      });
    },
    remove(key) {
      return new Promise((res, rej) => {
        if (!tg?.CloudStorage) return rej('CloudStorage غير متاح');
        tg.CloudStorage.removeItem(key, (err) => {
          if (err) rej(err); else res(true);
        });
      });
    },
  };

  // ─── Helpers ───
  function getUser() { return _user; }
  function getUserName() {
    if (!_user) return 'رحمة';
    return _user.first_name ?? _user.username ?? 'رحمة';
  }
  function isInTelegram() { return !!tg; }
  function isReady() { return _isReady; }

  // ─── Event Listeners ───
  function on(event, callback) {
    tg?.onEvent?.(event, callback);
  }
  function off(event, callback) {
    tg?.offEvent?.(event, callback);
  }

  // ─── Share Link ───
  function openShareLink(url, text) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }

  function openExternalLink(url) {
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // ─── Scan QR (تيليجرام 6.9+) ───
  function openQRScanner(text, callback) {
    if (tg?.showScanQrPopup) {
      tg.showScanQrPopup({ text }, (data) => {
        callback?.(data);
        tg.closeScanQrPopup();
      });
    }
  }

  // Public API
  return {
    init,
    Haptic,
    alert,
    confirm,
    popup,
    sendData,
    shareScore,
    notifyBot,
    CloudStorage,
    showMainButton,
    hideMainButton,
    getUser,
    getUserName,
    isInTelegram,
    isReady,
    on,
    off,
    openShareLink,
    openExternalLink,
    openQRScanner,
  };

})();

// Auto-init عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => Telegram.init());

// تصدير عالمي
window.Telegram_App = Telegram;
