function createCelebrationParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.background = `hsl(${Math.random() * 60 + 280}, 70%, 60%)`;
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '-10px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '1000';
    
    document.body.appendChild(particle);
    
    const fallDuration = 3000 + Math.random() * 2000;
    const startTime = Date.now();
    
    function animateParticle() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / fallDuration;
        
        if (progress < 1) {
            const y = progress * (window.innerHeight + 20);
            const x = parseFloat(particle.style.left) + Math.sin(progress * Math.PI * 4) * 50;
            
            particle.style.transform = `translate(${x - parseFloat(particle.style.left)}px, ${y}px)`;
            particle.style.opacity = 1 - progress;
            
            requestAnimationFrame(animateParticle);
        } else {
            document.body.removeChild(particle);
        }
    }
    
    requestAnimationFrame(animateParticle);
}

function startCelebration() {
    // Create celebration particles
    for (let i = 0; i < 50; i++) {
        createCelebrationParticle();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.results-container');
    if (container && container.dataset.celebrate === 'true') {
        startCelebration();
    }
});
