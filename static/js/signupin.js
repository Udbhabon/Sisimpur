document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // Toggle Login/Register Forms
    // ==========================================
    const container = document.querySelector(".container");
    const registerBtn = document.querySelector(".register-btn");
    const loginBtn = document.querySelector(".login-btn");

    if (registerBtn && container) {
        registerBtn.addEventListener("click", () => {
            container.classList.add("active");
        });
    }

    if (loginBtn && container) {
        loginBtn.addEventListener("click", () => {
            container.classList.remove("active");
        });
    }

    // ==========================================
    // Login Logic
    // ==========================================
    const loginSubmitBtn = document.querySelector('.form-box.login .btn');
    
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogin(this);
        });
    }

    function handleLogin(button) {
        const loginForm = document.querySelector('.form-box.login form');
        if (!loginForm) return;

        const emailInput = loginForm.querySelector('input[name="email"]');
        const passwordInput = loginForm.querySelector('input[name="password"]');
        const csrfInput = loginForm.querySelector('input[name="csrfmiddlewaretoken"]');
        
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const csrfToken = csrfInput ? csrfInput.value : '';
        const loginUrl = loginForm.getAttribute('action');

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Signing In...';

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('action', 'login');
        formData.append('csrfmiddlewaretoken', csrfToken);

        fetch(loginUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }
            return response.text();
        })
        .then(html => {
            if (html) {
                // Simple check for error messages in the returned HTML
                if (html.includes('Invalid email or password') || html.includes('error')) {
                    alert('Login failed: Invalid email or password');
                } else {
                    // If we got HTML back but weren't redirected, it might be a re-rendered form with errors
                    // For now, just alert generic error or specific if found
                    alert('Login failed. Please check your credentials.');
                }
            }
            button.disabled = false;
            button.innerHTML = 'Sign In';
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
            button.disabled = false;
            button.innerHTML = 'Sign In';
        });
    }

    // ==========================================
    // OTP Verification Logic
    // ==========================================
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otpInput');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const signupBtn = document.getElementById('signupBtn');
    const emailInput = document.getElementById('emailInput');
    const otpStatus = document.getElementById('otpStatus');
    const emailVerified = document.getElementById('emailVerified');
    
    // Get URLs from data attributes on the register form
    const registerForm = document.querySelector('.form-box.register form');
    const otpUrl = registerForm ? registerForm.dataset.otpUrl : '';
    const verifyOtpUrl = registerForm ? registerForm.dataset.verifyOtpUrl : '';

    let emailVerifiedStatus = false;
    let resendCooldown = false;

    // Send OTP
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', function() {
            const email = emailInput.value.trim();

            if (!email) {
                showStatus('Please enter your email address', 'error');
                return;
            }

            if (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com')) {
                showStatus('Only Gmail addresses (@gmail.com or @googlemail.com) are allowed', 'error');
                return;
            }

            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            fetch(otpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ email: email })
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    if (otpSection) otpSection.style.display = 'block';
                    
                    sendOtpBtn.innerHTML = '<i class="bx bx-check"></i> Code Sent';
                    sendOtpBtn.style.background = '#10b981';
                    showStatus('Verification code sent to ' + email, 'success');
                    
                    if (otpInput) otpInput.focus();
                    startResendCooldown();
                } else {
                    showStatus(data.message || 'Failed to send verification code', 'error');
                    sendOtpBtn.disabled = false;
                    sendOtpBtn.innerHTML = '<i class="bx bx-mail-send"></i> Send Verification Code';
                }
            })
            .catch(error => {
                console.error('Error sending OTP:', error);
                showStatus('Error sending verification code: ' + error.message, 'error');
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = '<i class="bx bx-mail-send"></i> Send Verification Code';
            });
        });
    }

    // Verify OTP
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', function() {
            const otpCode = otpInput.value.trim();

            if (!otpCode || otpCode.length !== 6) {
                showStatus('Please enter a valid 6-digit code', 'error');
                return;
            }

            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Verifying...';

            fetch(verifyOtpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    otp_code: otpCode
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    emailVerifiedStatus = true;
                    if (emailVerified) emailVerified.value = 'true';

                    verifyOtpBtn.innerHTML = '<i class="bx bx-check"></i> Verified';
                    verifyOtpBtn.style.background = '#10b981';
                    otpInput.disabled = true;
                    otpInput.style.background = '#f0f9ff';

                    signupBtn.disabled = false;
                    signupBtn.style.opacity = '1';
                    signupBtn.style.cursor = 'pointer';
                    signupBtn.innerHTML = '<i class="bx bx-user-plus"></i> Sign Up';

                    showStatus('Email verified successfully!', 'success');
                } else {
                    showStatus(data.message || 'Invalid verification code', 'error');
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.innerHTML = '<i class="bx bx-check"></i> Verify';
                }
            })
            .catch(error => {
                console.error('Error verifying OTP:', error);
                showStatus('Error verifying code', 'error');
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerHTML = '<i class="bx bx-check"></i> Verify';
            });
        });
    }

    // Auto-format OTP input
    if (otpInput) {
        otpInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 6 && verifyOtpBtn) {
                verifyOtpBtn.click();
            }
        });
    }

    // Resend OTP
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', function() {
            if (resendCooldown) return;
            if (sendOtpBtn) sendOtpBtn.click();
        });
    }

    // Signup Button Click
    if (signupBtn) {
        signupBtn.addEventListener('click', function(e) {
            if (!emailVerifiedStatus) {
                e.preventDefault();
                showStatus('Please verify your email first', 'error');
                return false;
            }
            
            // If verified, let the form submit (or trigger the submit handler below)
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            if (!emailVerifiedStatus) {
                e.preventDefault();
                showStatus('Please verify your email first', 'error');
                return false;
            }

            e.preventDefault();
            const formData = new FormData(this);
            const actionUrl = this.getAttribute('action');
            const signupBtn = this.querySelector('#signupBtn');

            if (signupBtn) {
                signupBtn.disabled = true;
                signupBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating Account...';
            }

            fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                    return;
                }
                return response.text();
            })
            .then(html => {
                if (html) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const errorMessages = doc.querySelectorAll('.alert-danger, .error, .django-message[data-type="error"]');

                    if (errorMessages.length > 0) {
                        const errorTexts = Array.from(errorMessages).map(msg => msg.textContent.trim());
                        const errorText = errorTexts.join('. ');
                        
                        if (typeof window.showToast === 'function') {
                            window.showToast('error', 'Signup Failed', errorText);
                        } else {
                            showStatus(errorText, 'error');
                        }
                    } else {
                        // Check for success
                        const successMessages = doc.querySelectorAll('.alert-success, .success, .django-message[data-type="success"]');
                        if (successMessages.length > 0) {
                            const successText = successMessages[0].textContent.trim();
                            if (typeof window.showToast === 'function') {
                                window.showToast('success', 'Welcome!', successText);
                            }
                            setTimeout(() => {
                                window.location.href = '/app/';
                            }, 1500);
                        }
                    }
                    
                    if (signupBtn) {
                        signupBtn.disabled = false;
                        signupBtn.innerHTML = '<i class="bx bx-user-plus"></i> Sign Up';
                    }
                }
            })
            .catch(error => {
                console.error('Signup error:', error);
                if (typeof window.showToast === 'function') {
                    window.showToast('error', 'Signup Failed', 'An error occurred. Please try again.');
                } else {
                    showStatus('An error occurred. Please try again.', 'error');
                }
                if (signupBtn) {
                    signupBtn.disabled = false;
                    signupBtn.innerHTML = '<i class="bx bx-user-plus"></i> Sign Up';
                }
            });
        });
    }

    // Helper: Show Status
    function showStatus(message, type) {
        if (!otpStatus) return;
        otpStatus.textContent = message;
        otpStatus.className = 'otp-status ' + type;
        setTimeout(() => {
            otpStatus.textContent = '';
            otpStatus.className = 'otp-status';
        }, 5000);
    }

    // Helper: Resend Cooldown
    function startResendCooldown() {
        if (!resendOtpBtn) return;
        resendCooldown = true;
        resendOtpBtn.disabled = true;

        let timeLeft = 120; // 2 minutes
        const interval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            resendOtpBtn.innerHTML = `<i class="bx bx-time"></i> ${minutes}:${seconds.toString().padStart(2, '0')}`;

            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(interval);
                resendCooldown = false;
                resendOtpBtn.disabled = false;
                resendOtpBtn.innerHTML = '<i class="bx bx-refresh"></i> Resend';
            }
        }, 1000);
    }

    // ==========================================
    // Social Media Toast Logic
    // ==========================================
    const socialLinks = document.querySelectorAll(".social-icons a");
    socialLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
            const url = new URL(this.href);
            const socialType = url.searchParams.get("social");

            if (socialType && typeof window.showToast === "function") {
                e.preventDefault();
                switch (socialType) {
                    case "google":
                        window.showToast("info", "Google Sign-In", "Google sign-in is coming soon!");
                        break;
                    case "facebook":
                        window.showToast("warning", "Facebook", "Facebook integration is under maintenance.");
                        break;
                    case "github":
                        window.showToast("success", "GitHub", "GitHub authentication is ready to use!");
                        break;
                    case "linkedin":
                        window.showToast("error", "LinkedIn", "LinkedIn sign-in is temporarily unavailable.");
                        break;
                }
            }
        });
    });
});
