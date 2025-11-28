function toggleFAQ(button) {
  const faqItem = button.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  // Open clicked item if it wasn't active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

function scrollToSection(sectionId) {
  // This would scroll to a specific section if implemented
  console.log('Scrolling to:', sectionId);
}

document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('help-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            // Implement search functionality here
            console.log('Searching for:', searchTerm);
        });
    }

    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            toggleFAQ(this);
        });
    });

    // Scroll to section
    document.querySelectorAll('[data-scroll-target]').forEach(element => {
        element.addEventListener('click', function() {
            const target = this.dataset.scrollTarget;
            scrollToSection(target);
        });
    });
});
