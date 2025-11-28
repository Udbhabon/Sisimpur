document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.flashcard-container');
    if (container) {
        const timePerCard = parseInt(container.dataset.timePerCard);
        const autoAdvance = container.dataset.autoAdvance === 'true';
        if (!isNaN(timePerCard)) {
            initFlashcardSession(timePerCard, autoAdvance);
        }
    }
});

function initFlashcardSession(timePerCard, autoAdvance) {
    let timeRemaining = timePerCard;
    let autoAdvanceTime = timePerCard;
    const timerDisplay = document.getElementById('timer-display');
    const autoTimer = document.getElementById('auto-timer');
    const autoProgress = document.getElementById('auto-progress');
    const cardTimer = document.getElementById('card-timer');
    let isFlipped = false;

    function updateTimer() {
        if (timeRemaining <= 0) {
            if (autoAdvance) {
                // Auto-advance to next card
                const form = document.getElementById('flashcard-form');
                if (form) {
                    form.submit();
                }
            }
            return;
        }
        
        if (timerDisplay) {
            timerDisplay.textContent = timeRemaining + 's';
        }
        
        // Update auto-advance indicator
        if (autoTimer && autoProgress) {
            autoTimer.textContent = timeRemaining;
            const progressPercent = ((autoAdvanceTime - timeRemaining) / autoAdvanceTime) * 100;
            autoProgress.style.height = progressPercent + '%';
        }
        
        // Warning when time is low
        if (timeRemaining <= 10 && cardTimer) {
            cardTimer.classList.add('timer-warning');
        }
        
        timeRemaining--;
    }

    // Start timer
    const timerInterval = setInterval(updateTimer, 1000);

    // Flip card functionality
    window.flipCard = function() {
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
            isFlipped = !isFlipped;
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                flipCard();
                break;
            case 'ArrowRight':
            case 'n':
                e.preventDefault();
                const nextBtn = document.querySelector('button[value="next"]');
                if (nextBtn) nextBtn.click();
                break;
            case 's':
                e.preventDefault();
                const skipBtn = document.querySelector('button[value="skip"]');
                if (skipBtn) skipBtn.click();
                break;
        }
    });

    // Track if form is being submitted to prevent beforeunload dialog
    let isFormSubmitting = false;

    // Prevent accidental navigation
    function handleBeforeUnload(e) {
        // Don't show dialog if form is being submitted
        if (isFormSubmitting) {
            return;
        }
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your study progress may be lost.';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Remove beforeunload when form is submitted
    const form = document.getElementById('flashcard-form');
    if (form) {
        form.addEventListener('submit', function() {
            isFormSubmitting = true;
            clearInterval(timerInterval);
            // Remove the event listener properly
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }

    // Auto-flip card after 5 seconds for better UX
    setTimeout(() => {
        if (!isFlipped) {
            flipCard();
        }
    }, 5000);
}
