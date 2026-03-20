/**
 * ════════════════════════════════════════
 *  Messages Component
 * ════════════════════════════════════════
 */

const MessagesComponent = (() => {

  const compliments = [
    "رحمتي، أنتِ أجمل من القمر والنجوم مجتمعين ✨",
    "ضحكتك بتنور يومي كله يا حبيبتي 😊",
    "أنتِ السبب في كل فرحة في حياتي ❤️",
    "عيونك فيها كل الدنيا الحلوة 👀",
    "صوتك أحلى موسيقى في الكون 🎵",
    "وجودك في حياتي هو أحلى هدية من ربنا 🌹",
    "كل يوم بيصحصح وانتِ في بالي يبقى يوم مميز 💫",
    "أنتِ مش بس حبيبتي، أنتِ أحسن صاحبة عندي 🤍",
  ];

  let lastIndex = -1;

  function _getRandomCompliment() {
    let idx;
    do { idx = Math.floor(Math.random() * compliments.length); }
    while (idx === lastIndex && compliments.length > 1);
    lastIndex = idx;
    return compliments[idx];
  }

  function init() {
    const complimentBtn = document.getElementById('compliment-btn');
    const revealBtn     = document.getElementById('reveal-btn');
    const resultDiv     = document.getElementById('activity-result');
    const secretDiv     = document.getElementById('secret-message');

    if (!complimentBtn) return;

    complimentBtn.addEventListener('click', () => {
      const msg = _getRandomCompliment();
      resultDiv.innerHTML = `<p>${msg}</p>`;
      resultDiv.classList.remove('hidden');
      secretDiv.classList.add('hidden');
      FloatingHearts.burst({ count: 8 });
    });

    revealBtn?.addEventListener('click', () => {
      secretDiv.classList.remove('hidden');
      resultDiv.classList.add('hidden');
      FloatingHearts.burst({ count: 15 });
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => MessagesComponent.init());
