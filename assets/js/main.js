// الصفحة الرئيسية - main.js
document.addEventListener('DOMContentLoaded', function() {
    const celebrateBtn = document.getElementById('celebrate-btn');
    
    if (celebrateBtn) {
        celebrateBtn.addEventListener('click', function() {
            // إضافة تأثير الاحتفال
            document.body.style.background = 'linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)';
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradient 3s ease infinite';
            
            // إضافة قلوب متطايرة
            createFloatingHearts();
            
            setTimeout(() => {
                document.body.style.background = '';
                document.body.style.animation = '';
            }, 3000);
        });
    }
});

function createFloatingHearts() {
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.position = 'fixed';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '100vh';
        heart.style.fontSize = Math.random() * 20 + 20 + 'px';
        heart.style.zIndex = '1000';
        heart.style.pointerEvents = 'none';
        heart.style.animation = `float-up ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 5000);
    }
}