/**
 * ════════════════════════════════════════
 *  CatchMe Game Component
 *  لعبة أمسكني مع تيليجرام + High Score
 * ════════════════════════════════════════
 */

const CatchMeGame = (() => {

  const CONFIG = window.APP_CONFIG?.catchGame ?? { duration: 15, moveSpeed: 900 };

  let score = 0;
  let timeLeft = CONFIG.duration;
  let gameInterval = null;
  let moveInterval = null;
  let highScore = 0;

  // DOM refs
  let startBtn, gameDiv, target, scoreSpan, timerSpan, gameArea, highScoreSpan;

  function init() {
    startBtn      = document.getElementById('start-catch-game-btn');
    gameDiv       = document.getElementById('catch-me-game');
    target        = document.getElementById('mohamed-target');
    scoreSpan     = document.getElementById('game-score');
    timerSpan     = document.getElementById('game-timer');
    gameArea      = document.getElementById('game-area');
    highScoreSpan = document.getElementById('catch-high-score');

    if (!startBtn) return;

    _loadHighScore().then(hs => {
      highScore = hs;
      if (highScoreSpan) highScoreSpan.textContent = highScore;
    });

    startBtn.addEventListener('click', start);

    // Telegram Back Button
    window.Telegram_App?.on('backButtonClicked', () => {
      if (gameDiv && !gameDiv.classList.contains('hidden')) {
        _endGame();
      }
    });
  }

  function start() {
    score    = 0;
    timeLeft = CONFIG.duration;

    startBtn.style.display = 'none';
    gameDiv.classList.remove('hidden');

    if (scoreSpan) scoreSpan.textContent = score;
    if (timerSpan) timerSpan.textContent = timeLeft;

    gameInterval = setInterval(_tick, 1000);
    moveInterval = setInterval(_moveTarget, CONFIG.moveSpeed);

    target?.addEventListener('click', _catch);
    target?.addEventListener('touchstart', _catch, { passive: true });

    // Telegram Main Button: إنهاء اللعبة
    window.Telegram_App?.showMainButton('إنهاء اللعبة ⏹', () => _endGame());
    window.Telegram_App?.Haptic?.light?.();
  }

  function _tick() {
    timeLeft--;
    if (timerSpan) timerSpan.textContent = timeLeft;

    // تنبيه لما الوقت ٥ ثواني
    if (timeLeft === 5) window.Telegram_App?.Haptic?.warning?.();
    if (timeLeft <= 0) _endGame();
  }

  function _moveTarget() {
    if (!gameArea || !target) return;
    const maxX = gameArea.offsetWidth  - target.offsetWidth;
    const maxY = gameArea.offsetHeight - target.offsetHeight;
    target.style.left       = Math.random() * maxX + 'px';
    target.style.top        = Math.random() * maxY + 'px';
    target.style.transition = `all ${CONFIG.moveSpeed * 0.4}ms ease`;
  }

  function _catch() {
    score++;
    if (scoreSpan) scoreSpan.textContent = score;

    target.style.transform = 'scale(1.3) rotate(10deg)';
    setTimeout(() => { target.style.transform = 'scale(1) rotate(0)'; }, 200);

    window.Telegram_App?.Haptic?.medium?.();
    FloatingHearts.burst({ count: 3, emojis: ['❤️','💕','⭐'] });
  }

  function _endGame() {
    clearInterval(gameInterval);
    clearInterval(moveInterval);
    target?.removeEventListener('click', _catch);
    target?.removeEventListener('touchstart', _catch);

    const isNewRecord = score > highScore;
    if (isNewRecord) {
      highScore = score;
      _saveHighScore(highScore);
    }

    let msg, emoji;
    if (score >= 12)     { msg = 'ممتازة! سريعة جداً يا عسل! 🏆'; emoji = '🏆'; }
    else if (score >= 7) { msg = 'كويس! محتاجة تمرين أكتر 😊';    emoji = '⭐'; }
    else                 { msg = 'حاولي تاني! هتعمليها 😅';        emoji = '💪'; }

    gameDiv.innerHTML = `
      <div class="game-result" style="text-align:center;padding:24px;">
        <div style="font-size:3rem;margin-bottom:8px;">${emoji}</div>
        <h3 style="color:var(--rose,#e8556d);margin-bottom:12px;">انتهت اللعبة!</h3>
        <p style="font-size:1.4rem;font-weight:700;margin-bottom:6px;">النقاط: ${score}</p>
        ${isNewRecord ? '<p style="color:gold;font-weight:700;margin-bottom:6px;">🎉 رقم قياسي جديد!</p>' : ''}
        <p style="margin-bottom:20px;">${msg}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button onclick="location.reload()" class="game-btn">العب تاني 🔄</button>
          <button id="share-score-btn" class="game-btn" style="background:var(--rose,#e8556d);color:#fff;">
            شاركي النتيجة 📤
          </button>
        </div>
      </div>
    `;

    document.getElementById('share-score-btn')?.addEventListener('click', () => {
      window.Telegram_App?.shareScore({
        gameName: 'لعبة أمسكني 🏃‍♂️',
        score,
        maxScore: CONFIG.duration * 2,
      });
      window.Telegram_App?.notifyBot('game_score', {
        game: 'catch_me',
        score,
        isNewRecord,
      });
    });

    window.Telegram_App?.Haptic?.success?.();
    window.Telegram_App?.hideMainButton?.();
    FloatingHearts.confetti();
  }

  async function _loadHighScore() {
    try {
      const val = await window.Telegram_App?.CloudStorage?.get('catch_high_score');
      return parseInt(val, 10) || 0;
    } catch { return 0; }
  }

  function _saveHighScore(val) {
    window.Telegram_App?.CloudStorage?.set('catch_high_score', String(val)).catch(() => {});
    localStorage.setItem('catch_high_score', String(val)); // fallback
  }

  return { init, start };
})();

document.addEventListener('DOMContentLoaded', () => CatchMeGame.init());
