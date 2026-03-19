// لعبة الأسئلة - quiz.js
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-quiz-btn');
    const quizContent = document.getElementById('quiz-content');

    const questions = [
        {
            question: "إيه لوني المفضل؟",
            options: ["أزرق", "أحمر", "أخضر", "أسود"],
            correct: 0
        },
        {
            question: "إيه أكلتي المفضلة؟",
            options: ["بيتزا", "برجر", "مكرونة", "فراخ"],
            correct: 2
        },
        {
            question: "إيه حلمي في المستقبل؟",
            options: ["السفر", "البيت الكبير", "العيلة السعيدة", "كل ما سبق"],
            correct: 3
        }
    ];

    let currentQuestion = 0;
    let score = 0;

    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }

    function startQuiz() {
        startBtn.classList.add('hidden');
        quizContent.classList.remove('hidden');
        showQuestion();
    }

    function showQuestion() {
        if (currentQuestion < questions.length) {
            const q = questions[currentQuestion];
            quizContent.innerHTML = `
                <div class="question">
                    <h3>${q.question}</h3>
                    <div class="options">
                        ${q.options.map((option, index) => 
                            `<button class="option-btn" onclick="selectAnswer(${index})">${option}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            showResult();
        }
    }

    window.selectAnswer = function(selectedIndex) {
        if (selectedIndex === questions[currentQuestion].correct) {
            score++;
        }
        currentQuestion++;
        setTimeout(showQuestion, 500);
    }

    function showResult() {
        const percentage = (score / questions.length) * 100;
        let message = "";
        
        if (percentage >= 80) {
            message = "ممتاز! إنتِ فاهماني جداً ❤️";
        } else if (percentage >= 60) {
            message = "كويس! لسه محتاجين نتعرف أكتر 😊";
        } else {
            message = "لازم نقضي وقت أكتر مع بعض 😅";
        }

        quizContent.innerHTML = `
            <div class="result">
                <h3>النتيجة: ${score}/${questions.length}</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="game-btn">العب تاني</button>
            </div>
        `;
    }
});