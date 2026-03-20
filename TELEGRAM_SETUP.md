# 🤖 إعداد تيليجرام

## الخطوات

### 1. إنشاء البوت
1. افتح @BotFather في تيليجرام
2. ارسل `/newbot` واتبع التعليمات
3. احتفظ بالـ `BOT_TOKEN`

### 2. إنشاء Web App
1. ارسل `/newapp` لـ BotFather
2. اختر البوت الخاص بيك
3. ارفع ملفات الموقع أو ضع رابط الاستضافة
4. هتاخد `web_app_url`

### 3. الـ Webhook (اختياري - للإشعارات)
لو عايز البوت يستقبل إشعارات لما رحمة تلعب:

```javascript
// في app.js أضف:
window.APP_CONFIG.webhookUrl = 'https://your-server.com/webhook';
```

مثال webhook بسيط بـ Node.js:
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const { event, data, user } = req.body;
  
  // ابعت إشعار لنفسك
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: YOUR_CHAT_ID,
      text: `🎮 رحمة ${event === 'game_score' ? 'لعبت وحصلت على ' + data.score + ' نقطة' : event}`,
    })
  });
  
  res.sendStatus(200);
});
```

### 4. Cloud Storage
الـ `Telegram.CloudStorage` بيحفظ:
- `catch_high_score` — أحسن نتيجة في لعبة أمسكني
- `quiz_best` — أحسن نتيجة كويز
- `memory_index` — آخر ذكرى شافتها رحمة

### 5. الميزات المتاحة
| الميزة | الوصف |
|--------|--------|
| `Telegram.Haptic.success()` | اهتزاز عند الفوز |
| `Telegram.Haptic.light()` | اهتزاز خفيف عند الضغط |
| `Telegram.showMainButton(text, fn)` | زرار كبير في الأسفل |
| `Telegram.sendData(obj)` | ابعت داتا للبوت |
| `Telegram.shareScore(...)` | شاركي النتيجة في المحادثة |
| `Telegram.CloudStorage.set/get` | حفظ بيانات على سيرفر تيليجرام |
| `Telegram.openShareLink(url, text)` | مشاركة رابط |
| `Telegram.openQRScanner(...)` | فتح كاميرا QR |
