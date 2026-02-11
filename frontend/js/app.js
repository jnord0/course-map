// Main Application Entry Point

const App = {
    /**
     * Initialize the application
     */
    init: async () => {
        console.log('Champlain Academic Affairs System - Initializing...');

        // Load course data from JSON
        await DataLoader.loadData();

        // Initialize course management module
        CoursesModule.init();

        // Setup event listeners
        App.setupLoginListeners();
        App.setupModalListeners();

        // Setup modal click-outside functionality
        ModalsModule.setupModalListeners();

        console.log('Application initialized successfully');
    },
    
    /**
     * Setup login page event listeners
     */
    setupLoginListeners: () => {
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        loginButton.addEventListener('click', App.handleLogin);
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') App.handleLogin();
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') App.handleLogin();
        });
    },
    
    /**
     * Handle login
     */
    handleLogin: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        const result = Auth.login(username, password);
        
        if (result.success) {
            document.getElementById('currentUser').textContent = 
                username.charAt(0).toUpperCase() + username.slice(1);
            document.getElementById('currentRole').textContent = StateGetters.getCurrentRole();
            
            App.setupRoleBasedAccess();
            
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            setTimeout(() => VisualizationModule.init(), 200);

            // Show keyboard shortcuts hint and render recently viewed
            if (typeof UXEnhancements !== 'undefined') {
                UXEnhancements.showShortcutsHint();
                UXEnhancements.renderRecentlyViewed();
            }

            // Initialize skill packs sidebar in main app
            if (typeof SkillPacksModule !== 'undefined') {
                SkillPacksModule.initMainApp();
            }

            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = result.error;
        }
    },
    
    /**
     * Handle logout
     */
    handleLogout: () => {
        Auth.logout();
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        // Hide keyboard shortcuts hint
        if (typeof UXEnhancements !== 'undefined') {
            UXEnhancements.hideShortcutsHint();
        }
        // Scroll back to top of landing page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    /**
     * Setup role-based access and UI
     */
    setupRoleBasedAccess: () => {
        document.getElementById('adminSection').classList.add('hidden');
        document.getElementById('facultySection').classList.add('hidden');
        
        if (Auth.isAdmin()) {
            document.getElementById('adminSection').classList.remove('hidden');
            ProposalsModule.updatePendingBadge();
        } else if (Auth.isFaculty()) {
            document.getElementById('facultySection').classList.remove('hidden');
        }
        
        // Always show competency tracker and course selection
        CoursesModule.updateAvailableCourses();
        CoursesModule.updateSelectedCourses();
        CompetenciesModule.updateTracker();

        // Initialize advanced filters
        if (typeof FilterModule !== 'undefined') {
            FilterModule.initializeFilterUI();
        }

        // Update stats
        App.updateStats();

        // Attach search listener
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                CoursesModule.updateAvailableCourses(e.target.value);
            });
        }
        
        // Setup main app button listeners after login
        setTimeout(() => {
            App.setupMainAppListeners();
        }, 100);
    },
    
    /**
     * Update system overview stats
     */
    updateStats: () => {
        // Stats are now managed by individual modules (e.g., SemesterPlannerUI)
        // This function is kept for compatibility but no longer updates DOM directly
    },
    
    /**
     * Setup main application event listeners
     */
    setupMainAppListeners: () => {
        // Logout
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', App.handleLogout);
        }
        
        // Faculty buttons
        const submitProposalBtn = document.getElementById('submitProposalBtn');
        const myProposalsBtn = document.getElementById('myProposalsBtn');
        
        if (submitProposalBtn) {
            submitProposalBtn.addEventListener('click', ModalsModule.openProposalModal);
        }
        if (myProposalsBtn) {
            myProposalsBtn.addEventListener('click', ProposalsModule.showMyProposals);
        }
        
        // Admin buttons
        const reviewBtn = document.getElementById('reviewProposalsBtn');
        const manageBtn = document.getElementById('manageCoursesBtn');
        
        if (reviewBtn) {
            reviewBtn.addEventListener('click', ProposalsModule.showReviewModal);
        }
        if (manageBtn) {
            manageBtn.addEventListener('click', CoursesModule.showManageModal);
        }

        // Semester Planner button
        const semesterPlannerBtn = document.getElementById('semesterPlannerBtn');
        if (semesterPlannerBtn) {
            semesterPlannerBtn.addEventListener('click', () => {
                SemesterPlannerUI.openPlanner();
            });
        }

        // Update quick view on page load
        if (typeof SemesterPlannerUI !== 'undefined') {
            SemesterPlannerUI.updateQuickView();
        }
    },
    
    /**
     * Setup modal event listeners
     */
    setupModalListeners: () => {
        // Close buttons
        document.getElementById('closeProposalBtn').addEventListener('click', ModalsModule.closeProposalModal);
        document.getElementById('closeReviewBtn').addEventListener('click', ModalsModule.closeReviewModal);
        document.getElementById('closeMyProposalsBtn').addEventListener('click', ModalsModule.closeMyProposalsModal);
        document.getElementById('closeDetailsBtn').addEventListener('click', ModalsModule.closeDetailsModal);
        document.getElementById('closeManageBtn').addEventListener('click', ModalsModule.closeManageModal);
        document.getElementById('closeEditCourseBtn').addEventListener('click', ModalsModule.closeEditCourseModal);
        document.getElementById('closeSemesterPlannerBtn').addEventListener('click', () => {
            SemesterPlannerUI.closePlanner();
        });

        // Semester Planner action buttons
        const clearScheduleBtn = document.getElementById('clearScheduleBtn');
        const exportScheduleBtn = document.getElementById('exportScheduleBtn');
        const schedulerSearchInput = document.getElementById('schedulerCourseSearch');

        if (clearScheduleBtn) {
            clearScheduleBtn.addEventListener('click', () => {
                SemesterPlannerUI.clearSchedule();
            });
        }

        if (exportScheduleBtn) {
            exportScheduleBtn.addEventListener('click', () => {
                SemesterPlannerUI.exportSchedule();
            });
        }

        if (schedulerSearchInput) {
            schedulerSearchInput.addEventListener('input', (e) => {
                SemesterPlannerUI.searchSchedulerCourses(e.target.value);
            });
        }

        // Timeline progression buttons
        const playProgressionBtn = document.getElementById('playProgressionBtn');
        const stopProgressionBtn = document.getElementById('stopProgressionBtn');

        if (playProgressionBtn) {
            playProgressionBtn.addEventListener('click', () => {
                if (typeof SemesterPlannerUI !== 'undefined' && typeof SemesterPlannerUI.renderTimelineAndCompetencies === 'function') {
                    // Re-render with fresh animation
                    SemesterPlannerUI.renderTimelineAndCompetencies();
                }
                playProgressionBtn.classList.add('hidden');
                if (stopProgressionBtn) stopProgressionBtn.classList.remove('hidden');
            });
        }

        if (stopProgressionBtn) {
            stopProgressionBtn.addEventListener('click', () => {
                stopProgressionBtn.classList.add('hidden');
                if (playProgressionBtn) playProgressionBtn.classList.remove('hidden');
            });
        }

        // Add course button in manage modal
        document.getElementById('addCourseBtn').addEventListener('click', () => {
            CoursesModule.showEditModal(null);
        });
        
        // Form submissions
        document.getElementById('proposalForm').addEventListener('submit', ProposalsModule.submitProposal);
        document.getElementById('editCourseForm').addEventListener('submit', CoursesModule.saveCourse);
    }
};

