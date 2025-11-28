// Create celebration particles
document.addEventListener('DOMContentLoaded', function() {
    createCelebrationEffect();
    
    // Add floating animation to stats
    document.querySelectorAll('.stat-item').forEach((item, index) => {
        item.style.animationDelay = (index * 0.2) + 's';
        item.classList.add('floating-element');
    });
    
    playSuccessSound();
});

function createCelebrationEffect() {
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createParticle();
        }, i * 100);
    }
}

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';
    
    // Random position
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '100vh';
    
    // Random colors
    const colors = ['#10b981', '#00d4ff', '#5e17eb', '#fbbf24'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    // Random size
    const size = Math.random() * 6 + 4;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    document.body.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const btnExam = document.querySelector('.btn-exam');
        if (btnExam) {
            e.preventDefault();
            btnExam.click();
        }
    } else if (e.key === 'Escape') {
        const btnBack = document.querySelector('.btn-back');
        if (btnBack) {
            e.preventDefault();
            btnBack.click();
        }
    }
});

// Add success sound effect (optional)
function playSuccessSound() {
    // You can add audio here if needed
    console.log('🎉 Study session completed successfully!');
}
