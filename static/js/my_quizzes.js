function deleteQuiz(buttonElement) {
    const documentName = buttonElement.getAttribute('data-document-name');
    const deleteUrl = buttonElement.getAttribute('data-delete-url');

    if (confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
        // Show loading state
        const deleteBtn = buttonElement;
        const originalContent = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="ri-loader-4-line"></i>';
        deleteBtn.disabled = true;

        // Send delete request
        fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Remove the quiz card from the DOM
                const quizCard = deleteBtn.closest('.quiz-card');
                quizCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                quizCard.style.opacity = '0';
                quizCard.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    quizCard.remove();

                    // Check if no quizzes left
                    const quizzesGrid = document.querySelector('.quizzes-grid');
                    if (quizzesGrid && quizzesGrid.children.length === 0) {
                        location.reload(); // Reload to show empty state
                    }
                }, 300);

                // Show success notification
                showNotification('Quiz deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete quiz');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Restore button state
            deleteBtn.innerHTML = originalContent;
            deleteBtn.disabled = false;
            showNotification('Failed to delete quiz. Please try again.', 'error');
        });
    }
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="ri-${type === 'success' ? 'check' : 'error-warning'}-line"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Auto-refresh for processing jobs
document.addEventListener('DOMContentLoaded', function() {
    const processingJobs = document.querySelectorAll('.status-processing, .status-pending');
    if (processingJobs.length > 0) {
        // Refresh page every 10 seconds if there are processing jobs
        setTimeout(() => {
            location.reload();
        }, 10000);
    }
});
