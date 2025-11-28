// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Toast content
    toast.innerHTML = `
        <div class="toast-content">
            <i class="ri-${getToastIcon(type)}-line toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="closeToast(this)">
                <i class="ri-close-line"></i>
            </button>
        </div>
        <div class="toast-progress"></div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto remove
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.animationDuration = `${duration}ms`;
    
    setTimeout(() => {
        closeToast(toast.querySelector('.toast-close'));
    }, duration);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'error-warning';
        case 'warning': return 'alert-triangle';
        case 'info': return 'information';
        default: return 'information';
    }
}

function closeToast(closeBtn) {
    const toast = closeBtn.closest('.toast');
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Show Django messages as toasts
document.addEventListener('DOMContentLoaded', function() {
    const djangoMessages = document.querySelectorAll('.django-message');
    djangoMessages.forEach(function(messageEl) {
        const message = messageEl.textContent.trim();
        const type = messageEl.getAttribute('data-type') || 'info';
        if (message) {
            showToast(message, type);
        }
    });
});

// Global toast function for use in other scripts
window.showToast = showToast;
