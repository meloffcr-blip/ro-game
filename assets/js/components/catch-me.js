/**
 * ════════════════════════════════════════
 *  CatchMe Game Component
 * ════════════════════════════════════════
 */

const CatchMeGame = (() => {

  const CONFIG = window.APP_CONFIG?.catchGame ?? { duration: 15, moveSpeed: 900 };

  let score = 0;
  let timeLeft = CONFIG.duration;
  let gameInterval = null;
  let moveInterval = null;
  let highScore = 0;

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

    highScore = parseInt(localStorage.getItem('catch_high_score') ?? '0', 10);
    if (highScoreSpan) highScoreSpan.textContent = highScore;

    startBtn.addEventListener('click', start);
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
  }

  function _tick() {
    timeLeft--;
    if (timerSpan) timerSpan.textContent = timeLeft;
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
      localStorage.setItem('catch_high_score', String(highScore));
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
        <button onclick="location.reload()" class="game-btn">العب تاني 🔄</button>
      </div>
    `;

    FloatingHearts.confetti();
  }

  return { init, start };
})();

document.addEventListener('DOMContentLoaded', () => CatchMeGame.init());
