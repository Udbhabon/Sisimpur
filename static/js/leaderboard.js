// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        // Here you would typically make an AJAX call to filter the leaderboard
        const filter = this.dataset.filter;
        console.log('Filtering by:', filter);

        // Add loading animation or update leaderboard data
        // filterLeaderboard(filter);
    });
});

// Smooth scroll animation for leaderboard list
const leaderboardList = document.querySelector('.leaderboard-list');
if (leaderboardList) {
    leaderboardList.style.scrollBehavior = 'smooth';
}

// Add entrance animations
document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.leaderboard-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';

        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
