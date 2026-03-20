/**
 * ════════════════════════════════════════
 *  catch-me.js — لعبة أمسكني
 * ════════════════════════════════════════
 */

const CatchMeGame = (() => {

  const CONFIG = window.APP_CONFIG?.catchGame ?? { duration: 15, moveSpeed: 900 };

  const LS_KEY = 'catch_high_score';

  let score        = 0;
  let timeLeft     = CONFIG.duration;
  let highScore    = 0;
  let gameInterval = null;
  let moveInterval = null;
  let isRunning    = false;

  // DOM refs
  let startBtn, gameDiv, target, scoreSpan, timerSpan, gameArea, highScoreSpan, resultDiv;

  // ─── Init ───
  function init() {
    startBtn      = document.getElementById('start-catch-game-btn');
    gameDiv       = document.getElementById('catch-me-game');
    target        = document.getElementById('mohamed-target');
    scoreSpan     = document.getElementById('game-score');
    timerSpan     = document.getElementById('game-timer');
    gameArea      = document.getElementById('game-area');
    highScoreSpan = document.getElementById('catch-high-score');
    resultDiv     = document.getElementById('catch-result');

    if (!startBtn) return;

    highScore = _loadHighScore();
    if (highScoreSpan) highScoreSpan.textContent = highScore;

    startBtn.addEventListener('click', start);
  }

  // ─── Start ───
  function start() {
    if (isRunning) return;

    score    = 0;
    timeLeft = CONFIG.duration;
    isRunning = true;

    // reset UI
    startBtn.style.display = 'none';
    if (resultDiv) resultDiv.classList.add('hidden');
    gameDiv.classList.remove('hidden');

    if (scoreSpan)  scoreSpan.textContent  = score;
    if (timerSpan)  timerSpan.textContent  = timeLeft;

    // move target to random position immediately
    _moveTarget();

    gameInterval = setInterval(_tick,       1000);
    moveInterval = setInterval(_moveTarget, CONFIG.moveSpeed);

    target?.addEventListener('click',      _catch);
    target?.addEventListener('touchstart', _catch, { passive: true });
  }

  // ─── Tick (countdown) ───
  function _tick() {
    timeLeft--;
    if (timerSpan) timerSpan.textContent = timeLeft;

    // urgent pulse when ≤ 5s
    if (timeLeft <= 5 && timerSpan) {
      timerSpan.style.color = 'var(--rose)';
      timerSpan.style.animation = 'beat .5s ease-in-out infinite';
    }

    if (timeLeft <= 0) _endGame();
  }

  // ─── Move Target ───
  function _moveTarget() {
    if (!gameArea || !target) return;
    const maxX = gameArea.offsetWidth  - target.offsetWidth  - 4;
    const maxY = gameArea.offsetHeight - target.offsetHeight - 4;
    const newX = Math.max(0, Math.random() * maxX);
    const newY = Math.max(0, Math.random() * maxY);

    target.style.left       = newX + 'px';
    target.style.top        = newY + 'px';
    target.style.transition = `all ${CONFIG.moveSpeed * 0.35}ms cubic-bezier(.34,1.56,.64,1)`;
  }

  // ─── Catch ───
  function _catch(e) {
    e.stopPropagation();
    if (!isRunning) return;

    score++;
    if (scoreSpan) scoreSpan.textContent = score;

    // bounce animation
    target.style.transition = 'transform .15s cubic-bezier(.34,1.56,.64,1)';
    target.style.transform  = 'scale(1.35) rotate(12deg)';
    setTimeout(() => { target.style.transform = 'scale(1) rotate(0)'; }, 180);

    // mini hearts burst from target position
    if (window.FloatingHearts) {
      const rect = target.getBoundingClientRect();
      const xVw  = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1);
      FloatingHearts.burst({ count: 4, originX: Number(xVw), emojis: ['❤️','💕','⭐','✨'] });
    }

    // score popup
    _spawnScorePop(e);
  }

  // ─── Score Popup ───
  function _spawnScorePop(e) {
    const pop = document.createElement('div');
    pop.className   = 'score-pop';
    pop.textContent = '+1';
    pop.style.cssText = `
      left: ${(e.clientX ?? e.touches?.[0]?.clientX ?? window.innerWidth/2)}px;
      top:  ${(e.clientY ?? e.touches?.[0]?.clientY ?? window.innerHeight/2)}px;
      color: var(--rose);
      font-size: 1.5rem;
    `;
    document.body.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove(), { once: true });
  }

  // ─── End Game ───
  function _endGame() {
    if (!isRunning) return;
    isRunning = false;

    clearInterval(gameInterval);
    clearInterval(moveInterval);
    target?.removeEventListener('click',      _catch);
    target?.removeEventListener('touchstart', _catch);

    // reset timer style
    if (timerSpan) {
      timerSpan.style.color     = '';
      timerSpan.style.animation = '';
    }

    const isNewRecord = score > highScore;
    if (isNewRecord) {
      highScore = score;
      _saveHighScore(highScore);
      if (highScoreSpan) highScoreSpan.textContent = highScore;
    }

    // result message
    let msg, emoji;
    if      (score >= 12) { msg = 'ممتازة! سريعة جداً يا عسل! 🏆'; emoji = '🏆'; }
    else if (score >= 7)  { msg = 'كويس! محتاجة شوية تمرين 😊';    emoji = '⭐'; }
    else                  { msg = 'حاولي تاني! هتعمليها 😅';        emoji = '💪'; }

    gameDiv.classList.add('hidden');

    if (resultDiv) {
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = `
        <div style="text-align:center;padding:24px;">
          <div style="font-size:3rem;margin-bottom:8px;">${emoji}</div>
          <h3 style="color:var(--rose,#e8556d);font-family:'Aref Ruqaa',serif;font-size:1.8rem;margin-bottom:12px;">انتهت اللعبة!</h3>
          <p style="font-size:1.6rem;font-weight:900;margin-bottom:6px;color:var(--rose);">${score} نقطة</p>
          ${isNewRecord ? '<p style="color:#c9914a;font-weight:700;margin-bottom:8px;font-size:1.05rem;">🎉 رقم قياسي جديد!</p>' : `<p style="color:var(--muted);font-size:.95rem;margin-bottom:8px;">الرقم القياسي: ${highScore}</p>`}
          <p style="margin-bottom:24px;color:#4a2830;font-size:1.1rem;">${msg}</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button onclick="CatchMeGame.restart()" class="game-btn">العب تاني 🔄</button>
            <a href="../index.html" style="display:inline-flex;align-items:center;background:rgba(255,240,245,0.45);backdrop-filter:blur(10px);color:var(--rose-deep,#c03558);text-decoration:none;padding:14px 24px;border-radius:99px;border:1px solid rgba(232,85,109,0.25);font-weight:700;font-family:'Tajawal',sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,0.65);">🏠 الرئيسية</a>
          </div>
        </div>
      `;
    }

    if (window.FloatingHearts) FloatingHearts.confetti();
  }

  // ─── Restart ───
  function restart() {
    if (resultDiv) resultDiv.classList.add('hidden');
    startBtn.style.display = '';
    score    = 0;
    timeLeft = CONFIG.duration;
    if (scoreSpan) scoreSpan.textContent  = score;
    if (timerSpan) timerSpan.textContent  = timeLeft;
    start();
  }

  // ─── High Score helpers ───
  function _loadHighScore() {
    return parseInt(localStorage.getItem(LS_KEY) || '0', 10);
  }
  function _saveHighScore(val) {
    try { localStorage.setItem(LS_KEY, String(val)); } catch (_) {}
  }

  return { init, start, restart };
})();

document.addEventListener('DOMContentLoaded', () => CatchMeGame.init());