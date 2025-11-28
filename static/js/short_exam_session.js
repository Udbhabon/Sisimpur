document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.exam-container');
    if (!container) return;

    let remainingTime = parseInt(container.dataset.remainingTime);
    const evaluateUrl = container.dataset.evaluateUrl;
    const sessionId = container.dataset.sessionId;
    const questionId = container.dataset.questionId;
    
    const timerDisplay = document.getElementById('timer-display');
    const examForm = document.getElementById('exam-form');

    // Timer functionality
    function updateTimer() {
        if (remainingTime <= 0) {
            // Auto-submit when time expires
            if (examForm) examForm.submit();
            return;
        }
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        remainingTime--;
    }

    // Update timer every second
    setInterval(updateTimer, 1000);

    // Character count
    const textarea = document.getElementById('answer-textarea');
    const charCount = document.getElementById('char-count');

    if (textarea && charCount) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            // Change color based on character count
            if (count > 1800) {
                charCount.style.color = '#ef4444';
            } else if (count > 1500) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#aaaaaa';
            }
        });
    }

    // Voice input functionality
    let recognition;
    let isRecording = false;
    const voiceBtn = document.getElementById('voice-btn');
    const voiceIcon = document.getElementById('voice-icon');
    const voiceText = document.getElementById('voice-text');
    const voiceStatus = document.getElementById('voice-status');

    // Check if browser supports speech recognition
    if (('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isRecording = true;
            if (voiceIcon) voiceIcon.className = 'ri-mic-fill';
            if (voiceText) voiceText.textContent = 'Stop Recording';
            if (voiceStatus) voiceStatus.textContent = 'Listening...';
            voiceBtn.classList.add('recording');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const currentText = textarea.value;
            textarea.value = currentText + (currentText ? ' ' : '') + transcript;
            
            // Trigger input event to update character count
            textarea.dispatchEvent(new Event('input'));
        };
        
        recognition.onend = function() {
            isRecording = false;
            if (voiceIcon) voiceIcon.className = 'ri-mic-line';
            if (voiceText) voiceText.textContent = 'Start Voice Input';
            if (voiceStatus) voiceStatus.textContent = 'Click to start recording';
            voiceBtn.classList.remove('recording');
        };
        
        recognition.onerror = function(event) {
            isRecording = false;
            if (voiceIcon) voiceIcon.className = 'ri-mic-line';
            if (voiceText) voiceText.textContent = 'Start Voice Input';
            if (voiceStatus) voiceStatus.textContent = 'Error: ' + event.error;
            voiceBtn.classList.remove('recording');
        };
        
        voiceBtn.addEventListener('click', function() {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else if (document.querySelector('.voice-input-container')) {
        // Hide voice input if not supported
        document.querySelector('.voice-input-container').style.display = 'none';
    }

    // Auto-evaluation for short answers
    let evaluationInProgress = false;

    function evaluateAnswer() {
        if (evaluationInProgress) return;
        
        const answer = textarea.value.trim();
        if (!answer) return;
        
        evaluationInProgress = true;
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.disabled = true;
            const originalText = nextBtn.innerHTML;
            nextBtn.innerHTML = '<i class="ri-loader-4-line"></i> Evaluating...';
            
            // Store original text to restore later
            nextBtn.dataset.originalText = originalText;
        }
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Call evaluation API
        fetch(evaluateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                session_id: sessionId,
                q_id: questionId,
                user_answer: answer
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showEvaluationFeedback(data.evaluation);
            } else {
                console.error('Evaluation failed:', data.error);
            }
        })
        .catch(error => {
            console.error('Evaluation error:', error);
        })
        .finally(() => {
            evaluationInProgress = false;
            if (nextBtn) {
                nextBtn.disabled = false;
                // Restore original text or default
                nextBtn.innerHTML = 'Next <i class="ri-arrow-right-line"></i>';
            }
        });
    }

    function showEvaluationFeedback(evaluation) {
        const feedbackDiv = document.getElementById('evaluation-feedback');
        const scoreSpan = document.getElementById('feedback-score');
        const feedbackText = document.getElementById('feedback-text');
        
        if (scoreSpan) scoreSpan.textContent = `${evaluation.score}/${evaluation.max_score} (${evaluation.percentage.toFixed(1)}%)`;
        if (feedbackText) {
            feedbackText.innerHTML = `
                <strong>Feedback:</strong> ${evaluation.feedback}<br><br>
                <strong>Ideal Answer:</strong> ${evaluation.ideal_answer}
            `;
        }
        
        if (feedbackDiv) feedbackDiv.classList.add('show');
    }

    // Auto-evaluate when user stops typing (debounced)
    let evaluationTimeout;
    if (textarea) {
        textarea.addEventListener('input', function() {
            clearTimeout(evaluationTimeout);
            evaluationTimeout = setTimeout(() => {
                if (this.value.trim().length > 10) { // Only evaluate if answer is substantial
                    evaluateAnswer();
                }
            }, 2000); // Wait 2 seconds after user stops typing
        });
    }

    // Track if form is being submitted to prevent beforeunload dialog
    let isFormSubmitting = false;

    // Prevent accidental page refresh
    function handleBeforeUnload(e) {
        if (isFormSubmitting) {
            return;
        }
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Remove beforeunload when form is submitted
    if (examForm) {
        examForm.addEventListener('submit', function() {
            isFormSubmitting = true;
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }
});
