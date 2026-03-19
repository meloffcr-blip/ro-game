// ─── Quiz — loads from questions.json ───
let allQuestions = [];
let questions    = [];
let current      = 0;
let score        = 0;
let answered     = false;

async function loadQuestions() {
  try {
    // resolve path relative to quiz.html location (games/)
    const res  = await fetch('../assets/js/questions.json');
    const data = await res.json();
    allQuestions = data.questions;
  } catch (e) {
    // fallback inline
    allQuestions = [
      { question: "إيه اللون المفضل لمحمد؟", options: ["الأزرق","الأسود","الأبيض","الأخضر"], correct: 1, category: "معلومات" },
      { question: "إيه أكتر حاجة بيحبها محمد؟", options: ["الضحك","الهدوء","رحمة","السفر"], correct: 2, category: "رومانسي" }
    ];
  }
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function startQuiz() {
  questions = shuffle(allQuestions).slice(0, 15); // 15 random each time
  current  = 0;
  score    = 0;
  answered = false;
  showQuestion();
  document.getElementById('start-quiz-btn').style.display = 'none';
  document.getElementById('quiz-content').classList.remove('hidden');
}

function showQuestion() {
  const q   = questions[current];
  const pct = Math.round(((current) / questions.length) * 100);
  const container = document.getElementById('quiz-content');

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.88rem;color:var(--muted);">
        <span>سؤال ${current + 1} من ${questions.length}</span>
        <span style="background:rgba(255,240,245,0.5);padding:3px 12px;border-radius:99px;border:1px solid rgba(232,85,109,0.2);font-size:.8rem;">${q.category || ''}</span>
      </div>
      <div style="height:6px;background:rgba(255,200,215,0.3);border-radius:10px;overflow:hidden;border:1px solid rgba(232,85,109,0.15);">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--rose-lt),var(--rose));border-radius:10px;transition:width .4s ease;box-shadow:0 0 8px rgba(232,85,109,0.3);"></div>
      </div>
    </div>
    <div class="question">
      <h3 style="font-size:1.3rem;margin-bottom:22px;line-height:1.6;color:var(--ink);">${q.question}</h3>
      <div class="options">
        ${q.options.map((opt, i) => `
          <button class="option-btn" onclick="selectAnswer(${i})" style="text-align:right;padding:14px 18px;border-radius:16px;width:100%;margin-bottom:8px;font-family:'Tajawal',sans-serif;font-size:1rem;">
            <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:rgba(232,85,109,0.12);border:1px solid rgba(232,85,109,0.25);text-align:center;line-height:26px;font-size:.8rem;margin-left:10px;font-weight:700;">
              ${['أ','ب','ج','د'][i]}
            </span>
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  answered = false;
}

function selectAnswer(idx) {
  if (answered) return;
  answered = true;

  const q       = questions[current];
  const buttons = document.querySelectorAll('.option-btn');

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) {
      btn.style.background = 'rgba(76,175,80,0.28)';
      btn.style.borderColor = 'rgba(76,175,80,0.5)';
      btn.style.color = '#1a4a1c';
      btn.style.boxShadow = '0 4px 16px rgba(76,175,80,0.2)';
    } else if (i === idx && idx !== q.correct) {
      btn.style.background = 'rgba(244,67,54,0.22)';
      btn.style.borderColor = 'rgba(244,67,54,0.4)';
      btn.style.color = '#5a1a1a';
    }
  });

  if (idx === q.correct) score++;

  // show feedback
  const fb = document.createElement('div');
  fb.style.cssText = `margin-top:16px;padding:14px;border-radius:14px;text-align:center;font-size:1.05rem;font-weight:700;backdrop-filter:blur(10px);border:1px solid;`;
  if (idx === q.correct) {
    fb.style.background = 'rgba(76,175,80,0.2)';
    fb.style.borderColor = 'rgba(76,175,80,0.4)';
    fb.style.color = '#1a4a1c';
    fb.innerHTML = '✅ إجابة صح! ممتاز 🌹';
  } else {
    fb.style.background = 'rgba(244,67,54,0.15)';
    fb.style.borderColor = 'rgba(244,67,54,0.35)';
    fb.style.color = '#5a1a1a';
    fb.innerHTML = `❌ الإجابة الصح: <strong>${q.options[q.correct]}</strong>`;
  }
  document.querySelector('.question').appendChild(fb);

  // next button
  const nextBtn = document.createElement('button');
  nextBtn.style.cssText = `margin-top:16px;width:100%;font-family:'Tajawal',sans-serif;`;
  nextBtn.textContent = current + 1 < questions.length ? 'السؤال التالي ←' : 'شوفي نتيجتك 🎉';
  nextBtn.onclick = nextQuestion;
  document.querySelector('.question').appendChild(nextBtn);
}

function nextQuestion() {
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const pct = Math.round((score / questions.length) * 100);
  let msg = '', emoji = '';

  if (pct === 100)      { msg = 'مثالية! إنتِ عارفاه أكتر من نفسه! 👑'; emoji = '💖'; }
  else if (pct >= 80)   { msg = 'ممتاز! قلبك مليان بيه 🥰'; emoji = '💕'; }
  else if (pct >= 60)   { msg = 'كويس! بس لازم تبصي فيه أكتر 😊'; emoji = '💗'; }
  else if (pct >= 40)   { msg = 'الحب مش محتاج معلومات 😄❤️'; emoji = '😄'; }
  else                   { msg = 'مش مهم، المهم إنه بيحبك جداً 💝'; emoji = '💝'; }

  document.getElementById('quiz-content').innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:4rem;margin-bottom:16px;">${emoji}</div>
      <h3 style="font-family:'Aref Ruqaa',serif;font-size:2rem;color:var(--rose);margin-bottom:12px;">انتهى الاختبار!</h3>
      <div style="background:rgba(255,240,245,0.5);backdrop-filter:blur(12px);border:1px solid rgba(232,85,109,0.25);border-radius:20px;padding:28px;margin:20px 0;box-shadow:inset 0 2px 0 rgba(255,255,255,0.65);">
        <div style="font-size:3.5rem;font-weight:900;color:var(--rose);text-shadow:0 2px 16px rgba(232,85,109,0.3);">${score}<span style="font-size:1.8rem;color:var(--muted);">/${questions.length}</span></div>
        <div style="font-size:1.1rem;color:var(--muted);margin-top:4px;">${pct}% صح</div>
      </div>
      <p style="font-size:1.2rem;color:#4a2830;margin-bottom:28px;font-family:'Dancing Script',cursive;font-size:1.35rem;">${msg}</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button onclick="startQuiz()" style="font-family:'Tajawal',sans-serif;">🔄 العب تاني</button>
        <a href="../index.html" style="display:inline-flex;align-items:center;background:rgba(255,240,245,0.45);backdrop-filter:blur(10px);color:var(--rose-deep);text-decoration:none;padding:14px 24px;border-radius:99px;border:1px solid rgba(232,85,109,0.25);font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,0.65);font-family:'Tajawal',sans-serif;">🏠 الرئيسية</a>
      </div>
    </div>
  `;
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  const startBtn = document.getElementById('start-quiz-btn');
  if (startBtn) {
    startBtn.textContent = `🎯 ابدأ اللعبة (${allQuestions.length} سؤال)`;
    startBtn.onclick = startQuiz;
  }
});
