/**
 * ════════════════════════════════════════
 *  heart-catcher.js — صائد القلوب
 *  Object Pool · Combos · Levels · Power-ups
 * ════════════════════════════════════════
 */

const HeartCatcherGame = (() => {

  // ─── Config ───
  const CFG = {
    totalTime:    window.APP_CONFIG?.heartCatcher?.totalTime ?? 60,
    spawnBase:    1400,    // ms بين كل قلب في البداية
    spawnMin:     420,     // أسرع spawn ممكن
    fallBase:     3200,    // ms لأول لمس الأرض
    fallMin:      1400,
    poolSize:     50,
    comboWindow:  1200,    // ms بين الكليك للكومبو
    levelEvery:   8,       // نقطة كل كام تعلي level
  };

  // ─── State ───
  let state = {
    phase:      'menu',    // menu | playing | paused | result
    score:      0,
    combo:      0,
    maxCombo:   0,
    level:      1,
    timeLeft:   CFG.totalTime,
    caught:     0,
    missed:     0,
    lastCatch:  0,
    highScore:  0,
    shieldActive: false,
    doubleActive: false,
  };

  // ─── Timers ───
  let _countdownTimer = null;
  let _spawnTimer     = null;
  let _spawnInterval  = CFG.spawnBase;

  // ─── Heart Pool ───
  const _pool    = [];
  let   _arena   = null;

  // ─── DOM refs ───
  let _dom = {};

  // Heart definitions: emoji, points, probability weight, special
  const HEARTS = [
    { e: '❤️',  pts: 1,  w: 40, type: 'normal'  },
    { e: '💕',  pts: 1,  w: 25, type: 'normal'  },
    { e: '💖',  pts: 2,  w: 15, type: 'normal'  },
    { e: '💗',  pts: 2,  w: 10, type: 'normal'  },
    { e: '💘',  pts: 3,  w: 5,  type: 'special' },
    { e: '🌹',  pts: 3,  w: 3,  type: 'special' },
    { e: '⭐',  pts: 0,  w: 1,  type: 'shield'  },  // shield power-up
    { e: '✨',  pts: 0,  w: 1,  type: 'double'  },  // double points power-up
  ];
  const _totalWeight = HEARTS.reduce((s, h) => s + h.w, 0);

  // ─── Init ───
  function init() {
    _dom = {
      menu:       document.getElementById('menu'),
      gameScreen: document.getElementById('game-screen'),
      pauseOv:    document.getElementById('pause-overlay'),
      resultBox:  document.getElementById('result-box'),
      arena:      document.getElementById('arena'),
      startBtn:   document.querySelector('.start-btn'),
      pauseBtn:   document.getElementById('pause-btn'),
      resumeBtn:  document.getElementById('resume-btn'),
      restartBtn: document.getElementById('restart-btn'),
      homeBtn:    document.getElementById('home-btn'),
      quitBtn:    document.getElementById('quit-btn'),
      playAgain:  document.getElementById('play-again-btn'),
      scoreEl:    document.getElementById('score-val'),
      comboEl:    document.getElementById('combo-val'),
      levelEl:    document.getElementById('level-val'),
      timerEl:    document.getElementById('timer-val'),
      progFill:   document.getElementById('prog-fill'),
      progLabel:  document.getElementById('prog-label'),
      // menu stats
      menuHS:     document.getElementById('menu-high-score'),
      menuMaxC:   document.getElementById('menu-max-combo'),
      // result
      resScore:   document.getElementById('res-score'),
      resCaught:  document.getElementById('res-caught'),
      resMissed:  document.getElementById('res-missed'),
      resCombo:   document.getElementById('res-combo'),
      resMsg:     document.getElementById('res-msg'),
      resNewRec:  document.getElementById('res-new-record'),
      touchHint:  document.getElementById('touch-hint'),
    };

    _arena = _dom.arena;

    // load saved stats
    state.highScore = _load('hc_high_score', 0);
    const savedMaxCombo = _load('hc_max_combo', 0);
    if (_dom.menuHS)   _dom.menuHS.textContent  = state.highScore;
    if (_dom.menuMaxC) _dom.menuMaxC.textContent = savedMaxCombo;

    // build pool
    _buildPool();

    // bind buttons
    _dom.startBtn?.addEventListener('click',   startGame);
    _dom.pauseBtn?.addEventListener('click',   pauseGame);
    _dom.resumeBtn?.addEventListener('click',  resumeGame);
    _dom.restartBtn?.addEventListener('click', () => { resumeGame(); startGame(); });
    _dom.homeBtn?.addEventListener('click',    _goHome);
    _dom.quitBtn?.addEventListener('click',   _quitGame);
    _dom.playAgain?.addEventListener('click',  () => { _hideResult(); startGame(); });

    // keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (state.phase === 'playing') pauseGame();
        else if (state.phase === 'paused') resumeGame();
      }
    });
  }

  // ─── Pool ───
  function _buildPool() {
    for (let i = 0; i < CFG.poolSize; i++) {
      const el = document.createElement('div');
      el.className = 'fheart';
      el.style.display = 'none';
      el.style.willChange = 'top, transform';
      el.addEventListener('click',      _onHeartClick);
      el.addEventListener('touchstart', _onHeartClick, { passive: true });
      _arena?.appendChild(el);
      _pool.push({ el, active: false, def: null, timer: null });
    }
  }

  function _acquireHeart() {
    return _pool.find(h => !h.active) ?? null;
  }

  function _releaseHeart(h) {
    clearTimeout(h.timer);
    h.active  = false;
    h.def     = null;
    h.el.style.display     = 'none';
    h.el.style.top         = '-70px';
    h.el.style.left        = '';
    h.el.style.transition  = '';
    h.el.style.animation   = '';
    h.el.classList.remove('special', 'near', 'popped', 'powerup');
    h.el.removeAttribute('data-id');
  }

  // ─── Weighted random heart ───
  function _pickHeart() {
    let r = Math.random() * _totalWeight;
    for (const h of HEARTS) {
      r -= h.w;
      if (r <= 0) return h;
    }
    return HEARTS[0];
  }

  // ─── Start ───
  function startGame() {
    _resetState();
    _showScreen('game');
    _updateHUD();

    _spawnInterval = CFG.spawnBase;
    _scheduleSpawn();

    _countdownTimer = setInterval(_tick, 1000);

    if (_dom.touchHint) {
      _dom.touchHint.style.opacity = '0';
      setTimeout(() => { _dom.touchHint.style.opacity = ''; }, 100);
    }
  }

  function _resetState() {
    state = {
      ...state,
      phase:        'playing',
      score:        0,
      combo:        0,
      maxCombo:     0,
      level:        1,
      timeLeft:     CFG.totalTime,
      caught:       0,
      missed:       0,
      lastCatch:    0,
      shieldActive: false,
      doubleActive: false,
    };
    // release all active hearts
    _pool.forEach(h => { if (h.active) _releaseHeart(h); });
  }

  // ─── Countdown ───
  function _tick() {
    if (state.phase !== 'playing') return;
    state.timeLeft--;
    _updateTimer();
    if (state.timeLeft <= 0) _endGame();
  }

  // ─── Spawn ───
  function _scheduleSpawn() {
    if (state.phase !== 'playing') return;
    clearTimeout(_spawnTimer);
    _spawnTimer = setTimeout(() => {
      _spawnHeart();
      // gradually speed up
      const progress = 1 - (state.timeLeft / CFG.totalTime);
      _spawnInterval = Math.max(
        CFG.spawnMin,
        CFG.spawnBase - Math.floor(progress * (CFG.spawnBase - CFG.spawnMin))
      );
      _scheduleSpawn();
    }, _spawnInterval + (Math.random() * 300 - 150)); // ±150ms jitter
  }

  function _spawnHeart() {
    if (state.phase !== 'playing') return;
    const slot = _acquireHeart();
    if (!slot) return;

    const def   = _pickHeart();
    const arenaW = _arena.offsetWidth;
    const size   = 44;
    const x      = Math.random() * (arenaW - size - 20) + 10;

    // fall duration: faster on higher levels
    const fallDur = Math.max(
      CFG.fallMin,
      CFG.fallBase - (state.level - 1) * 160
    );

    slot.active = true;
    slot.def    = def;

    const el = slot.el;
    el.textContent   = def.e;
    el.style.display = 'block';
    el.style.left    = x + 'px';
    el.style.top     = '-60px';
    el.style.animation = '';
    el.classList.toggle('special',  def.type === 'special');
    el.classList.toggle('powerup',  def.type === 'shield' || def.type === 'double');
    el.setAttribute('data-pool-idx', _pool.indexOf(slot));

    // animate fall via CSS transition on top
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `top ${fallDur}ms linear`;
        el.style.top = (_arena.offsetHeight + 20) + 'px';
      });
    });

    // auto-release when heart reaches bottom (missed)
    slot.timer = setTimeout(() => {
      if (!slot.active) return;
      if (!state.shieldActive) {
        state.missed++;
        state.combo = 0;
        _updateCombo();
        // flash arena red
        _flashArena();
      }
      _releaseHeart(slot);
    }, fallDur + 100);
  }

  // ─── Click / Catch ───
  function _onHeartClick(e) {
    e.stopPropagation();
    if (state.phase !== 'playing') return;

    const idx  = parseInt(e.currentTarget.getAttribute('data-pool-idx'), 10);
    const slot = _pool[idx];
    if (!slot?.active) return;

    const def = slot.def;

    // pop animation
    slot.el.classList.add('popped');
    _releaseHeart(slot);

    const now = Date.now();

    if (def.type === 'shield') {
      _activateShield();
      _spawnPowerMsg('🛡️ درع! مفيش خصم ثواني!');
      return;
    }
    if (def.type === 'double') {
      _activateDouble();
      _spawnPowerMsg('✨ نقاط مضاعفة!');
      return;
    }

    // combo check
    if (now - state.lastCatch <= CFG.comboWindow) {
      state.combo++;
    } else {
      state.combo = 1;
    }
    state.lastCatch = now;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;

    // points
    let pts = def.pts;
    if (state.doubleActive) pts *= 2;
    if (state.combo >= 5)   pts += 1;  // bonus on high combo

    state.score  += pts;
    state.caught++;

    // level up check
    const newLevel = Math.floor(state.score / CFG.levelEvery) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      _spawnPowerMsg(`مستوى ${state.level}! 🔥`);
    }

    _updateHUD();
    _updateCombo();

    // bump HUD score
    _dom.scoreEl?.classList.remove('bump');
    requestAnimationFrame(() => _dom.scoreEl?.classList.add('bump'));
    setTimeout(() => _dom.scoreEl?.classList.remove('bump'), 350);

    // score pop
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? window.innerWidth / 2;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? window.innerHeight / 2;
    _spawnScorePop(`+${pts}`, cx, cy, pts >= 3 ? '#c9914a' : 'var(--rose)');

    // combo burst
    if (state.combo >= 3) {
      _spawnComboBurst(cx, cy);
    }

    // hearts burst
    if (window.FloatingHearts && state.combo >= 4) {
      FloatingHearts.burst({ count: state.combo + 2, emojis: ['❤️','💕','💖','✨'] });
    }
  }

  // ─── Power-ups ───
  function _activateShield() {
    state.shieldActive = true;
    if (_dom.arena) _dom.arena.style.boxShadow = 'inset 0 0 0 3px rgba(78,205,196,0.7)';
    setTimeout(() => {
      state.shieldActive = false;
      if (_dom.arena) _dom.arena.style.boxShadow = '';
    }, 5000);
  }

  function _activateDouble() {
    state.doubleActive = true;
    if (_dom.arena) _dom.arena.style.boxShadow = 'inset 0 0 0 3px rgba(232,85,109,0.7)';
    setTimeout(() => {
      state.doubleActive = false;
      if (_dom.arena) _dom.arena.style.boxShadow = '';
    }, 6000);
  }

  // ─── End Game ───
  function _endGame() {
    state.phase = 'playing'; // allow cleanup
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    _pool.forEach(h => { if (h.active) _releaseHeart(h); });
    state.phase = 'result';

    const isNewRecord = state.score > state.highScore;
    if (isNewRecord) {
      state.highScore = state.score;
      _save('hc_high_score', state.highScore);
    }
    if (state.maxCombo > _load('hc_max_combo', 0)) {
      _save('hc_max_combo', state.maxCombo);
    }

    _showResult(isNewRecord);
    if (window.FloatingHearts) FloatingHearts.confetti(35);
  }

  // ─── Pause / Resume ───
  function pauseGame() {
    if (state.phase !== 'playing') return;
    state.phase = 'paused';
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    _showScreen('pause');
  }

  function resumeGame() {
    if (state.phase !== 'paused') return;
    state.phase = 'playing';
    _countdownTimer = setInterval(_tick, 1000);
    _scheduleSpawn();
    _showScreen('game');
  }

  // ─── HUD updates ───
  function _updateHUD() {
    if (_dom.scoreEl) _dom.scoreEl.textContent = state.score;
    if (_dom.levelEl) _dom.levelEl.textContent = state.level;
    _updateTimer();
  }

  function _updateTimer() {
    if (_dom.timerEl) _dom.timerEl.textContent = state.timeLeft;

    const pct = ((CFG.totalTime - state.timeLeft) / CFG.totalTime * 100).toFixed(1);
    if (_dom.progFill)  _dom.progFill.style.width  = pct + '%';
    if (_dom.progLabel) _dom.progLabel.textContent = `${state.caught} قلب`;

    // urgent styling
    const ring = document.getElementById('timer-ring');
    if (ring) ring.classList.toggle('urgent', state.timeLeft <= 10);
  }

  function _updateCombo() {
    const pill = _dom.comboEl?.closest?.('.hud-pill') ?? _dom.comboEl?.parentElement;
    if (_dom.comboEl) _dom.comboEl.textContent = state.combo;
    if (pill) {
      pill.classList.toggle('hot', state.combo >= 3);
      if (state.combo >= 3) {
        pill.classList.remove('bump');
        requestAnimationFrame(() => pill.classList.add('bump'));
        setTimeout(() => pill.classList.remove('bump'), 350);
      }
    }
  }

  // ─── Visual effects ───
  function _flashArena() {
    if (!_arena) return;
    _arena.style.transition = 'box-shadow .12s ease';
    _arena.style.boxShadow  = 'inset 0 0 0 3px rgba(244,67,54,0.55)';
    setTimeout(() => { _arena.style.boxShadow = ''; }, 300);
  }

  function _spawnScorePop(text, x, y, color) {
    const el = document.createElement('div');
    el.className   = 'score-pop';
    el.textContent = text;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    el.style.color = color || 'var(--rose)';
    el.style.fontSize = '1.6rem';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function _spawnComboBurst(x, y) {
    const el = document.createElement('div');
    el.className   = 'combo-burst';
    el.textContent = state.combo >= 8 ? `${state.combo}x OMG! 🔥` : `${state.combo}x COMBO! 💥`;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function _spawnPowerMsg(text) {
    const el = document.createElement('div');
    el.className   = 'power-msg';
    el.textContent = text;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  // ─── Screen management ───
  function _showScreen(which) {
    _dom.menu?.classList.toggle(      'hidden', which !== 'menu');
    _dom.gameScreen?.classList.toggle('hidden', which !== 'game');
    _dom.pauseOv?.classList.toggle(   'hidden', which !== 'pause');
    _dom.resultBox?.classList.toggle( 'hidden', which !== 'result');
  }

  function _hideResult() {
    _dom.resultBox?.classList.add('hidden');
  }

  function _goHome() {
    _showScreen('menu');
    state.phase = 'menu';
    // refresh menu stats
    if (_dom.menuHS)   _dom.menuHS.textContent   = _load('hc_high_score', 0);
    if (_dom.menuMaxC) _dom.menuMaxC.textContent = _load('hc_max_combo',  0);
  }

  // Quit game - stop everything and go home
  function _quitGame() {
    // stop all timers
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    // release all active hearts
    _pool.forEach(h => { if (h.active) _releaseHeart(h); });
    // hide pause overlay
    if (_dom.pauseOv) _dom.pauseOv.classList.add('hidden');
    // go to menu
    _goHome();
  }

  function _showResult(isNewRecord) {
    _showScreen('result');

    let msg, emoji;
    const pct = state.caught / Math.max(1, state.caught + state.missed) * 100;
    if      (state.score >= 60)  { msg = 'خارقة! إنتِ ملكة القلوب! 👑';        emoji = '👑'; }
    else if (state.score >= 40)  { msg = 'ممتازة جداً! قلبك سريع! 🏆';          emoji = '🏆'; }
    else if (state.score >= 25)  { msg = 'كويس! بس إنتِ أحسن من كده 😊';       emoji = '💕'; }
    else if (state.score >= 10)  { msg = 'حلو! محتاجة تتمرني أكتر 😄';          emoji = '⭐'; }
    else                          { msg = 'مش مهم، محمد بيحبك على طول 💝';      emoji = '💝'; }

    if (_dom.resScore)  _dom.resScore.textContent  = state.score;
    if (_dom.resCaught) _dom.resCaught.textContent = state.caught;
    if (_dom.resMissed) _dom.resMissed.textContent = state.missed;
    if (_dom.resCombo)  _dom.resCombo.textContent  = state.maxCombo + 'x';
    if (_dom.resMsg)    _dom.resMsg.textContent    = `${emoji} ${msg}`;
    if (_dom.resNewRec) _dom.resNewRec.classList.toggle('hidden', !isNewRecord);
  }

  // ─── Persist ───
  function _save(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (_) {}
  }
  function _load(key, fallback) {
    try { return parseInt(localStorage.getItem(key) || String(fallback), 10) || fallback; } catch (_) { return fallback; }
  }

  return { init, startGame, pauseGame, resumeGame };
})();

document.addEventListener('DOMContentLoaded', () => HeartCatcherGame.init());