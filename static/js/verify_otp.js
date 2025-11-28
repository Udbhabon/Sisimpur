document.addEventListener('DOMContentLoaded', function() {
    const otpInput = document.getElementById('otpInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendBtn = document.getElementById('resendBtn');
    const countdown = document.getElementById('countdown');
    
    if (!otpInput || !verifyBtn || !resendBtn || !countdown) return;

    // Auto-focus on OTP input
    otpInput.focus();
    
    // Only allow numbers in OTP input
    otpInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Auto-submit when 6 digits are entered
        if (this.value.length === 6) {
            verifyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            verifyBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verifying...';
            setTimeout(() => {
                document.getElementById('otpForm').submit();
            }, 500);
        } else {
            verifyBtn.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            verifyBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verify Email';
        }
    });
    
    // Countdown timer for resend (2 minutes)
    let timeLeft = 120; // 2 minutes in seconds
    let countdownInterval;

    function updateCountdown() {
        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdown.textContent = `You can request a new code in ${minutes}:${seconds.toString().padStart(2, '0')}`;
            countdown.className = 'countdown';
            resendBtn.disabled = true;
            resendBtn.style.opacity = '0.5';
            timeLeft--;
        } else {
            countdown.textContent = 'You can now request a new verification code';
            countdown.className = 'countdown warning';
            resendBtn.disabled = false;
            resendBtn.style.opacity = '1';
            if (countdownInterval) clearInterval(countdownInterval);
        }
    }
    
    // Start countdown
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    
    // Handle form submissions
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', function() {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verifying...';
        });
    }
    
    const resendForm = document.getElementById('resendForm');
    if (resendForm) {
        resendForm.addEventListener('submit', function() {
            resendBtn.disabled = true;
            resendBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
        });
    }
});
