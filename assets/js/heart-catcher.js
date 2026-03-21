/**
 * ════════════════════════════════════════
 *  heart-catcher-v2.js — صائد القلوب v2
 *  + Particle Engine
 *  + Bomb Hearts
 *  + Magnet Power-up
 *  + Achievement System
 *  + Difficulty Waves
 *  + Screen Shake
 *  + Heart Trails
 *  + Streak Protection
 *  + Stats Dashboard
 * ════════════════════════════════════════
 */

const HeartCatcherGame = (() => {

  // ─── Config ───────────────────────────────────────────────────────────
  const CFG = {
    totalTime:      window.APP_CONFIG?.heartCatcher?.totalTime ?? 60,
    spawnBase:      1400,
    spawnMin:       380,
    fallBase:       3200,
    fallMin:        1200,
    poolSize:       60,
    comboWindow:    1300,
    levelEvery:     8,
    shakeEnabled:   true,
    trailEnabled:   true,
    particleCount:  12,
    magnetDuration: 5000,
    shieldDuration: 5000,
    doubleDuration: 6000,
    slowDuration:   5000,
    streakProtect:  1,      // عدد القلوب الفايتة اللي بتتحمي
  };

  // ─── Heart Definitions ──────────────────────────────────────────────
  const HEARTS = [
    { e: '❤️',  pts: 1,  w: 32, type: 'normal'  },
    { e: '💕',  pts: 1,  w: 22, type: 'normal'  },
    { e: '💖',  pts: 2,  w: 14, type: 'normal'  },
    { e: '💗',  pts: 2,  w: 10, type: 'normal'  },
    { e: '💘',  pts: 3,  w: 5,  type: 'special' },
    { e: '🌹',  pts: 3,  w: 3,  type: 'special' },
    { e: '💎',  pts: 5,  w: 2,  type: 'gem'     },  // Gem — نقاط عالية جداً
    { e: '💣',  pts: -3, w: 6,  type: 'bomb'    },  // Bomb — تخصمك نقاط!
    { e: '⭐',  pts: 0,  w: 1,  type: 'shield'  },
    { e: '✨',  pts: 0,  w: 1,  type: 'double'  },
    { e: '🧲',  pts: 0,  w: 1,  type: 'magnet'  },  // Magnet — يجذب كل القلوب
    { e: '🐢',  pts: 0,  w: 1,  type: 'slow'    },  // Slow — يبطئ السقوط
  ];
  const _totalWeight = HEARTS.reduce((s, h) => s + h.w, 0);

  // ─── Achievements ────────────────────────────────────────────────────
  const ACHIEVEMENTS = [
    { id: 'first_catch',    icon: '🏅', title: 'أول قلب',        desc: 'امسكي أول قلب',          check: s => s.caught >= 1 },
    { id: 'combo_5',        icon: '🔥', title: 'كومبو ×5',       desc: 'وصلي كومبو 5',            check: s => s.maxCombo >= 5 },
    { id: 'combo_10',       icon: '💥', title: 'كومبو ×10',      desc: 'وصلي كومبو 10',           check: s => s.maxCombo >= 10 },
    { id: 'score_25',       icon: '⭐', title: '25 نقطة',         desc: 'اجمعي 25 نقطة',           check: s => s.score >= 25 },
    { id: 'score_50',       icon: '🌟', title: '50 نقطة',         desc: 'اجمعي 50 نقطة',           check: s => s.score >= 50 },
    { id: 'score_100',      icon: '👑', title: '100 نقطة',        desc: 'الملكة! 100 نقطة',        check: s => s.score >= 100 },
    { id: 'gem_catch',      icon: '💎', title: 'صيادة جواهر',    desc: 'امسكي جوهرة',             check: s => s.gemsCount >= 1 },
    { id: 'no_miss',        icon: '🎯', title: 'لا تفوتيها',     desc: '30 ثانية بدون أخطاء',     check: s => s.noMissStreak >= 30 },
    { id: 'bomb_dodge',     icon: '💣', title: 'هربتي!',         desc: 'اتجنبي 5 قنابل',          check: s => s.bombsDodged >= 5 },
    { id: 'level_5',        icon: '🚀', title: 'مستوى 5',        desc: 'وصلي للمستوى 5',          check: s => s.level >= 5 },
    { id: 'magnet_use',     icon: '🧲', title: 'مغناطيس',        desc: 'استخدمي المغناطيس',       check: s => s.magnetUsed >= 1 },
    { id: 'power_collector',icon: '✨', title: 'جامعة قوة',      desc: 'جمعي 3 power-ups',        check: s => s.powerUpsCollected >= 3 },
  ];

  // ─── State ─────────────────────────────────────────────────────────
  let state = {};
  const defaultState = () => ({
    phase:            'menu',
    score:            0,
    combo:            0,
    maxCombo:         0,
    level:            1,
    timeLeft:         CFG.totalTime,
    caught:           0,
    missed:           0,
    lastCatch:        0,
    highScore:        0,
    shieldActive:     false,
    doubleActive:     false,
    magnetActive:     false,
    slowActive:       false,
    streakProtLeft:   CFG.streakProtect,
    gemsCount:        0,
    bombsDodged:      0,
    noMissStreak:     0,
    magnetUsed:       0,
    powerUpsCollected:0,
    earnedAchievements: [],
    // wave system
    wavePhase:        'normal',  // normal | rush | calm | chaos
    waveTimer:        0,
  });

  // ─── Timers & Refs ──────────────────────────────────────────────────
  let _countdownTimer = null;
  let _spawnTimer     = null;
  let _spawnInterval  = CFG.spawnBase;
  let _waveTimer      = null;
  let _magnetTimer    = null;
  const _pool  = [];
  const _trails = [];
  let _arena   = null;
  let _dom     = {};
  let _gameStartTime = 0;
  let _noMissSeconds = 0;

  // ─── Particle Pool ──────────────────────────────────────────────────
  const _particles = [];
  const PARTICLE_COLORS = ['#e8556d','#f5a0b0','#ffcf77','#ff8fa3','#c084fc','#67e8f9'];

  function _spawnParticles(x, y, color, count = CFG.particleCount) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'hc-particle';
      const angle  = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.8;
      const speed  = 60 + Math.random() * 80;
      const size   = 5 + Math.random() * 8;
      el.style.cssText = `
        position:fixed;
        left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:${color || PARTICLE_COLORS[Math.floor(Math.random()*PARTICLE_COLORS.length)]};
        pointer-events:none;
        z-index:9999;
        transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      _particles.push({ el, vx, vy, life: 1, x, y });
    }
    _animateParticles();
  }

  let _particleRAF = null;
  let _lastParticleTime = 0;
  function _animateParticles() {
    if (_particleRAF) return;
    const step = (ts) => {
      const dt = Math.min((ts - _lastParticleTime) / 1000, 0.05);
      _lastParticleTime = ts;
      for (let i = _particles.length - 1; i >= 0; i--) {
        const p = _particles[i];
        p.life -= dt * 2.5;
        if (p.life <= 0) { p.el.remove(); _particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.el.style.left    = p.x + 'px';
        p.el.style.top     = p.y + 'px';
        p.el.style.opacity = p.life;
        p.el.style.transform = `translate(-50%,-50%) scale(${p.life})`;
      }
      if (_particles.length > 0) requestAnimationFrame(step);
      else _particleRAF = null;
    };
    _particleRAF = requestAnimationFrame(ts => { _lastParticleTime = ts; step(ts); });
  }

  // ─── Screen Shake ───────────────────────────────────────────────────
  function _shake(intensity = 6, duration = 350) {
    if (!CFG.shakeEnabled || !_arena) return;
    const wrap = document.getElementById('game-wrap') || _arena;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      if (elapsed >= duration) { wrap.style.transform = ''; return; }
      const decay = 1 - elapsed / duration;
      const dx = (Math.random() - 0.5) * intensity * 2 * decay;
      const dy = (Math.random() - 0.5) * intensity * decay;
      wrap.style.transform = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ─── Trail Effect ────────────────────────────────────────────────────
  function _addTrail(slot) {
    if (!CFG.trailEnabled) return;
    const interval = setInterval(() => {
      if (!slot.active) { clearInterval(interval); return; }
      const el = slot.el;
      const rect = el.getBoundingClientRect();
      const trail = document.createElement('div');
      trail.className = 'hc-trail';
      trail.textContent = el.textContent;
      trail.style.cssText = `
        position:fixed;
        left:${rect.left + rect.width/2}px;
        top:${rect.top + rect.height/2}px;
        font-size:1.4rem;
        opacity:0.35;
        pointer-events:none;
        z-index:1;
        transform:translate(-50%,-50%) scale(0.7);
        transition: opacity 0.4s, transform 0.4s;
      `;
      document.body.appendChild(trail);
      requestAnimationFrame(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'translate(-50%,-50%) scale(0.3)';
      });
      setTimeout(() => trail.remove(), 400);
    }, 80);
    slot._trailInterval = interval;
  }

  // ─── Achievement System ──────────────────────────────────────────────
  const _unlockedAchievements = new Set(_load('hc_achievements', '').split(',').filter(Boolean));

  function _checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (_unlockedAchievements.has(ach.id)) continue;
      if (state.earnedAchievements.includes(ach.id)) continue;
      if (ach.check(state)) {
        state.earnedAchievements.push(ach.id);
        _showAchievement(ach);
      }
    }
  }

  function _showAchievement(ach) {
    const el = document.createElement('div');
    el.className = 'hc-achievement';
    el.innerHTML = `
      <div class="hc-ach-icon">${ach.icon}</div>
      <div class="hc-ach-body">
        <div class="hc-ach-title">🏆 إنجاز جديد!</div>
        <div class="hc-ach-name">${ach.title}</div>
        <div class="hc-ach-desc">${ach.desc}</div>
      </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 500);
    }, 3200);
  }

  function _saveAchievements() {
    const all = [..._unlockedAchievements, ...state.earnedAchievements];
    _save('hc_achievements', [...new Set(all)].join(','));
  }

  // ─── Wave System ─────────────────────────────────────────────────────
  const WAVES = [
    { phase: 'normal', duration: 15, spawnMult: 1.0, fallMult: 1.0,  label: '' },
    { phase: 'rush',   duration: 8,  spawnMult: 0.5, fallMult: 1.3,  label: '⚡ موجة سريعة!' },
    { phase: 'calm',   duration: 6,  spawnMult: 1.6, fallMult: 0.75, label: '🌸 موجة هادئة' },
    { phase: 'chaos',  duration: 7,  spawnMult: 0.35,fallMult: 1.5,  label: '🌪️ فوضى!' },
  ];
  let _currentWaveIdx = 0;
  let _waveSeq = [0, 1, 0, 2, 0, 3, 0, 1, 0];

  function _startWaves() {
    _currentWaveIdx = 0;
    _nextWave();
  }

  function _nextWave() {
    if (state.phase !== 'playing') return;
    const wIdx = _waveSeq[_currentWaveIdx % _waveSeq.length];
    const wave  = WAVES[wIdx];
    state.wavePhase = wave.phase;
    if (wave.label) _spawnPowerMsg(wave.label);
    _updateSpawnInterval();
    _waveTimer = setTimeout(() => {
      _currentWaveIdx++;
      _nextWave();
    }, wave.duration * 1000);
  }

  function _updateSpawnInterval() {
    const wIdx = _waveSeq[_currentWaveIdx % _waveSeq.length];
    const wave  = WAVES[wIdx];
    const progress = 1 - (state.timeLeft / CFG.totalTime);
    const base = Math.max(
      CFG.spawnMin,
      CFG.spawnBase - Math.floor(progress * (CFG.spawnBase - CFG.spawnMin))
    );
    _spawnInterval = base * wave.spawnMult;
  }

  // ─── Pool ─────────────────────────────────────────────────────────
  function _buildPool() {
    for (let i = 0; i < CFG.poolSize; i++) {
      const el = document.createElement('div');
      el.className = 'fheart';
      el.style.display = 'none';
      el.style.willChange = 'top, transform';
      el.addEventListener('click',      _onHeartClick);
      el.addEventListener('touchstart', _onHeartClick, { passive: true });
      _arena?.appendChild(el);
      _pool.push({ el, active: false, def: null, timer: null, _trailInterval: null });
    }
  }

  function _acquireHeart() { return _pool.find(h => !h.active) ?? null; }

  function _releaseHeart(h) {
    clearTimeout(h.timer);
    if (h._trailInterval) { clearInterval(h._trailInterval); h._trailInterval = null; }
    h.active  = false;
    h.def     = null;
    const el  = h.el;
    el.style.display     = 'none';
    el.style.top         = '-70px';
    el.style.left        = '';
    el.style.transition  = '';
    el.style.animation   = '';
    el.classList.remove('special', 'near', 'popped', 'powerup', 'bomb', 'gem');
    el.removeAttribute('data-pool-idx');
  }

  // ─── Weighted random ────────────────────────────────────────────────
  function _pickHeart() {
    // بنفضل bomb نادر في البداية
    let r = Math.random() * _totalWeight;
    for (const h of HEARTS) {
      r -= h.w;
      if (r <= 0) return h;
    }
    return HEARTS[0];
  }

  // ─── Init ─────────────────────────────────────────────────────────
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
      menuHS:     document.getElementById('menu-high-score'),
      menuMaxC:   document.getElementById('menu-max-combo'),
      resScore:   document.getElementById('res-score'),
      resCaught:  document.getElementById('res-caught'),
      resMissed:  document.getElementById('res-missed'),
      resCombo:   document.getElementById('res-combo'),
      resMsg:     document.getElementById('res-msg'),
      resNewRec:  document.getElementById('res-new-record'),
      touchHint:  document.getElementById('touch-hint'),
      // New elements
      waveLabel:  document.getElementById('wave-label'),
      powerBar:   document.getElementById('power-bar'),
      achPanel:   document.getElementById('ach-panel'),
    };

    _arena = _dom.arena;

    state = defaultState();
    state.highScore = _load('hc_high_score', 0);
    const savedMaxCombo = _load('hc_max_combo', 0);
    if (_dom.menuHS)   _dom.menuHS.textContent  = state.highScore;
    if (_dom.menuMaxC) _dom.menuMaxC.textContent = savedMaxCombo;

    _buildPool();
    _injectStyles();

    _dom.startBtn?.addEventListener('click',   startGame);
    _dom.pauseBtn?.addEventListener('click',   pauseGame);
    _dom.resumeBtn?.addEventListener('click',  resumeGame);
    _dom.restartBtn?.addEventListener('click', () => { resumeGame(); startGame(); });
    _dom.homeBtn?.addEventListener('click',    _goHome);
    _dom.quitBtn?.addEventListener('click',    _quitGame);
    _dom.playAgain?.addEventListener('click',  () => { _hideResult(); startGame(); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (state.phase === 'playing') pauseGame();
        else if (state.phase === 'paused') resumeGame();
      }
    });
  }

  // ─── Inject dynamic CSS ──────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('hc-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'hc-v2-styles';
    style.textContent = `
      /* Particles */
      .hc-particle { position:fixed; border-radius:50%; pointer-events:none; z-index:9999; }

      /* Trails */
      .hc-trail { position:fixed; font-size:1.4rem; pointer-events:none; z-index:1; }

      /* Achievement toast */
      .hc-achievement {
        position: fixed;
        top: 90px;
        right: -320px;
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(255,240,245,0.95);
        backdrop-filter: blur(20px);
        border: 1.5px solid rgba(232,85,109,0.4);
        border-radius: 20px;
        padding: 14px 20px;
        box-shadow: 0 8px 32px rgba(232,85,109,0.3);
        z-index: 10000;
        transition: right 0.5s cubic-bezier(.175,.885,.32,1.275);
        max-width: 300px;
        direction: rtl;
      }
      .hc-achievement.visible { right: 16px; }
      .hc-ach-icon { font-size: 2rem; flex-shrink:0; }
      .hc-ach-title { font-size:0.75rem; color:#b05070; font-weight:700; margin-bottom:2px; }
      .hc-ach-name { font-size:1rem; font-weight:900; color:#4a2030; }
      .hc-ach-desc { font-size:0.8rem; color:#7a4555; }

      /* Bomb styling */
      .fheart.bomb {
        font-size: 2.2rem !important;
        filter: drop-shadow(0 0 8px rgba(50,0,0,0.5)) !important;
        animation: bombPulse 0.6s ease-in-out infinite !important;
      }
      @keyframes bombPulse {
        0%,100% { transform: scale(1) rotate(-5deg); }
        50%      { transform: scale(1.15) rotate(5deg); }
      }

      /* Gem styling */
      .fheart.gem {
        font-size: 2.6rem !important;
        filter: drop-shadow(0 0 16px rgba(130,80,255,0.7)) !important;
        animation: gemSpin 2s linear infinite !important;
      }
      @keyframes gemSpin {
        from { transform: rotate(0deg) scale(1); }
        50%  { transform: rotate(180deg) scale(1.2); }
        to   { transform: rotate(360deg) scale(1); }
      }

      /* Magnet glow */
      .fheart.magnet-type {
        filter: drop-shadow(0 0 12px rgba(50,150,255,0.8)) !important;
      }

      /* Power bar */
      #power-bar {
        position: absolute;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        z-index: 20;
        transition: opacity 0.4s;
      }
      .power-pip {
        padding: 6px 14px;
        border-radius: 99px;
        font-size: 0.85rem;
        font-weight: 700;
        border: 1.5px solid;
        animation: pipPulse 1.5s ease-in-out infinite;
      }
      .power-pip.shield  { background: rgba(78,205,196,0.25); border-color: #4ecdc4; color: #1a8c85; }
      .power-pip.double  { background: rgba(232,85,109,0.2);  border-color: #e8556d; color: #b02040; }
      .power-pip.magnet  { background: rgba(80,140,255,0.2);  border-color: #508cff; color: #2040c0; }
      .power-pip.slow    { background: rgba(140,220,80,0.2);  border-color: #8cdc50; color: #406018; }
      @keyframes pipPulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.06); }
      }

      /* Wave label */
      #wave-label {
        position: absolute;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.1rem;
        font-weight: 900;
        pointer-events: none;
        z-index: 25;
        opacity: 0;
        transition: opacity 0.4s;
      }
      #wave-label.show { opacity: 1; }

      /* Magnet effect ring */
      #magnet-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 260px;
        height: 260px;
        margin: -130px 0 0 -130px;
        border: 2.5px dashed rgba(80,140,255,0.45);
        border-radius: 50%;
        pointer-events: none;
        z-index: 15;
        display: none;
        animation: magnetSpin 3s linear infinite;
      }
      @keyframes magnetSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

      /* Bomb caught flash */
      @keyframes bombFlash {
        0%,100% { box-shadow: inset 0 0 0 0px rgba(200,0,0,0); }
        50%      { box-shadow: inset 0 0 40px 8px rgba(220,0,0,0.45); }
      }
      .arena-bomb-flash { animation: bombFlash 0.5s ease-in-out 2; }

      /* Streak protect indicator */
      .streak-protect-ring {
        position: absolute;
        inset: 0;
        border: 3px solid rgba(255,215,0,0.6);
        border-radius: 8px;
        pointer-events: none;
        animation: protectFade 1s ease-out forwards;
      }
      @keyframes protectFade { to { opacity:0; transform: scale(1.08); } }

      /* HUD timer urgent */
      #timer-ring.urgent {
        border-color: #e85555 !important;
        animation: urgentPulse 0.4s ease-in-out infinite !important;
      }
      @keyframes urgentPulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.08); box-shadow: 0 0 20px rgba(232,50,50,0.5); }
      }

      /* Bomb miss flash */
      .bomb-popped { filter: drop-shadow(0 0 20px rgba(255,0,0,0.8)) !important; }

      /* Score pop v2 */
      .score-pop {
        position: fixed;
        font-size: 1.6rem;
        font-weight: 900;
        pointer-events: none;
        z-index: 9998;
        animation: scorePop 0.9s ease-out forwards;
        text-shadow: 0 2px 8px rgba(0,0,0,0.18);
      }
      @keyframes scorePop {
        0%   { opacity:1; transform: translateY(0) scale(1); }
        60%  { opacity:1; transform: translateY(-50px) scale(1.2); }
        100% { opacity:0; transform: translateY(-80px) scale(0.8); }
      }
      .score-pop.negative {
        color: #e84040 !important;
        animation: scoreNeg 0.9s ease-out forwards;
      }
      @keyframes scoreNeg {
        0%   { opacity:1; transform: translateY(0) scale(1.3); }
        50%  { transform: translateY(20px) scale(1); }
        100% { opacity:0; transform: translateY(40px) scale(0.8); }
      }

      /* Combo burst v2 */
      .combo-burst {
        position: fixed;
        font-size: 1.5rem;
        font-weight: 900;
        pointer-events: none;
        z-index: 9997;
        color: #e8556d;
        text-shadow: 0 0 20px rgba(232,85,109,0.6);
        animation: comboBurst 1s ease-out forwards;
      }
      @keyframes comboBurst {
        0%   { opacity:1; transform: translate(-50%,-50%) scale(0.5); }
        40%  { opacity:1; transform: translate(-50%,-50%) scale(1.3); }
        100% { opacity:0; transform: translate(-50%,-100%) scale(1); }
      }

      /* Power msg */
      .power-msg {
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%,-50%);
        font-size: 1.5rem;
        font-weight: 900;
        pointer-events: none;
        z-index: 9996;
        animation: powerMsg 2s ease-out forwards;
        text-shadow: 0 2px 12px rgba(0,0,0,0.2);
        white-space: nowrap;
      }
      @keyframes powerMsg {
        0%   { opacity:0; transform: translate(-50%,-50%) scale(0.7); }
        20%  { opacity:1; transform: translate(-50%,-70%) scale(1.1); }
        80%  { opacity:1; }
        100% { opacity:0; transform: translate(-50%,-100%) scale(0.9); }
      }

      /* Magnet pull animation */
      @keyframes magnetPull {
        from { opacity:1; }
        to   { opacity:0; transform: translate(var(--mx),var(--my)) scale(0.2); }
      }
      .magnet-pulled { animation: magnetPull 0.4s ease-in forwards; }

      /* Result achievements list */
      .res-achievements { margin: 12px 0; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
      .res-ach-badge {
        background: rgba(255,220,235,0.7);
        border: 1px solid rgba(232,85,109,0.3);
        border-radius: 99px;
        padding: 4px 12px;
        font-size: 0.85rem;
        color: #4a2030;
      }

      /* HUD bump */
      @keyframes hudBump {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.25); }
      }
      .bump { animation: hudBump 0.35s var(--spring, cubic-bezier(.175,.885,.32,1.275)); }
    `;
    document.head.appendChild(style);

    // Magnet ring element
    const ring = document.createElement('div');
    ring.id = 'magnet-ring';
    _arena?.appendChild(ring);
  }

  // ─── Start ──────────────────────────────────────────────────────────
  function startGame() {
    state = defaultState();
    state.highScore    = _load('hc_high_score', 0);
    state.phase        = 'playing';
    state.streakProtLeft = CFG.streakProtect;
    _gameStartTime     = Date.now();
    _noMissSeconds     = 0;

    _showScreen('game');
    _updateHUD();

    _spawnInterval = CFG.spawnBase;
    _scheduleSpawn();
    _countdownTimer = setInterval(_tick, 1000);
    _startWaves();

    _clearActivePowerUps();
  }

  // ─── Tick ─────────────────────────────────────────────────────────
  function _tick() {
    if (state.phase !== 'playing') return;
    state.timeLeft--;
    if (state.missed === 0) {
      _noMissSeconds++;
      state.noMissStreak = _noMissSeconds;
    }
    _updateTimer();
    _checkAchievements();
    if (state.timeLeft <= 0) _endGame();
  }

  // ─── Spawn ────────────────────────────────────────────────────────
  function _scheduleSpawn() {
    if (state.phase !== 'playing') return;
    clearTimeout(_spawnTimer);
    _spawnTimer = setTimeout(() => {
      _spawnHeart();
      _updateSpawnInterval();
      _scheduleSpawn();
    }, _spawnInterval + (Math.random() * 300 - 150));
  }

  function _spawnHeart() {
    if (state.phase !== 'playing') return;
    const slot = _acquireHeart();
    if (!slot) return;

    const def    = _pickHeart();
    const arenaW = _arena.offsetWidth;
    const size   = 44;
    const x      = Math.random() * (arenaW - size - 20) + 10;

    const wIdx   = _waveSeq[_currentWaveIdx % _waveSeq.length];
    const wave   = WAVES[wIdx];
    const fallMult = state.slowActive ? 0.55 : wave.fallMult;
    const fallDur = Math.max(
      CFG.fallMin,
      (CFG.fallBase - (state.level - 1) * 140) * fallMult
    );

    slot.active = true;
    slot.def    = def;

    const el = slot.el;
    el.textContent   = def.e;
    el.style.display = 'block';
    el.style.left    = x + 'px';
    el.style.top     = '-60px';
    el.style.animation = '';
    el.classList.toggle('special',     def.type === 'special');
    el.classList.toggle('gem',         def.type === 'gem');
    el.classList.toggle('bomb',        def.type === 'bomb');
    el.classList.toggle('powerup',     ['shield','double','magnet','slow'].includes(def.type));
    el.classList.toggle('magnet-type', def.type === 'magnet');
    el.setAttribute('data-pool-idx', _pool.indexOf(slot));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `top ${fallDur}ms linear`;
        el.style.top = (_arena.offsetHeight + 20) + 'px';
      });
    });

    // Trail
    _addTrail(slot);

    // Auto-release when reaches bottom
    slot.timer = setTimeout(() => {
      if (!slot.active) return;
      if (def.type === 'bomb') {
        // بمب فاتت — كويس! نحسب dodge
        state.bombsDodged++;
      } else if (!state.shieldActive) {
        // Streak protection
        if (state.streakProtLeft > 0 && state.combo >= 3) {
          state.streakProtLeft--;
          _showStreakProtect();
        } else {
          state.missed++;
          state.combo = 0;
          _noMissSeconds = 0;
          state.noMissStreak = 0;
          _updateCombo();
          _flashArena('miss');
          _shake(5, 280);
        }
      }
      _releaseHeart(slot);
    }, fallDur + 100);
  }

  // ─── Magnet attraction ────────────────────────────────────────────
  function _activateMagnet() {
    state.magnetActive = true;
    state.magnetUsed++;
    state.powerUpsCollected++;
    const ring = document.getElementById('magnet-ring');
    if (ring) ring.style.display = 'block';
    _updatePowerBar();

    // دلوقتي نجذب كل القلوب القريبة
    const centerX = _arena.offsetWidth  / 2;
    const centerY = _arena.offsetHeight / 2;
    _pool.forEach(slot => {
      if (!slot.active || slot.def?.type === 'bomb') return;
      const el   = slot.el;
      const rect = el.getBoundingClientRect();
      const dx   = centerX - rect.left;
      const dy   = centerY - rect.top;
      el.style.setProperty('--mx', dx + 'px');
      el.style.setProperty('--my', dy + 'px');
      el.classList.add('magnet-pulled');
      clearTimeout(slot.timer);
      slot.timer = setTimeout(() => {
        if (!slot.active) return;
        // نحسب كأنه اتمسك
        const pts = (slot.def.pts || 1) * (state.doubleActive ? 2 : 1);
        state.score  += pts;
        state.caught++;
        _spawnParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#508cff', 6);
        _releaseHeart(slot);
        _updateHUD();
      }, 380);
    });

    _magnetTimer = setTimeout(() => {
      state.magnetActive = false;
      if (ring) ring.style.display = 'none';
      _updatePowerBar();
    }, CFG.magnetDuration);
  }

  // ─── Power bar update ─────────────────────────────────────────────
  function _updatePowerBar() {
    const bar = document.getElementById('power-bar');
    if (!bar) return;
    bar.innerHTML = '';
    if (state.shieldActive)  bar.innerHTML += '<div class="power-pip shield">🛡️ درع</div>';
    if (state.doubleActive)  bar.innerHTML += '<div class="power-pip double">✨ ×2</div>';
    if (state.magnetActive)  bar.innerHTML += '<div class="power-pip magnet">🧲 مغناطيس</div>';
    if (state.slowActive)    bar.innerHTML += '<div class="power-pip slow">🐢 بطيء</div>';
    bar.style.opacity = bar.innerHTML ? '1' : '0';
  }

  // ─── Click / Catch ────────────────────────────────────────────────
  function _onHeartClick(e) {
    e.stopPropagation();
    if (state.phase !== 'playing') return;

    const idx  = parseInt(e.currentTarget.getAttribute('data-pool-idx'), 10);
    const slot = _pool[idx];
    if (!slot?.active) return;

    const def = slot.def;
    const cx  = e.clientX ?? e.touches?.[0]?.clientX ?? window.innerWidth / 2;
    const cy  = e.clientY ?? e.touches?.[0]?.clientY ?? window.innerHeight / 2;

    slot.el.classList.add('popped');
    _releaseHeart(slot);

    // ─── Bomb! ───
    if (def.type === 'bomb') {
      const lostPts = Math.abs(def.pts);
      state.score = Math.max(0, state.score - lostPts);
      state.combo = 0;
      _noMissSeconds = 0;
      _updateCombo();
      _updateHUD();
      _spawnScorePop(`-${lostPts}`, cx, cy, '#e84040', true);
      _shake(12, 500);
      _flashArena('bomb');
      _spawnPowerMsg('💣 انفجار! خسرتِ نقاط!');
      _spawnParticles(cx, cy, '#ff4444', 20);
      return;
    }

    // ─── Power-ups ───
    if (def.type === 'shield') {
      _activateShield();
      _spawnPowerMsg('🛡️ درع! مفيش خصم ثواني!');
      _spawnParticles(cx, cy, '#4ecdc4', 10);
      state.powerUpsCollected++;
      _checkAchievements();
      return;
    }
    if (def.type === 'double') {
      _activateDouble();
      _spawnPowerMsg('✨ نقاط مضاعفة!');
      _spawnParticles(cx, cy, '#ffcf77', 10);
      state.powerUpsCollected++;
      _checkAchievements();
      return;
    }
    if (def.type === 'magnet') {
      _activateMagnet();
      _spawnPowerMsg('🧲 مغناطيس! يجذب كل القلوب!');
      _spawnParticles(cx, cy, '#508cff', 10);
      _checkAchievements();
      return;
    }
    if (def.type === 'slow') {
      _activateSlow();
      _spawnPowerMsg('🐢 تحبطي الزمن!');
      _spawnParticles(cx, cy, '#8cdc50', 10);
      state.powerUpsCollected++;
      _checkAchievements();
      return;
    }

    // ─── Normal & special hearts ───
    const now = Date.now();
    if (now - state.lastCatch <= CFG.comboWindow) {
      state.combo++;
    } else {
      state.combo = 1;
    }
    state.lastCatch = now;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    if (def.type === 'gem') state.gemsCount++;

    let pts = def.pts;
    if (state.doubleActive) pts *= 2;
    if (state.combo >= 5)   pts += 1;
    if (state.combo >= 10)  pts += 2;

    state.score  += pts;
    state.caught++;

    // Level up
    const newLevel = Math.floor(state.score / CFG.levelEvery) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      _spawnPowerMsg(`مستوى ${state.level}! 🔥`);
      _shake(4, 200);
    }

    _updateHUD();
    _updateCombo();
    _checkAchievements();

    // Particles
    const pColor = def.type === 'gem' ? '#c084fc' : def.pts >= 3 ? '#ffcf77' : '#ff8fa3';
    _spawnParticles(cx, cy, pColor, def.type === 'gem' ? 20 : CFG.particleCount);

    // Score pop
    _spawnScorePop(`+${pts}`, cx, cy, def.type === 'gem' ? '#9333ea' : pts >= 3 ? '#c9914a' : 'var(--rose)');

    // Combo burst
    if (state.combo >= 3) {
      _spawnComboBurst(cx, cy);
      _shake(3 + state.combo * 0.5, 200);
    }

    // HUD bump
    _dom.scoreEl?.classList.remove('bump');
    requestAnimationFrame(() => _dom.scoreEl?.classList.add('bump'));
    setTimeout(() => _dom.scoreEl?.classList.remove('bump'), 350);

    // FloatingHearts burst
    if (window.FloatingHearts && state.combo >= 4) {
      FloatingHearts.burst({ count: Math.min(state.combo + 2, 15), emojis: ['❤️','💕','💖','✨'] });
    }
  }

  // ─── Streak protect indicator ────────────────────────────────────
  function _showStreakProtect() {
    if (!_arena) return;
    const el = document.createElement('div');
    el.className = 'streak-protect-ring';
    _arena.appendChild(el);
    setTimeout(() => el.remove(), 1000);
    _spawnPowerMsg('🛡️ الكومبو محمي!');
  }

  // ─── Power-ups ────────────────────────────────────────────────────
  function _activateShield() {
    state.shieldActive = true;
    _updatePowerBar();
    setTimeout(() => { state.shieldActive = false; _updatePowerBar(); }, CFG.shieldDuration);
  }

  function _activateDouble() {
    state.doubleActive = true;
    _updatePowerBar();
    setTimeout(() => { state.doubleActive = false; _updatePowerBar(); }, CFG.doubleDuration);
  }

  function _activateSlow() {
    state.slowActive = true;
    _updatePowerBar();
    // نحدّث transition كل القلوب النشطة
    _pool.forEach(slot => {
      if (!slot.active) return;
      const el = slot.el;
      const curTop = parseFloat(el.style.top);
      el.style.transition = `top ${(CFG.fallBase * 0.55)}ms linear`;
    });
    setTimeout(() => {
      state.slowActive = false;
      _updatePowerBar();
    }, CFG.slowDuration);
  }

  function _clearActivePowerUps() {
    state.shieldActive = state.doubleActive = state.magnetActive = state.slowActive = false;
    const ring = document.getElementById('magnet-ring');
    if (ring) ring.style.display = 'none';
    _updatePowerBar();
  }

  // ─── End ─────────────────────────────────────────────────────────
  function _endGame() {
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    clearTimeout(_waveTimer);
    if (_magnetTimer) clearTimeout(_magnetTimer);
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
    _saveAchievements();
    _showResult(isNewRecord);
    if (window.FloatingHearts) FloatingHearts.confetti(35);
  }

  // ─── Pause / Resume ──────────────────────────────────────────────
  function pauseGame() {
    if (state.phase !== 'playing') return;
    state.phase = 'paused';
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    clearTimeout(_waveTimer);
    _showScreen('pause');
  }

  function resumeGame() {
    if (state.phase !== 'paused') return;
    state.phase = 'playing';
    _countdownTimer = setInterval(_tick, 1000);
    _scheduleSpawn();
    _nextWave();
    _showScreen('game');
  }

  // ─── HUD ──────────────────────────────────────────────────────────
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

  // ─── Visual FX ───────────────────────────────────────────────────
  function _flashArena(type = 'miss') {
    if (!_arena) return;
    const colors = {
      miss: 'rgba(244,67,54,0.45)',
      bomb: 'rgba(220,20,20,0.65)',
    };
    _arena.style.transition = 'box-shadow .12s ease';
    _arena.style.boxShadow  = `inset 0 0 0 4px ${colors[type] || colors.miss}`;
    if (type === 'bomb') _arena.classList.add('arena-bomb-flash');
    setTimeout(() => {
      _arena.style.boxShadow = '';
      _arena.classList.remove('arena-bomb-flash');
    }, 400);
  }

  function _spawnScorePop(text, x, y, color, negative = false) {
    const el = document.createElement('div');
    el.className = 'score-pop' + (negative ? ' negative' : '');
    el.textContent = text;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    el.style.color = color || 'var(--rose)';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function _spawnComboBurst(x, y) {
    const el = document.createElement('div');
    el.className   = 'combo-burst';
    const texts = ['', '', '🔥 NICE!', '💥 GREAT!', '⚡ AMAZING!', '🌟 WOW!', '👑 GODLIKE!'];
    el.textContent = state.combo >= 10 ? `${state.combo}x 👑 أسطورة!`
                   : state.combo >= 8  ? `${state.combo}x 🌟 خارقة!`
                   : state.combo >= 5  ? `${state.combo}x 🔥 رائعة!`
                   : `${state.combo}x COMBO!`;
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

  // ─── Screens ─────────────────────────────────────────────────────
  function _showScreen(which) {
    _dom.menu?.classList.toggle(      'hidden', which !== 'menu');
    _dom.gameScreen?.classList.toggle('hidden', which !== 'game');
    _dom.pauseOv?.classList.toggle(   'hidden', which !== 'pause');
    _dom.resultBox?.classList.toggle( 'hidden', which !== 'result');
  }

  function _hideResult() { _dom.resultBox?.classList.add('hidden'); }

  function _goHome() {
    _showScreen('menu');
    state.phase = 'menu';
    if (_dom.menuHS)   _dom.menuHS.textContent   = _load('hc_high_score', 0);
    if (_dom.menuMaxC) _dom.menuMaxC.textContent = _load('hc_max_combo',  0);
  }

  function _quitGame() {
    clearInterval(_countdownTimer);
    clearTimeout(_spawnTimer);
    clearTimeout(_waveTimer);
    _pool.forEach(h => { if (h.active) _releaseHeart(h); });
    _clearActivePowerUps();
    _dom.pauseOv?.classList.add('hidden');
    _goHome();
  }

  function _showResult(isNewRecord) {
    _showScreen('result');

    let msg, emoji;
    if      (state.score >= 100) { msg = 'أسطورة! إنتِ ملكة القلوب! 👑';          emoji = '👑'; }
    else if (state.score >= 60)  { msg = 'خارقة جداً! قلبك من ذهب! 🏆';           emoji = '🏆'; }
    else if (state.score >= 40)  { msg = 'ممتازة! بس إنتِ أحسن من كده 🌟';        emoji = '🌟'; }
    else if (state.score >= 25)  { msg = 'كويس! محتاجة تتمرني أكتر 😊';           emoji = '💕'; }
    else if (state.score >= 10)  { msg = 'حلو! المرة الجاية أحسن 😄';             emoji = '⭐'; }
    else                          { msg = 'مش مهم، محمد بيحبك على طول 💝';        emoji = '💝'; }

    if (_dom.resScore)  _dom.resScore.textContent  = state.score;
    if (_dom.resCaught) _dom.resCaught.textContent = state.caught;
    if (_dom.resMissed) _dom.resMissed.textContent = state.missed;
    if (_dom.resCombo)  _dom.resCombo.textContent  = state.maxCombo + 'x';
    if (_dom.resMsg)    _dom.resMsg.textContent    = `${emoji} ${msg}`;
    if (_dom.resNewRec) _dom.resNewRec.classList.toggle('hidden', !isNewRecord);

    // Show earned achievements
    const achContainer = document.getElementById('res-achievements');
    if (achContainer && state.earnedAchievements.length > 0) {
      achContainer.innerHTML = state.earnedAchievements.map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? `<div class="res-ach-badge">${a.icon} ${a.title}</div>` : '';
      }).join('');
      achContainer.style.display = 'flex';
    } else if (achContainer) {
      achContainer.style.display = 'none';
    }
  }

  // ─── Persist ──────────────────────────────────────────────────────
  function _save(key, val) { try { localStorage.setItem(key, String(val)); } catch (_) {} }
  function _load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      const n = parseInt(v, 10);
      return isNaN(n) ? v : n;
    } catch (_) { return fallback; }
  }

  return { init, startGame, pauseGame, resumeGame };
})();

document.addEventListener('DOMContentLoaded', () => HeartCatcherGame.init());