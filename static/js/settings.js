function toggleSetting(element) {
  element.classList.toggle('active');
  // Here you would typically send an AJAX request to save the setting
}

function toggleTheme(element) {
  element.classList.toggle('active');
  // Here you would implement theme switching logic
}

function confirmDeleteData() {
  if (confirm('Are you sure you want to delete all your quiz data? This action cannot be undone.')) {
    // Implement delete data logic
    alert('Feature coming soon!');
  }
}

function confirmDeleteAccount() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    // Implement delete account logic
    alert('Feature coming soon!');
  }
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');

        // Here you would show/hide different settings sections based on the tab
      });
    });
});
