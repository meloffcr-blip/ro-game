// لعبة صائد القلوب المحسنة مع حفظ البيانات - heart-catcher.js
document.addEventListener('DOMContentLoaded', function() {
    // عناصر الواجهة
    const startBtn = document.getElementById('start-catcher-btn');
    const gameMenu = document.getElementById('game-menu');
    const gameDiv = document.getElementById('heart-catcher-game');
    const catcherArea = document.getElementById('catcher-area');
    const pauseMenu = document.getElementById('pause-menu');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const quitBtn = document.getElementById('quit-btn');
    
    // عناصر العرض
    const scoreSpan = document.getElementById('catcher-score');
    const timerSpan = document.getElementById('catcher-timer');
    const levelSpan = document.getElementById('level-display');
    const comboSpan = document.getElementById('combo-display');
    const progressBar = document.getElementById('level-progress');
    
    // متغيرات اللعبة
    let gameState = {
        score: 0,
        timeLeft: 30,
        level: 1,
        combo: 0,
        maxCombo: 0,
        heartSpeed: 2,
        heartFrequency: 1000,
        gameActive: false,
        isPaused: false
    };
    
    let gameInterval, heartInterval, powerUpInterval;
    let heartPool = [];
    let specialHearts = ['💖', '💕', '💗', '💓', '💝'];
    let powerUps = ['⭐', '🌟', '✨', '🔥', '⚡'];
    let achievements = [];
    
    // تحميل البيانات المحفوظة
    loadGameData();
    
    // ربط الأحداث
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (quitBtn) quitBtn.addEventListener('click', quitGame);
    
    // تحميل البيانات من localStorage
    function loadGameData() {
        const savedData = localStorage.getItem('heartCatcherData');
        if (savedData) {
            const data = JSON.parse(savedData);
            document.getElementById('best-score').textContent = data.bestScore || 0;
            document.getElementById('best-level').textContent = data.bestLevel || 1;
            document.getElementById('total-games').textContent = data.totalGames || 0;
            achievements = data.achievements || [];
        }
    }
    
    // حفظ البيانات في localStorage
    function saveGameData() {
        const currentData = JSON.parse(localStorage.getItem('heartCatcherData') || '{}');
        const newData = {
            bestScore: Math.max(currentData.bestScore || 0, gameState.score),
            bestLevel: Math.max(currentData.bestLevel || 1, gameState.level),
            totalGames: (currentData.totalGames || 0) + 1,
            achievements: achievements,
            lastPlayed: new Date().toISOString()
        };
        localStorage.setItem('heartCatcherData', JSON.stringify(newData));
    }
    
    function startGame() {
        gameMenu.style.display = 'none';
        gameDiv.classList.remove('hidden');
        resetGameState();
        gameState.gameActive = true;
        
        gameInterval = setInterval(updateTimer, 1000);
        heartInterval = setInterval(createHeart, gameState.heartFrequency);
        powerUpInterval = setInterval(createPowerUp, 8000);
        
        playSound('start');
    }
    
    function resetGameState() {
        gameState = {
            score: 0,
            timeLeft: 30,
            level: 1,
            combo: 0,
            maxCombo: 0,
            heartSpeed: 2,
            heartFrequency: 1000,
            gameActive: true,
            isPaused: false
        };
        updateDisplay();
        updateProgressBar();
    }
    
    function pauseGame() {
        if (!gameState.gameActive || gameState.isPaused) return;
        
        gameState.isPaused = true;
        clearInterval(gameInterval);
        clearInterval(heartInterval);
        clearInterval(powerUpInterval);
        
        // تحديث إحصائيات الإيقاف
        document.getElementById('pause-score').textContent = gameState.score;
        document.getElementById('pause-level').textContent = gameState.level;
        document.getElementById('pause-combo').textContent = gameState.combo;
        
        pauseMenu.classList.remove('hidden');
    }
    
    function resumeGame() {
        if (!gameState.isPaused) return;
        
        gameState.isPaused = false;
        pauseMenu.classList.add('hidden');
        
        gameInterval = setInterval(updateTimer, 1000);
        heartInterval = setInterval(createHeart, gameState.heartFrequency);
        powerUpInterval = setInterval(createPowerUp, 8000);
    }
    
    function restartGame() {
        pauseMenu.classList.add('hidden');
        clearAllIntervals();
        clearHearts();
        startGame();
    }
    
    function quitGame() {
        pauseMenu.classList.add('hidden');
        endGame();
    }
    
    function createHeart() {
        if (!gameState.gameActive || gameState.isPaused) return;
        
        const heart = getHeartFromPool();
        const isSpecial = Math.random() < 0.2 + (gameState.level * 0.05);
        const heartType = isSpecial ? specialHearts[Math.floor(Math.random() * specialHearts.length)] : '❤️';
        
        heart.innerHTML = heartType;
        heart.className = 'falling-heart';
        heart.style.left = Math.random() * (window.innerWidth - 60) + 'px';
        heart.style.top = '-60px';
        heart.style.fontSize = (Math.random() * 15 + 30) + 'px';
        heart.style.transform = 'scale(1)';
        heart.style.opacity = '1';
        
        const heartValue = isSpecial ? 3 : 1;
        heart.dataset.value = heartValue;
        
        if (isSpecial) {
            heart.style.animation = 'sparkle 0.8s infinite alternate';
        } else {
            heart.style.animation = 'none';
        }
        
        heart.onclick = function() {
            catchHeart(heart, heartValue);
        };
        
        catcherArea.appendChild(heart);
        animateHeart(heart);
    }
    
    function createPowerUp() {
        if (!gameState.gameActive || gameState.isPaused || Math.random() > 0.6) return;
        
        const powerUp = document.createElement('div');
        const powerType = powerUps[Math.floor(Math.random() * powerUps.length)];
        
        powerUp.innerHTML = powerType;
        powerUp.className = 'falling-heart power-up';
        powerUp.style.left = Math.random() * (window.innerWidth - 60) + 'px';
        powerUp.style.top = '-60px';
        powerUp.style.fontSize = '45px';
        
        powerUp.onclick = function() {
            activatePowerUp(powerType);
            powerUp.remove();
            playSound('powerup');
        };
        
        catcherArea.appendChild(powerUp);
        animateHeart(powerUp);
    }
    
    function activatePowerUp(type) {
        let message = '';
        switch(type) {
            case '⭐':
            case '🌟':
                gameState.heartSpeed = Math.max(1, gameState.heartSpeed - 1);
                message = 'إبطاء الوقت! ⏰';
                setTimeout(() => {
                    gameState.heartSpeed = 2 + (gameState.level - 1) * 0.3;
                }, 5000);
                break;
            case '✨':
                gameState.timeLeft += 8;
                message = 'وقت إضافي! ⏱️';
                break;
            case '🔥':
                gameState.combo += 3;
                message = 'كومبو مجاني! 🔥';
                break;
            case '⚡':
                gameState.score += 10;
                message = 'نقاط مجانية! ⚡';
                break;
        }
        showPowerUpMessage(message);
        updateDisplay();
    }
    
    function showPowerUpMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 20px 40px;
            border-radius: 30px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 2000;
            animation: fadeInOut 2.5s forwards;
            pointer-events: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2500);
    }
    
    function getHeartFromPool() {
        if (heartPool.length > 0) {
            return heartPool.pop();
        }
        return document.createElement('div');
    }
    
    function returnHeartToPool(heart) {
        if (heartPool.length < 15) {
            heart.onclick = null;
            heartPool.push(heart);
        }
    }
    
    function animateHeart(heart) {
        let position = -60;
        const speed = gameState.heartSpeed + Math.random();
        
        const animate = () => {
            if (!gameState.gameActive || gameState.isPaused || !heart.parentNode) return;
            
            position += speed;
            heart.style.top = position + 'px';
            
            if (position > window.innerHeight) {
                heart.remove();
                returnHeartToPool(heart);
                if (heart.dataset.value) {
                    gameState.combo = 0;
                    updateDisplay();
                }
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    function catchHeart(heart, value) {
        const multiplier = gameState.combo >= 5 ? 2 : 1;
        const points = value * multiplier;
        gameState.score += points;
        gameState.combo++;
        
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
        
        updateDisplay();
        createCatchEffect(heart, points);
        heart.remove();
        returnHeartToPool(heart);
        
        playSound('catch');
        
        // فحص رفع المستوى
        if (gameState.score >= gameState.level * 35) {
            levelUp();
        }
        
        updateProgressBar();
    }
    
    function createCatchEffect(heart, points) {
        const effect = document.createElement('div');
        effect.innerHTML = '+' + points;
        effect.style.cssText = `
            position: fixed;
            left: ${heart.offsetLeft + 20}px;
            top: ${heart.offsetTop + 20}px;
            color: #ffd700;
            font-size: 2rem;
            font-weight: bold;
            pointer-events: none;
            animation: scorePopup 1.2s forwards;
            z-index: 1500;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1200);
    }
    
    function levelUp() {
        gameState.level++;
        gameState.heartSpeed += 0.2;
        gameState.heartFrequency = Math.max(600, gameState.heartFrequency - 60);
        
        updateDisplay();
        showPowerUpMessage(`المستوى ${gameState.level}! 🎉`);
        
        clearInterval(heartInterval);
        heartInterval = setInterval(createHeart, gameState.heartFrequency);
        
        playSound('levelup');
    }
    
    function updateDisplay() {
        if (scoreSpan) scoreSpan.textContent = gameState.score;
        if (levelSpan) levelSpan.textContent = gameState.level;
        if (comboSpan) comboSpan.textContent = gameState.combo;
        if (timerSpan) timerSpan.textContent = gameState.timeLeft;
    }
    
    function updateProgressBar() {
        const progress = (gameState.score % (gameState.level * 35)) / (gameState.level * 35) * 100;
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }
    
    function updateTimer() {
        gameState.timeLeft--;
        updateDisplay();
        
        // تأثير تحذيري عند انتهاء الوقت
        if (gameState.timeLeft <= 5) {
            document.querySelector('.timer-circle').style.animation = 'heartBeat 0.5s infinite';
        }
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }
    
    function clearAllIntervals() {
        clearInterval(gameInterval);
        clearInterval(heartInterval);
        clearInterval(powerUpInterval);
    }
    
    function clearHearts() {
        const hearts = catcherArea.querySelectorAll('.falling-heart');
        hearts.forEach(heart => {
            heart.remove();
            returnHeartToPool(heart);
        });
    }
    
    function endGame() {
        gameState.gameActive = false;
        clearAllIntervals();
        clearHearts();
        
        // حفظ البيانات
        saveGameData();
        
        // تحديد الرتبة والرسالة
        let message = "";
        let rank = "";
        
        if (gameState.score >= 300) {
            message = "أسطورة! إنتِ ملكة القلوب! 👑";
            rank = "ملكة القلوب";
        } else if (gameState.score >= 200) {
            message = "ممتاز جداً! صائدة قلوب محترفة! 🏆";
            rank = "محترفة";
        } else if (gameState.score >= 120) {
            message = "رائع! إنتِ صائدة قلوب ماهرة! 💖";
            rank = "ماهرة";
        } else if (gameState.score >= 60) {
            message = "جيد جداً! 💕";
            rank = "مبتدئة متقدمة";
        } else {
            message = "حاولي تاني! 💔";
            rank = "مبتدئة";
        }
        
        // عرض النتائج
        catcherArea.innerHTML = `
            <div class="game-result" style="
                position: absolute; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%); 
                text-align: center; 
                background: rgba(0,0,0,0.9); 
                padding: 40px; 
                border-radius: 25px; 
                backdrop-filter: blur(15px);
                border: 2px solid rgba(255,255,255,0.3);
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h3 style="font-size: 2.5rem; margin-bottom: 20px; color: #ffd700;">🎮 انتهت اللعبة!</h3>
                <div class="final-stats" style="
                    background: rgba(255,255,255,0.1); 
                    padding: 25px; 
                    border-radius: 15px; 
                    margin: 25px 0;
                    border: 1px solid rgba(255,255,255,0.2);
                ">
                    <p style="margin: 12px 0; font-size: 1.3rem;"><strong>🏆 النقاط:</strong> ${gameState.score}</p>
                    <p style="margin: 12px 0; font-size: 1.3rem;"><strong>🎯 المستوى:</strong> ${gameState.level}</p>
                    <p style="margin: 12px 0; font-size: 1.3rem;"><strong>🔥 أعلى كومبو:</strong> ${gameState.maxCombo}</p>
                    <p style="margin: 12px 0; font-size: 1.3rem;"><strong>👑 الرتبة:</strong> ${rank}</p>
                </div>
                <p style="
                    font-size: 1.6rem; 
                    font-weight: bold; 
                    margin: 25px 0; 
                    color: #4ecdc4;
                    text-shadow: 0 0 15px rgba(78,205,196,0.5);
                ">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
                    <button onclick="location.reload()" class="game-btn" style="
                        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        font-size: 1.2rem;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    ">🔄 العب تاني</button>
                    <button onclick="shareScore()" class="game-btn" style="
                        background: linear-gradient(45deg, #25D366, #128C7E);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        font-size: 1.2rem;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    ">📱 شارك النتيجة</button>
                </div>
            </div>
        `;
        
        playSound('gameover');
    }
    
    // تشغيل الأصوات (محاكاة)
    function playSound(type) {
        // يمكن إضافة ملفات صوتية حقيقية هنا
        console.log(`Playing sound: ${type}`);
    }
    
    // مشاركة النتيجة
    window.shareScore = function() {
        const text = `🎮 حققت ${gameState.score} نقطة في لعبة صائد القلوب! 💖\n🎯 المستوى ${gameState.level} - 🔥 أعلى كومبو ${gameState.maxCombo}\n\n💕 لعبة مخصصة لرحمة من محمد`;
        
        if (navigator.share) {
            navigator.share({
                title: '🎮 لعبة صائد القلوب',
                text: text
            });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showPowerUpMessage('تم نسخ النتيجة! 📋');
            });
        } else {
            // fallback للمتصفحات القديمة
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showPowerUpMessage('تم نسخ النتيجة! 📋');
        }
    }
});