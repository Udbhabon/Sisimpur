document.addEventListener('DOMContentLoaded', function() {
    // View switching logic
    const viewButtons = document.querySelectorAll('.view-btn');
    const questionsContainer = document.getElementById('questions-container');
    
    if (viewButtons.length > 0 && questionsContainer) {
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const view = this.dataset.view;
                questionsContainer.className = view === 'cards' ? 'questions-grid' : 'questions-list';
            });
        });
    }

    // Auto-refresh for processing jobs
    // Check if we are in a processing state
    const processingState = document.querySelector('.processing-state');
    if (processingState) {
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
});
