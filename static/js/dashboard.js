document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggle-sidebar');
  const mainContent = document.querySelector('.main-content');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const languageToggle = document.getElementById('language-toggle');
  const languageDropdown = document.getElementById('language-dropdown');
  const languageOptions = document.querySelectorAll('.language-option');
  const profileToggle = document.getElementById('profile-toggle');
  const profileDropdown = document.getElementById('profile-dropdown');
  const themeToggle = document.getElementById('theme-toggle');
  // Sidebar (mobile) controls
  const sidebarLanguageToggle = document.getElementById('sidebar-language-toggle');
  const sidebarLanguageDropdown = document.getElementById('sidebar-language-dropdown');
  const sidebarThemeToggle = document.getElementById('sidebar-theme-toggle');
  const sidebarNotificationBtn = document.getElementById('sidebar-notification-btn');

  // Toggle Sidebar
  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    // No JS needed for .sidebar-icon-label, CSS handles visibility
  });

  // Mobile Sidebar Toggle
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.add('show');
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
  });

  // Language Dropdown (navbar)
  languageToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    languageToggle.classList.toggle('active');
    languageDropdown.classList.toggle('show');
    // Close profile dropdown if open
    profileDropdown.classList.remove('show');
    profileToggle.classList.remove('active');
  });

  // Language Dropdown (sidebar/mobile)
  if (sidebarLanguageToggle && sidebarLanguageDropdown) {
    sidebarLanguageToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebarLanguageToggle.classList.toggle('active');
      sidebarLanguageDropdown.classList.toggle('show');
    });
    // Sidebar language options
    sidebarLanguageDropdown.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = option.dataset.lang;
        sidebarLanguageDropdown.querySelector('.language-option.active').classList.remove('active');
        option.classList.add('active');
        sidebarLanguageDropdown.classList.remove('show');
        sidebarLanguageToggle.classList.remove('active');
        // Here you would implement language change logic
        console.log(`[Sidebar] Switching language to: ${lang}`);
      });
    });
  }

  // Profile Dropdown
  profileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    profileToggle.classList.toggle('active');
    profileDropdown.classList.toggle('show');
    
    // Close language dropdown if open
    languageDropdown.classList.remove('show');
    languageToggle.classList.remove('active');
  });

  // Theme Toggle (navbar)
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
      themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
    } else {
      themeToggle.innerHTML = '<i class="ri-moon-line"></i>';
    }
  });

  // Theme Toggle (sidebar/mobile)
  if (sidebarThemeToggle) {
    sidebarThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      if (document.body.classList.contains('light-mode')) {
        sidebarThemeToggle.innerHTML = '<i class="ri-sun-line"></i>';
      } else {
        sidebarThemeToggle.innerHTML = '<i class="ri-moon-line"></i>';
      }
    });
  }

  // Notification Button (sidebar/mobile)
  if (sidebarNotificationBtn) {
    sidebarNotificationBtn.addEventListener('click', () => {
      alert('Notifications (mobile sidebar) coming soon!');
    });
  }

  // Close dropdowns when clicking outside (add for sidebar language dropdown)
  document.addEventListener('click', () => {
    languageDropdown.classList.remove('show');
    languageToggle.classList.remove('active');
    profileDropdown.classList.remove('show');
    profileToggle.classList.remove('active');
    if (sidebarLanguageDropdown && sidebarLanguageToggle) {
      sidebarLanguageDropdown.classList.remove('show');
      sidebarLanguageToggle.classList.remove('active');
    }
  });

  // Prevent bubbling for dropdown content (add for sidebar)
  const preventBubbling = document.querySelectorAll('.language-dropdown, .profile-dropdown');
  preventBubbling.forEach(element => {
    element.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
  if (sidebarLanguageDropdown) {
    sidebarLanguageDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Sidebar active item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.nav-item.active').classList.remove('active');
      item.classList.add('active');
      
      // Close mobile sidebar after selecting an item
      if (window.innerWidth < 768) {
        sidebar.classList.remove('show');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  });

  // Mock search functionality
  const searchInput = document.querySelector('.search-box input');
  const searchResults = document.getElementById('search-results');
  
  searchInput.addEventListener('focus', () => {
    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--gray-400); margin-bottom: 8px;">Recent Searches</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="background: var(--glass); padding: 4px 12px; border-radius: 16px; font-size: 0.8rem;">Physics MCQ</span>
          <span style="background: var(--glass); padding: 4px 12px; border-radius: 16px; font-size: 0.8rem;">Chemistry Formulas</span>
          <span style="background: var(--glass); padding: 4px 12px; border-radius: 16px; font-size: 0.8rem;">Math Trigonometry</span>
        </div>
      </div>
    `;
  });
  
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      searchResults.style.display = 'none';
    }, 200);
  });

  // Add animations to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    card.classList.add('floating');
    card.style.animationDelay = `${index * 0.2}s`;
  });

  // Handle resize events for responsive behavior
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 768 && sidebar.classList.contains('show')) {
      sidebar.classList.remove('show');
      sidebarOverlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  });

  // Initialize UI based on screen size
  if (window.innerWidth < 768) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
  }

  // Quiz Form Functionality
  const fileInput = document.getElementById('file-input');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const generateBtn = document.querySelector('.generate-btn');
  const quizTextarea = document.querySelector('.quiz-textarea');

  // File Upload Handler
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      const fileNames = files.map(file => file.name).join(', ');

      // Here you would typically handle file upload
      console.log('Selected files:', fileNames);
    });
  }

  // Difficulty Button Handler
  if (difficultyBtns.length > 0) {
    difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const activeBtn = document.querySelector('.difficulty-btn.active');
        if (activeBtn) {
          activeBtn.classList.remove('active');
        }
        btn.classList.add('active');
      });
    });
  }

  // Generate Quiz Handler
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const text = quizTextarea ? quizTextarea.value : '';
      const questionCountEl = document.getElementById('question-count');
      const examTypeEl = document.getElementById('exam-type');
      const activeDifficultyBtn = document.querySelector('.difficulty-btn.active');

      const questionCount = questionCountEl ? questionCountEl.value : '';
      const examType = examTypeEl ? examTypeEl.value : '';
      const difficulty = activeDifficultyBtn ? activeDifficultyBtn.dataset.difficulty : '';

      // Here you would typically handle quiz generation
      console.log('Generating quiz with:', {
        text,
        questionCount,
        examType,
        difficulty
      });
    });
  }

  // Mobile search bar toggle
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  const mobileSearchBox = document.getElementById('mobile-search-box');
  const closeSearchBtn = document.getElementById('close-search-btn');
  if (mobileSearchBtn && mobileSearchBox && closeSearchBtn) {
    mobileSearchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      mobileSearchBox.classList.add('active');
      mobileSearchBox.querySelector('input').focus();
    });
    closeSearchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      mobileSearchBox.classList.remove('active');
    });
  }
});