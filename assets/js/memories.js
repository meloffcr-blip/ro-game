// صفحة الذكريات - memories.js
document.addEventListener('DOMContentLoaded', function() {
    const memories = [
        "أول مرة شفتك فيها... قلبي وقف عن الخفقان لثانية",
        "لما ضحكتي أول مرة قدامي... عرفت إن ده صوت السعادة",
        "أول مرة مسكت إيدك... حسيت بالأمان",
        "لما قولتيلي بتحبيني... كان أحلى يوم في حياتي",
        "كل يوم معاكي ذكرى جديدة أحبها"
    ];

    let currentMemoryIndex = 0;
    const memoryCaption = document.querySelector('.memory-caption');
    const prevBtn = document.getElementById('prev-memory-btn');
    const nextBtn = document.getElementById('next-memory-btn');

    function showMemory(index) {
        memoryCaption.textContent = memories[index];
    }

    if (prevBtn && nextBtn) {
        showMemory(0);

        prevBtn.addEventListener('click', function() {
            currentMemoryIndex = (currentMemoryIndex - 1 + memories.length) % memories.length;
            showMemory(currentMemoryIndex);
        });

        nextBtn.addEventListener('click', function() {
            currentMemoryIndex = (currentMemoryIndex + 1) % memories.length;
            showMemory(currentMemoryIndex);
        });
    }
});