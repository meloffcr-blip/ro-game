const $ = id => document.getElementById(id);
const isMobile = ('ontouchstart' in window) || window.matchMedia('(hover:none)').matches;

/* ── CURSOR ── */
let cx = -100, cy = -100, tx = -100, ty = -100;
const dot = document.getElementById('cur-dot'), ring = document.getElementById('cur-ring');

if (!isMobile) {
    document.addEventListener('mousemove', e => {
        cx = e.clientX; cy = e.clientY;
        dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
    });
    (function loop() {
        tx += (cx - tx) * .13; ty += (cy - ty) * .13;
        ring.style.left = tx + 'px'; ring.style.top = ty + 'px';
        requestAnimationFrame(loop);
    })();

    setInterval(() => {
        if (!gs.gameActive) return;
        let near = false;
        document.querySelectorAll('.fheart').forEach(h => {
            const r = h.getBoundingClientRect();
            const dist = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
            h.classList.toggle('near', dist < 90);
            if (dist < 90) near = true;
        });
        dot.classList.toggle('attract', near);
        ring.classList.toggle('attract', near);
    }, 40);
}

/* ── STATE ── */
let gs = {};
let timerId, heartId, powerUpId;

/* ── STORAGE ── */
function loadData() {
    const d = JSON.parse(localStorage.getItem('hcg2') || '{}');
    $('best-score').textContent = d.best || 0;
    $('best-level').textContent = d.lvl || 1;
    $('total-games').textContent = d.total || 0;
    if (d.ts) {
        const diff = Math.floor((Date.now() - d.ts) / 86400000);
        $('last-played').textContent = diff === 0 ? 'اليوم' : diff === 1 ? 'أمس' : diff + ' أيام';
    }
}
function saveData() {
    const d = JSON.parse(localStorage.getItem('hcg2') || '{}');
    d.best = Math.max(d.best || 0, gs.score);
    d.lvl = Math.max(d.lvl || 1, gs.level);
    d.total = (d.total || 0) + 1; d.ts = Date.now();
    localStorage.setItem('hcg2', JSON.stringify(d));
}

/* ── START ── */
function hInterval() { return Math.max(520, 1060 - gs.level * 58); }
function startGame() {
    $('menu').style.display = 'none';
    $('game-screen').style.display = 'block';
    const rb = $('result-box'); if (rb) rb.remove();
    $('timer-ring').classList.remove('urgent');
    gs = { score: 0, timeLeft: 30, level: 1, combo: 0, maxCombo: 0, gameActive: true, isPaused: false };
    updateHUD(); updateProg();
    timerId = setInterval(tick, 1000);
    heartId = setInterval(spawnHeart, hInterval());
    powerUpId = setInterval(spawnPowerUp, 9000);
}

/* ── HEARTS ── */
function spawnHeart() {
    if (!gs.gameActive || gs.isPaused) return;
    const special = Math.random() < 0.25;
    const h = document.createElement('div');
    h.className = 'fheart' + (special ? ' special' : '');
    h.textContent = special ? '💖' : '❤️';
    h.dataset.val = special ? 3 : 1;
    h.style.left = Math.random() * (window.innerWidth - 55) + 'px';
    h.addEventListener('touchstart', e => { e.preventDefault(); collectHeart(h); }, { passive: false });
    h.addEventListener('click', () => collectHeart(h));
    $('arena').appendChild(h); fall(h);
}

const PUPS = ['⭐', '🌟', '✨', '🔥', '⚡'];
function spawnPowerUp() {
    if (!gs.gameActive || gs.isPaused || Math.random() > .58) return;
    const type = PUPS[Math.floor(Math.random() * PUPS.length)];
    const p = document.createElement('div');
    p.className = 'fheart powerup'; p.textContent = type;
    p.style.left = Math.random() * (window.innerWidth - 55) + 'px';
    p.style.fontSize = '2.6rem';
    p.addEventListener('touchstart', e => { e.preventDefault(); collectPowerUp(p, type); }, { passive: false });
    p.addEventListener('click', () => collectPowerUp(p, type));
    $('arena').appendChild(p); fall(p);
}

