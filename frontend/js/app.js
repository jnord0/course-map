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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}