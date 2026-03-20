/**
 * ════════════════════════════════════════
 *  messages.js — رسائل الحب
 * ════════════════════════════════════════
 */

const MessagesComponent = (() => {

  const MESSAGES = [
    {
      title: "رسالتي الأولى 💌",
      text: "رحمة... من يوم ما دخلتِ حياتي، الدنيا اتغيرت خالص. مش عارف أشرح الإحساس ده بالظبط، بس كل ما بشوفك بحس إن قلبي بيقول 'ده هو المكان الصح'. شكراً إنك موجودة.",
      emoji: "💌",
      color: "rgba(232,85,109,0.12)"
    },
    {
      title: "في الصبح 🌅",
      text: "كل صبح بصحى وأول ما بيجي في بالي اسمك. مش لأني بفتكرك — لأنك في قلبي على طول حتى وأنا نايم. إنتِ الإحساس الحلو اللي بيخلي اليوم يستاهل.",
      emoji: "🌅",
      color: "rgba(201,145,74,0.12)"
    },
    {
      title: "ضحكتك 😊",
      text: "في ناس لما بيضحكوا بتحس إن الدنيا كلها بتضحك معاهم. إنتِ من الناس دي. لما بتضحكي بتحسسيني إن كل حاجة تمام وهتبقى تمام. ضحكتك دي أحلى صوت سمعته في حياتي.",
      emoji: "😊",
      color: "rgba(78,205,196,0.12)"
    },
    {
      title: "لو بعيد 💭",
      text: "المسافة مش بتبعد اللي بيحبوا بعض. كل ما حسيت إنك بعيدة، بلاقيك جنبي في كل حاجة بتعملها — في الأغنية اللي بسمعها، في المنظر الحلو اللي بشوفه، في اللحظة اللي بتيجي أبتسم فيها من غير سبب.",
      emoji: "💭",
      color: "rgba(147,112,219,0.12)"
    },
    {
      title: "وعد 🤝",
      text: "بوعدك إني هكون جنبك دايماً — في اللحظات الحلوة عشان نتهنى بيها، وفي الأوقات الصعبة عشان أخففها عليكِ. ده مش كلام، ده قرار اتقرر من جوا من زمان.",
      emoji: "🤝",
      color: "rgba(76,175,80,0.12)"
    },
    {
      title: "أنتِ وبس 🌹",
      text: "في الدنيا ناس كتير، بس في ناس بيفرقوا. إنتِ من الناس اللي بيفرقوا — مش لأنك مختلفة بس، لأنك خلتيني أحس بحاجات ما حسيتهاش قبل كده. إنتِ فرقتِ في حياتي.",
      emoji: "🌹",
      color: "rgba(232,85,109,0.12)"
    },
    {
      title: "للأبد 💖",
      text: "الحب الحقيقي مش بس إحساس — ده اختيار بتختاره كل يوم. وأنا كل يوم بختار أحبك أكتر من امبارح. مش هينتهي ده، لأني مش قادر أتخيل حياتي من غيرك.",
      emoji: "💖",
      color: "rgba(255,107,107,0.12)"
    }
  ];

  let current     = 0;
  let isAnimating = false;
  let autoTimer   = null;

  function init() {
    const grid = document.getElementById('messages-grid');
    const single = document.getElementById('message-display-area');

    if (grid) _initGrid(grid);
    if (single) _initSingle(single);
  }

  // ─── Grid mode (cards) ───
  function _initGrid(grid) {
    grid.innerHTML = '';
    MESSAGES.forEach((msg, i) => {
      const card = document.createElement('div');
      card.className = 'message-card';
      card.style.cssText = `
        background: ${msg.color};
        backdrop-filter: blur(16px);
        border: 1px solid rgba(232,85,109,0.22);
        border-radius: 22px;
        padding: 26px 24px;
        margin-bottom: 16px;
        cursor: pointer;
        opacity: 0;
        transform: translateY(18px);
        transition: opacity .45s ease, transform .45s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease;
        box-shadow: inset 0 2px 0 rgba(255,255,255,0.65), 0 4px 20px rgba(232,85,109,0.08);
        position: relative;
        overflow: hidden;
      `;
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="font-size:1.8rem;filter:drop-shadow(0 2px 6px rgba(232,85,109,0.3));">${msg.emoji}</span>
          <strong style="font-family:'Aref Ruqaa',serif;font-size:1.15rem;color:var(--ink);">${msg.title}</strong>
        </div>
        <p style="font-size:1rem;line-height:1.9;color:#4a2830;direction:rtl;">${msg.text}</p>
        <div style="margin-top:14px;text-align:left;">
          <button class="like-btn" data-idx="${i}" style="
            background:rgba(255,240,245,0.55);
            border:1px solid rgba(232,85,109,0.28);
            border-radius:99px;
            padding:7px 18px;
            font-family:'Tajawal',sans-serif;
            font-size:.9rem;
            color:var(--rose-deep,#c03558);
            cursor:pointer;
            font-weight:700;
            transition: transform .2s cubic-bezier(.34,1.56,.64,1), background .2s ease;
          ">❤️ أعجبني</button>
        </div>
      `;

      // hover
      card.addEventListener('mouseenter', () => {
        card.style.transform  = 'translateY(-6px) scale(1.01)';
        card.style.boxShadow  = 'inset 0 2px 0 rgba(255,255,255,0.72), 0 16px 44px rgba(232,85,109,0.18)';
        card.style.borderColor = 'rgba(232,85,109,0.38)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = 'translateY(0) scale(1)';
        card.style.boxShadow  = 'inset 0 2px 0 rgba(255,255,255,0.65), 0 4px 20px rgba(232,85,109,0.08)';
        card.style.borderColor = 'rgba(232,85,109,0.22)';
      });

      // like button
      card.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.textContent = '💖 شكراً!';
        btn.style.transform = 'scale(1.12)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
        if (window.FloatingHearts) FloatingHearts.fromElement(btn, { count: 10 });
        if (window.Toast) Toast.love('يسعد قلبك يا رحمة! 💌');
      });

      grid.appendChild(card);

      // entrance animation
      setTimeout(() => {
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      }, 120 + i * 90);
    });
  }

  // ─── Single reveal mode (original messages.html style) ───
  function _initSingle(area) {
    const btns = document.querySelectorAll('.message-btn');
    if (!btns.length) return;

    btns.forEach((btn, i) => {
      const msg = MESSAGES[i % MESSAGES.length];
      btn.addEventListener('click', () => _reveal(area, msg, btn));
    });
  }

  function _reveal(area, msg, btn) {
    if (isAnimating) return;
    isAnimating = true;

    area.style.opacity   = '0';
    area.style.transform = 'translateY(10px)';
    area.style.transition = 'opacity .25s ease, transform .25s ease';

    setTimeout(() => {
      area.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;font-size:2.2rem;filter:drop-shadow(0 3px 10px rgba(232,85,109,0.38));">${msg.emoji}</div>
        <p style="font-size:1.1rem;line-height:2;color:#4a2830;direction:rtl;">${msg.text}</p>
        <div style="margin-top:20px;text-align:center;">
          <button id="like-reveal-btn" style="
            background:linear-gradient(135deg,rgba(232,85,109,0.85),rgba(200,53,85,0.9));
            color:white;border:1px solid rgba(255,150,170,0.4);
            padding:11px 28px;border-radius:99px;font-family:'Tajawal',sans-serif;font-weight:700;
            box-shadow:inset 0 1px 0 rgba(255,255,255,0.28),0 6px 22px rgba(232,85,109,0.38);
            cursor:pointer;font-size:1rem;
          ">💖 بحبك يا محمد</button>
        </div>
      `;
      area.style.opacity   = '1';
      area.style.transform = 'translateY(0)';
      isAnimating = false;

      document.getElementById('like-reveal-btn')?.addEventListener('click', () => {
        if (window.FloatingHearts) FloatingHearts.confetti(25);
        if (window.Toast) Toast.love('وأنا بحبك أكتر يا رحومتي! 💕');
      });
    }, 260);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => MessagesComponent.init());