/**
 * Quick login function for landing page role buttons
 * @param {string} role - The role to login as (student, faculty, admin)
 */
function quickLogin(role) {
    // Set the credentials based on role
    document.getElementById('username').value = role;
    document.getElementById('password').value = 'password';

    // Trigger the login
    App.handleLogin();
}

/**
 * Landing Page Animations Module
 * Handles scroll-triggered animations and counter effects
 */
const LandingAnimations = {
    /**
     * Initialize all landing page animations
     */
    init: () => {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Still show elements, just without animation
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                el.classList.add('animated');
            });
            return;
        }

        LandingAnimations.setupScrollAnimations();
        LandingAnimations.setupCounterAnimation();
        LandingAnimations.addAnimationClasses();
    },

    /**
     * Add animation classes to elements
     */
    addAnimationClasses: () => {
        // About section - feature cards with staggered delays
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.classList.add('animate-on-scroll', `delay-${(index % 4) + 1}`);
        });

        // Competency cards with staggered delays
        const competencyCards = document.querySelectorAll('.competency-card');
        competencyCards.forEach((card, index) => {
            card.classList.add('animate-on-scroll', `delay-${(index % 6) + 1}`);
        });

        // Visualization feature cards
        const vizCards = document.querySelectorAll('.viz-feature-card');
        vizCards.forEach((card, index) => {
            card.classList.add('animate-on-scroll', `delay-${(index % 6) + 1}`);
        });

        // Section headers
        const aboutHeader = document.querySelector('.about-header');
        if (aboutHeader) aboutHeader.classList.add('animate-on-scroll', 'from-left');

        const compHeader = document.querySelector('.competencies-header');
        if (compHeader) compHeader.classList.add('animate-on-scroll', 'from-left');

        const vizHeader = document.querySelector('.visualizations-header');
        if (vizHeader) vizHeader.classList.add('animate-on-scroll', 'from-left');

        // Weight legend items
        const weightItems = document.querySelectorAll('.weight-item');
        weightItems.forEach((item, index) => {
            item.classList.add('animate-on-scroll', `delay-${index + 1}`);
        });

        // CTA sections
        const visualizationsCta = document.querySelector('.visualizations-cta');
        if (visualizationsCta) visualizationsCta.classList.add('animate-on-scroll');
    },

    /**
     * Setup Intersection Observer for scroll-triggered animations
     */
    setupScrollAnimations: () => {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Optionally unobserve after animation
                    // observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements after a short delay to allow class additions
        setTimeout(() => {
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                observer.observe(el);
            });
        }, 100);
    },

    /**
     * Setup counter animation for hero stats
     */
    setupCounterAnimation: () => {
        const statNumbers = document.querySelectorAll('.hero-stat .stat-number');

        const observerOptions = {
            root: null,
            threshold: 0.5
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    LandingAnimations.animateCounter(entry.target);
                }
            });
        }, observerOptions);

        statNumbers.forEach(stat => {
            counterObserver.observe(stat);
        });
    },

    /**
     * Animate a counter element
     */
    animateCounter: (element) => {
        const text = element.textContent;
        const hasPlus = text.includes('+');
        const targetNumber = parseInt(text.replace(/\D/g, ''), 10);

        if (isNaN(targetNumber)) return;

        const duration = 1500; // 1.5 seconds
        const steps = 30;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const easeOutQuad = (t) => t * (2 - t);

        const updateCounter = () => {
            currentStep++;
            const progress = easeOutQuad(currentStep / steps);
            const currentValue = Math.round(targetNumber * progress);

            element.textContent = currentValue + (hasPlus ? '+' : '');
            element.classList.add('counting');

            setTimeout(() => {
                element.classList.remove('counting');
            }, 50);

            if (currentStep < steps) {
                setTimeout(updateCounter, stepDuration);
            } else {
                element.textContent = text; // Restore original text
            }
        };

        // Start from 0
        element.textContent = '0' + (hasPlus ? '+' : '');
        setTimeout(updateCounter, stepDuration);
    }
};

// Initialize app when DOM is ready
async function initializeApp() {
    LandingAnimations.init();
    UXEnhancements.init();
    if (typeof SkillPacksModule !== 'undefined') {
        await SkillPacksModule.init();
    }
    App.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}