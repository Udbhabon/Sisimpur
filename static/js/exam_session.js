function initExamTimer(initialTime) {
    let remainingTime = initialTime;
    const timerDisplay = document.getElementById('timer-display');

    function updateTimer() {
        if (remainingTime <= 0) {
            // Auto-submit when time expires
            const form = document.getElementById('exam-form');
            if (form) {
                form.submit();
            }
            return;
        }
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60); // Ensure integer
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        remainingTime--;
    }

    // Update timer every second
    setInterval(updateTimer, 1000);
}

// Option selection for multiple choice
function selectOption(element) {
    // Remove selected class from all options
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    element.classList.add('selected');
    
    // Check the radio button
    const radio = element.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }
}

// Auto-save functionality (optional enhancement)
let autoSaveTimer;
function autoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        // Could implement auto-save here
        console.log('Auto-save triggered');
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize timer if element exists
    const timerElement = document.querySelector('.exam-timer');
    if (timerElement) {
        const remainingTime = parseFloat(timerElement.dataset.remainingTime);
        if (!isNaN(remainingTime)) {
            initExamTimer(remainingTime);
        }
    }

    // Add auto-save to form inputs
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', autoSave);
    });

    // Track if form is being submitted to prevent beforeunload dialog
    let isFormSubmitting = false;

    // Prevent accidental page refresh
    function handleBeforeUnload(e) {
        // Don't show dialog if form is being submitted
        if (isFormSubmitting) {
            return;
        }
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Remove beforeunload when form is submitted
    const form = document.getElementById('exam-form');
    if (form) {
        form.addEventListener('submit', function() {
            isFormSubmitting = true;
            // Remove the event listener properly
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }
});
