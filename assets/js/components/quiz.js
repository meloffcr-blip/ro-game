/**
 * ════════════════════════════════════════
 *  Quiz Component
 *  كويز بالأسئلة مع تيليجرام + تقدم + CloudStorage
 * ════════════════════════════════════════
 */

const QuizComponent = (() => {

  const CONFIG = window.APP_CONFIG?.quiz ?? { questionsCount: 15 };

  let allQuestions = [];
  let questions    = [];
  let current      = 0;
  let score        = 0;
  let answered     = false;

  // ─── Load Questions ───
  async function _loadQuestions() {
    try {
      const res  = await fetch('../assets/js/questions.json');
      const data = await res.json();
      allQuestions = data.questions ?? [];
    } catch {
      allQuestions = _fallbackQuestions();
    }
  }

  function _fallbackQuestions() {
    return [
      { question: "إيه اللون المفضل لمحمد؟",       options: ["الأزرق","الأسود","الأبيض","الأخضر"], correct: 1, category: "معلومات" },
      { question: "إيه أكتر حاجة بيحبها محمد؟",    options: ["الضحك","الهدوء","رحمة","السفر"],       correct: 2, category: "رومانسي" },
      { question: "إمتى بيحس محمد بأكبر سعادة؟",   options: ["في الشغل","مع رحمة","في الإجازة","النوم"], correct: 1, category: "رومانسي" },
    ];
  }

  function _shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  // ─── Init ───
  async function init() {
    const startBtn = document.getElementById('start-quiz-btn');
    if (!startBtn) return;

    await _loadQuestions();

    startBtn.addEventListener('click', _start);

    // تحميل آخر نتيجة
    _loadBestScore().then(best => {
      const bestEl = document.getElementById('quiz-best-score');
      if (bestEl && best > 0) {
        bestEl.textContent = `أحسن نتيجة سابقة: ${best}/${CONFIG.questionsCount} 🏆`;
        bestEl.style.display = 'block';
      }
    });

    if (window.Telegram_App?.isInTelegram()) {
      window.Telegram_App.showMainButton('ابدئي الاختبار 📝', _start);
    }
  }

  function _start() {
    questions = _shuffle(allQuestions).slice(0, CONFIG.questionsCount);
    current   = 0;
    score     = 0;
    answered  = false;

    document.getElementById('start-quiz-btn').style.display = 'none';
    document.getElementById('quiz-content').classList.remove('hidden');

    window.Telegram_App?.Haptic?.light?.();
    window.Telegram_App?.showMainButton('إنهاء الاختبار ⏹', _showFinalResult);

    _showQuestion();
  }

  function _showQuestion() {
    const q   = questions[current];
    const pct = Math.round((current / questions.length) * 100);
    const container = document.getElementById('quiz-content');

    answered = false;

    container.innerHTML = `
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.88rem;color:var(--muted);">
          <span>سؤال ${current + 1} من ${questions.length}</span>
          <span style="background:rgba(255,240,245,.5);padding:3px 12px;border-radius:99px;border:1px solid rgba(232,85,109,.2);font-size:.8rem;">
            ${q.category ?? ''}
          </span>
        </div>
        <div style="height:6px;background:rgba(255,200,215,.3);border-radius:10px;overflow:hidden;border:1px solid rgba(232,85,109,.15);">
          <div id="quiz-progress-bar" style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--rose-lt,#f7a3b0),var(--rose,#e8556d));border-radius:10px;transition:width .4s ease;"></div>
        </div>
      </div>

      <div style="font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:20px;line-height:1.6;">
        ${q.question}
      </div>

      <div id="options-grid" style="display:grid;gap:12px;">
        ${q.options.map((opt, i) => `
          <button
            data-idx="${i}"
            class="quiz-option"
            style="
              width:100%;text-align:right;padding:14px 18px;
              border:2px solid rgba(232,85,109,.2);border-radius:14px;
              background:rgba(255,240,245,.5);color:var(--ink);
              font-family:inherit;font-size:1rem;cursor:pointer;
              transition:all .2s ease;
            "
            onmouseover="this.style.borderColor='var(--rose,#e8556d)';this.style.background='rgba(232,85,109,.08)'"
            onmouseout="if(!this.dataset.answered){this.style.borderColor='rgba(232,85,109,.2)';this.style.background='rgba(255,240,245,.5)'}"
          >
            ${['أ','ب','ج','د'][i]} - ${opt}
          </button>
        `).join('')}
      </div>
    `;

    // ربط الأزرار
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => _answer(parseInt(btn.dataset.idx)));
    });
  }

  function _answer(idx) {
    if (answered) return;
    answered = true;

    const q = questions[current];
    const btns = document.querySelectorAll('.quiz-option');
    const isCorrect = idx === q.correct;

    if (isCorrect) {
      score++;
      window.Telegram_App?.Haptic?.success?.();
      FloatingHearts.burst({ count: 6, emojis: ['⭐','✅','💖'] });
    } else {
      window.Telegram_App?.Haptic?.error?.();
    }

    // تلوين الإجابات
    btns.forEach((btn, i) => {
      btn.dataset.answered = 'true';
      btn.style.cursor = 'default';
      if (i === q.correct) {
        btn.style.background     = 'rgba(76,175,80,.15)';
        btn.style.borderColor    = '#4caf50';
        btn.style.color          = '#2e7d32';
        btn.style.fontWeight     = '700';
      } else if (i === idx && !isCorrect) {
        btn.style.background  = 'rgba(232,85,109,.12)';
        btn.style.borderColor = 'var(--rose,#e8556d)';
        btn.style.color       = 'var(--rose,#e8556d)';
      }
    });

    // زرار التالي
    const nextLabel = current + 1 < questions.length ? 'السؤال التالي ←' : 'النتيجة النهائية 🏆';
    const nextBtn = document.createElement('button');
    nextBtn.textContent = nextLabel;
    nextBtn.className   = 'game-btn';
    Object.assign(nextBtn.style, {
      marginTop: '18px',
      width: '100%',
      background: 'var(--rose,#e8556d)',
      color: '#fff',
      border: 'none',
      padding: '14px',
      borderRadius: '14px',
      fontSize: '1rem',
      fontFamily: 'inherit',
      cursor: 'pointer',
    });

    nextBtn.addEventListener('click', () => {
      current++;
      if (current < questions.length) _showQuestion();
      else _showFinalResult();
    });

    document.getElementById('options-grid').after(nextBtn);
  }

  function _showFinalResult() {
    const pct = Math.round((score / questions.length) * 100);
    let emoji, msg;

    if (pct >= 80)      { emoji = '🏆'; msg = 'ممتازة! عارفاني كويس جداً 😍'; }
    else if (pct >= 60) { emoji = '⭐'; msg = 'كويس! بس لازم تتعلمي أكتر 😊'; }
    else if (pct >= 40) { emoji = '💪'; msg = 'محتاجة مراجعة معايا 🥺'; }
    else                { emoji = '💌'; msg = 'مش مهم، أنا بحبك على طول! 😂'; }

    document.getElementById('quiz-content').innerHTML = `
      <div style="text-align:center;padding:24px;">
        <div style="font-size:4rem;margin-bottom:12px;">${emoji}</div>
        <h3 style="color:var(--rose,#e8556d);font-size:1.4rem;margin-bottom:8px;">النتيجة النهائية</h3>
        <div style="font-size:2rem;font-weight:900;margin-bottom:6px;">${score} / ${questions.length}</div>
        <div style="font-size:1.1rem;color:var(--muted);margin-bottom:6px;">${pct}%</div>
        <p style="margin-bottom:20px;">${msg}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button onclick="location.reload()" class="game-btn">حاولي تاني 🔄</button>
          <button id="quiz-share-btn" class="game-btn" style="background:var(--rose,#e8556d);color:#fff;">
            شاركي النتيجة 📤
          </button>
        </div>
      </div>
    `;

    document.getElementById('quiz-share-btn')?.addEventListener('click', () => {
      window.Telegram_App?.shareScore({
        gameName: 'كويز محمد 💝',
        score,
        maxScore: questions.length,
      });
      window.Telegram_App?.notifyBot('quiz_completed', { score, total: questions.length, pct });
    });

    _saveBestScore(score);
    window.Telegram_App?.Haptic?.success?.();
    window.Telegram_App?.hideMainButton?.();
    FloatingHearts.confetti();
  }

  async function _loadBestScore() {
    try {
      const val = await window.Telegram_App?.CloudStorage?.get('quiz_best');
      return parseInt(val, 10) || 0;
    } catch {
      return parseInt(localStorage.getItem('quiz_best') ?? '0', 10);
    }
  }

  function _saveBestScore(s) {
    _loadBestScore().then(prev => {
      if (s > prev) {
        window.Telegram_App?.CloudStorage?.set('quiz_best', String(s)).catch(() => {});
        localStorage.setItem('quiz_best', String(s));
      }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => QuizComponent.init());
