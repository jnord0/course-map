/**
 * UX Enhancements Module
 * Handles dark mode, keyboard shortcuts, and recently viewed courses
 */

const UXEnhancements = {
    // Storage keys
    THEME_KEY: 'champlain-theme',
    RECENT_COURSES_KEY: 'champlain-recent-courses',
    MAX_RECENT_COURSES: 5,

    /**
     * Initialize all UX enhancements
     */
    init: () => {
        UXEnhancements.initThemeToggle();
        UXEnhancements.initKeyboardShortcuts();
        UXEnhancements.initRecentlyViewed();
        UXEnhancements.initShortcutsModal();
        console.log('UX Enhancements initialized');
    },

    // ==========================================
    // THEME TOGGLE (Dark Mode)
    // ==========================================

    /**
     * Initialize theme toggle functionality
     */
    initThemeToggle: () => {
        // Load saved theme preference
        const savedTheme = localStorage.getItem(UXEnhancements.THEME_KEY);
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }

        // Setup toggle button listener
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', UXEnhancements.toggleTheme);
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(UXEnhancements.THEME_KEY)) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Toggle between light and dark themes
     */
    toggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(UXEnhancements.THEME_KEY, newTheme);

        // Add a subtle animation feedback
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                toggle.style.transform = '';
            }, 150);
        }
    },

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts: () => {
        document.addEventListener('keydown', UXEnhancements.handleKeyPress);
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress: (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            // Only handle Escape in inputs
            if (e.key === 'Escape') {
                e.target.blur();
                e.target.value = '';
                // Re-filter courses if in search
                if (e.target.id === 'courseSearch' && typeof CoursesModule !== 'undefined') {
                    CoursesModule.updateAvailableCourses('');
                }
            }
            return;
        }

        // Check if main app is visible
        const mainApp = document.getElementById('mainApp');
        const isMainAppVisible = mainApp && !mainApp.classList.contains('hidden');

        switch (e.key) {
            case '/':
                // Focus search input
                e.preventDefault();
                const searchInput = document.getElementById('courseSearch');
                if (searchInput && isMainAppVisible) {
                    searchInput.focus();
                    searchInput.select();
                }
                break;

            case 'Escape':
                // Close any open modals
                UXEnhancements.closeShortcutsModal();
                if (typeof ModalsModule !== 'undefined') {
                    ModalsModule.closeAllModals();
                }
                break;

            case 'd':
            case 'D':
                // Toggle dark mode
                if (!e.ctrlKey && !e.metaKey) {
                    UXEnhancements.toggleTheme();
                }
                break;

            case '?':
                // Show keyboard shortcuts modal
                e.preventDefault();
                UXEnhancements.toggleShortcutsModal();
                break;

            case '1':
                // Switch to Network view
                if (isMainAppVisible && typeof VisualizationModule !== 'undefined') {
                    VisualizationModule.switchView('network');
                }
                break;

            case '2':
                // Switch to Table view
                if (isMainAppVisible && typeof VisualizationModule !== 'undefined') {
                    VisualizationModule.switchView('table');
                }
                break;

            case '3':
                // Switch to Semester view
                if (isMainAppVisible && typeof VisualizationModule !== 'undefined') {
                    VisualizationModule.switchView('semester');
                }
                break;

            case '4':
                // Switch to Graphs view
                if (isMainAppVisible && typeof VisualizationModule !== 'undefined') {
                    VisualizationModule.switchView('graphs');
                }
                break;
        }
    },

    // ==========================================
    // KEYBOARD SHORTCUTS MODAL
    // ==========================================

    /**
     * Initialize shortcuts modal
     */
    initShortcutsModal: () => {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            // Close on click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UXEnhancements.closeShortcutsModal();
                }
            });
        }

        // Show hint only when logged in
        const hint = document.getElementById('shortcutsHint');
        if (hint) {
            hint.style.display = 'none'; // Hidden by default on landing
        }
    },

    /**
     * Toggle shortcuts modal visibility
     */
    toggleShortcutsModal: () => {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            if (modal.classList.contains('active')) {
                UXEnhancements.closeShortcutsModal();
            } else {
                UXEnhancements.openShortcutsModal();
            }
        }
    },

    /**
     * Open shortcuts modal
     */
    openShortcutsModal: () => {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Close shortcuts modal
     */
    closeShortcutsModal: () => {
        const modal = document.getElementById('shortcutsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Show keyboard shortcuts hint
     */
    showShortcutsHint: () => {
        const hint = document.getElementById('shortcutsHint');
        if (hint) {
            hint.style.display = 'flex';
        }
    },

    /**
     * Hide keyboard shortcuts hint
     */
    hideShortcutsHint: () => {
        const hint = document.getElementById('shortcutsHint');
        if (hint) {
            hint.style.display = 'none';
        }
    },

    // ==========================================
    // RECENTLY VIEWED COURSES
    // ==========================================

    /**
     * Initialize recently viewed courses tracking
     */
    initRecentlyViewed: () => {
        // Load saved recent courses
        UXEnhancements.renderRecentlyViewed();
    },

    /**
     * Add a course to recently viewed
     */
    addToRecentlyViewed: (courseCode, courseName) => {
        if (!courseCode) return;

        let recentCourses = UXEnhancements.getRecentlyViewed();

        // Remove if already exists (to move to front)
        recentCourses = recentCourses.filter(c => c.code !== courseCode);

        // Add to front
        recentCourses.unshift({
            code: courseCode,
            name: courseName || '',
            timestamp: Date.now()
        });

        // Limit to max courses
        recentCourses = recentCourses.slice(0, UXEnhancements.MAX_RECENT_COURSES);

        // Save to localStorage
        localStorage.setItem(UXEnhancements.RECENT_COURSES_KEY, JSON.stringify(recentCourses));

        // Re-render the list
        UXEnhancements.renderRecentlyViewed();
    },

    /**
     * Get recently viewed courses from localStorage
     */
    getRecentlyViewed: () => {
        try {
            const saved = localStorage.getItem(UXEnhancements.RECENT_COURSES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Render recently viewed courses section
     */
    renderRecentlyViewed: () => {
        const container = document.getElementById('recentlyViewedCourses');
        if (!container) return;

        const recentCourses = UXEnhancements.getRecentlyViewed();

        if (recentCourses.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const list = container.querySelector('.recent-courses-list');
        if (!list) return;

        list.innerHTML = recentCourses.map(course => `
            <div class="recent-course-item" onclick="UXEnhancements.viewRecentCourse('${course.code}')">
                <span class="recent-course-code">${course.code}</span>
                <span class="recent-course-name">${course.name}</span>
            </div>
        `).join('');
    },

    /**
     * View a recently viewed course (open details modal)
     */
    viewRecentCourse: (courseCode) => {
        // Find the course from state
        if (typeof StateGetters !== 'undefined') {
            const courses = StateGetters.getCourses();
            const course = courses.find(c => c.code === courseCode);
            if (course && typeof VisualizationModule !== 'undefined') {
                VisualizationModule.showCourseDetailsModal(course);
                return;
            }
        }
        // Fallback to prerequisites module
        if (typeof PrerequisitesModule !== 'undefined') {
            PrerequisitesModule.showCourseDetails(courseCode);
        }
    },

    /**
     * Clear recently viewed courses
     */
    clearRecentlyViewed: () => {
        localStorage.removeItem(UXEnhancements.RECENT_COURSES_KEY);
        UXEnhancements.renderRecentlyViewed();
    }
};

// Make UXEnhancements available globally
window.UXEnhancements = UXEnhancements;