/* ── FALL ── */
function fall(el) {
    let pos = -70;
    const spd = 1.8 + gs.level * .28;
    const startX = parseFloat(el.style.left);
    const phase = Math.random() * Math.PI * 2;
    const amp = isMobile ? 8 : 12;

    function step() {
        if (!el.parentNode) return;
        if (gs.isPaused) { requestAnimationFrame(step); return; }
        pos += spd;
        el.style.top = pos + 'px';
        el.style.left = (startX + Math.sin(pos * .018 + phase) * amp) + 'px';
        if (pos > window.innerHeight + 20) {
            el.remove();
            if (el.dataset.val) { gs.combo = 0; updateHUD(); }
            return;
        }
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ── COLLECT ── */
function collectHeart(h) {
    if (!h.parentNode || !gs.gameActive) return;
    const val = parseInt(h.dataset.val);
    const multi = gs.combo >= 5 ? 2 : 1;
    const pts = val * multi;
    gs.score += pts; gs.combo++;
    if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;

    const r = h.getBoundingClientRect();
    const px = r.left + r.width / 2, py = r.top + r.height / 2;
    h.classList.add('popped');
    setTimeout(() => h.remove(), 80);

    spawnScorePop(px, py, '+' + pts, val > 1 ? '#e8556d' : '#c03558');
    spawnParticles(px, py);
    if (gs.combo % 5 === 0 && gs.combo > 0) spawnComboBurst(px, py);

    updateHUD();
    if (gs.score >= gs.level * 30) levelUp();
    updateProg();
}

function collectPowerUp(p, type) {
    if (!p.parentNode) return; p.remove();
    let msg = '';
    switch (type) {
        case '⭐': case '🌟': gs.timeLeft += 5; msg = '+5 ثواني! ⭐'; break;
        case '✨': gs.timeLeft += 8; msg = '+8 ثواني! ✨'; break;
        case '🔥': gs.combo += 3; msg = 'كومبو مجاني! 🔥'; break;
        case '⚡': gs.score += 10; msg = '+10 نقاط! ⚡'; break;
    }
    showMsg(msg); updateHUD();
}

/* ── TICK ── */
function tick() {
    gs.timeLeft--; updateHUD();
    if (gs.timeLeft <= 5) $('timer-ring').classList.add('urgent');
    if (gs.timeLeft <= 0) endGame();
}

function levelUp() {
    gs.level++; updateHUD(); showMsg('المستوى ' + gs.level + '! 🎉');
    clearInterval(heartId); heartId = setInterval(spawnHeart, hInterval());
}

/* ── HUD ── */
function updateHUD() {
    $('score').textContent = gs.score; $('timer').textContent = gs.timeLeft;
    $('level').textContent = gs.level; $('combo').textContent = gs.combo;
    $('combo-pill').classList.toggle('hot', gs.combo >= 5);
}
function updateProg() {
    $('prog-fill').style.width = ((gs.score % (gs.level * 30)) / (gs.level * 30) * 100) + '%';
}

/* ── PAUSE ── */
function pauseGame() {
    if (!gs.gameActive || gs.isPaused) return;
    gs.isPaused = true; clearAllIntervals();
    $('p-score').textContent = gs.score;
    $('p-level').textContent = gs.level;
    $('p-combo').textContent = gs.combo;
    $('pause-overlay').style.display = 'flex';
}
function resumeGame() {
    gs.isPaused = false; $('pause-overlay').style.display = 'none';
    timerId = setInterval(tick, 1000);
    heartId = setInterval(spawnHeart, hInterval());
    powerUpId = setInterval(spawnPowerUp, 9000);
}
function restartGame() {
    $('pause-overlay').style.display = 'none';
    clearAllIntervals(); clearArena();
    const rb = $('result-box'); if (rb) rb.remove();
    $('timer-ring').classList.remove('urgent');
    startGame();
}
function quitGame() { $('pause-overlay').style.display = 'none'; endGame(); }
function clearAllIntervals() { clearInterval(timerId); clearInterval(heartId); clearInterval(powerUpId); }
function clearArena() { document.querySelectorAll('.fheart').forEach(h => h.remove()); }

/* ── END ── */
function endGame() {
    gs.gameActive = false; clearAllIntervals(); clearArena(); saveData();
    $('timer-ring').classList.remove('urgent');
    const s = gs.score;
    let msg = '', emoji = '';
    if (s >= 300)      { msg = 'أسطورة! إنتِ ملكة القلوب! 👑'; emoji = '👑'; }
    else if (s >= 200) { msg = 'ممتاز! صائدة قلوب محترفة! 🏆'; emoji = '🏆'; }
    else if (s >= 120) { msg = 'رائع! صائدة قلوب ماهرة! 💖'; emoji = '💖'; }
    else if (s >= 60)  { msg = 'جيد جداً! 💕'; emoji = '💕'; }
    else               { msg = 'حاولي تاني! بحبك محمد 💝'; emoji = '💝'; }

    const box = document.createElement('div');
    box.id = 'result-box';
    box.innerHTML = `
    <div style="font-size:3.5rem;margin-bottom:12px">${emoji}</div>
    <h2>انتهت اللعبة!</h2>
    <div class="result-stats">
      <p>🏆 النقاط: <strong>${gs.score}</strong></p>
      <p>🎯 المستوى: <strong>${gs.level}</strong></p>
      <p>🔥 أعلى كومبو: <strong>${gs.maxCombo}</strong></p>
    </div>
    <p class="result-msg">${msg}</p>
    <div class="result-btns">
      <button class="pbtn" onclick="restartGame()">🔄 العب تاني</button>
      <button class="pbtn" onclick="shareScore()">📱 شارك</button>
      <a href="../index.html" class="pbtn ghost" style="text-decoration:none;display:inline-flex;align-items:center;">🏠 الرئيسية</a>
    </div>
  `;
    $('game-screen').appendChild(box);
}

function shareScore() {
    const t = `💖 حققت ${gs.score} نقطة في صائد القلوب!\n🎯 المستوى ${gs.level} · 🔥 كومبو ${gs.maxCombo}\n\n💕 لعبة مخصصة لرحمة من محمد`;
    navigator.share ? navigator.share({ title: '💖 صائد القلوب', text: t })
        : navigator.clipboard?.writeText(t).then(() => showMsg('تم النسخ! 📋'));
}

/* ── VISUAL FX ── */
function spawnScorePop(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'score-pop';
    el.textContent = text;
    el.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:1.9rem;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
}
function spawnComboBurst(x, y) {
    const el = document.createElement('div');
    el.className = 'combo-burst';
    el.textContent = '🔥 COMBO ×' + Math.floor(gs.combo / 5);
    el.style.cssText = `left:${x}px;top:${y}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
}
function spawnParticles(x, y) {
    const cols = ['#e8556d', '#f7a3b0', '#c03558', '#ffd6e0', '#fff0f5'];
    for (let i = 0; i < 9; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const a = (i / 9) * Math.PI * 2, d = 30 + Math.random() * 45;
        p.style.cssText = `left:${x}px;top:${y}px;width:${4 + Math.random() * 5}px;height:${4 + Math.random() * 5}px;background:${cols[Math.floor(Math.random() * cols.length)]};--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;--d:${.4 + Math.random() * .4}s;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 900);
    }
}
function showMsg(text) {
    const el = document.createElement('div');
    el.className = 'power-msg'; el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    $('start-btn').onclick = startGame;
    $('pause-btn').onclick = pauseGame;
    $('resume-btn').onclick = resumeGame;
    $('restart-btn').onclick = restartGame;
    $('quit-btn').onclick = quitGame;
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
});
