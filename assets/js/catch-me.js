// لعبة أمسكني - catch-me.js
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-catch-game-btn');
    const gameDiv = document.getElementById('catch-me-game');
    const target = document.getElementById('mohamed-target');
    const scoreSpan = document.getElementById('game-score');
    const timerSpan = document.getElementById('game-timer');

    let score = 0;
    let timeLeft = 15;
    let gameInterval;
    let moveInterval;

    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    function startGame() {
        startBtn.style.display = 'none';
        gameDiv.classList.remove('hidden');
        
        gameInterval = setInterval(updateTimer, 1000);
        moveInterval = setInterval(moveTarget, 1000);
        
        if (target) {
            target.addEventListener('click', catchTarget);
        }
    }

    function moveTarget() {
        const gameArea = document.getElementById('game-area');
        const maxX = gameArea.offsetWidth - target.offsetWidth;
        const maxY = gameArea.offsetHeight - target.offsetHeight;
        
        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;
        
        target.style.left = newX + 'px';
        target.style.top = newY + 'px';
    }

    function catchTarget() {
        score++;
        scoreSpan.textContent = score;
        
        // تأثير عند الإمساك
        target.style.transform = 'scale(1.2)';
        setTimeout(() => {
            target.style.transform = 'scale(1)';
        }, 200);
    }

    function updateTimer() {
        timeLeft--;
        timerSpan.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        clearInterval(gameInterval);
        clearInterval(moveInterval);
        
        let message = "";
        if (score >= 10) {
            message = "ممتاز! إنتِ سريعة جداً! 🏆";
        } else if (score >= 5) {
            message = "كويس! محتاجة تمرين أكتر 😊";
        } else {
            message = "حاولي تاني! 😅";
        }
        
        gameDiv.innerHTML = `
            <div class="game-result">
                <h3>انتهت اللعبة!</h3>
                <p>النقاط: ${score}</p>
                <p>${message}</p>
                <button onclick="location.reload()" class="game-btn">العب تاني</button>
            </div>
        `;
    }
});