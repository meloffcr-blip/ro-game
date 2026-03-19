// صفحة الرسائل - messages.js
document.addEventListener('DOMContentLoaded', function() {
    const complimentBtn = document.getElementById('compliment-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const activityResult = document.getElementById('activity-result');
    const secretMessage = document.getElementById('secret-message');

    const compliments = [
        "رحمتي، أنتِ أجمل من القمر والنجوم مجتمعين ✨",
        "ضحكتك بتنور يومي كله يا حبيبتي 😊",
        "أنتِ السبب في كل فرحة في حياتي ❤️",
        "عيونك فيها كل الدنيا الحلوة 👀",
        "صوتك أحلى موسيقى في الكون 🎵"
    ];

    if (complimentBtn) {
        complimentBtn.addEventListener('click', function() {
            const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
            activityResult.innerHTML = `<p>${randomCompliment}</p>`;
            activityResult.classList.remove('hidden');
            secretMessage.classList.add('hidden');
        });
    }

    if (revealBtn) {
        revealBtn.addEventListener('click', function() {
            secretMessage.classList.remove('hidden');
            activityResult.classList.add('hidden');
        });
    }
});