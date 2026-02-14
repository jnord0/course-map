// Main Application Entry Point

/**
 * Dashboard Module
 * Handles the post-login dashboard navigation page
 */
const Dashboard = {
    /**
     * Show the dashboard and configure role-based cards
     */
    show: (username) => {
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        const role = StateGetters.getCurrentRole();

        // Update dashboard header
        document.getElementById('dashboardUser').textContent = displayName;
        document.getElementById('dashboardRole').textContent = role;
        document.getElementById('dashboardGreetName').textContent = displayName;

        // Time-of-day greeting
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        document.getElementById('dashboardGreeting').textContent = greeting;

        // Populate quick stats
        Dashboard._updateStats();

        // Show/hide role-based cards and quick actions
        document.querySelectorAll('.dashboard-faculty-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.dashboard-admin-only').forEach(el => el.classList.add('hidden'));

        if (Auth.isAdmin()) {
            document.querySelectorAll('.dashboard-faculty-only').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.dashboard-admin-only').forEach(el => el.classList.remove('hidden'));
        } else if (Auth.isFaculty()) {
            document.querySelectorAll('.dashboard-faculty-only').forEach(el => el.classList.remove('hidden'));
        }

        // Transition pages - hide all, show dashboard
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('competenciesPage').classList.add('hidden');
        document.getElementById('skillPacksPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Populate the dashboard stats bar with live data
     */
    _updateStats: () => {
        // Course count
        const courses = StateGetters.getCourses ? StateGetters.getCourses() : [];
        const courseCount = Array.isArray(courses) ? courses.length : 0;
        const courseEl = document.getElementById('statCourseCount');
        if (courseEl) courseEl.textContent = courseCount || '--';

        // Proposal count (role-sensitive)
        const proposals = StateGetters.getProposals ? StateGetters.getProposals() : [];
        const proposalEl = document.getElementById('statProposalCount');
        const proposalLabel = document.getElementById('statProposalLabel');
        if (proposalEl && proposals) {
            if (Auth.isAdmin()) {
                const pending = proposals.filter(p => p.status === 'pending');
                proposalEl.textContent = pending.length;
                if (proposalLabel) proposalLabel.textContent = 'Pending Reviews';
            } else if (Auth.isFaculty()) {
                const user = StateGetters.getCurrentUser();
                const mine = proposals.filter(p => p.submittedBy === user);
                proposalEl.textContent = mine.length;
                if (proposalLabel) proposalLabel.textContent = 'My Proposals';
            } else {
                // Student - show total approved
                const approved = proposals.filter(p => p.status === 'approved');
                proposalEl.textContent = approved.length;
                if (proposalLabel) proposalLabel.textContent = 'Approved Courses';
            }
        }

        // Skill pack count
        const skillPackEl = document.getElementById('statSkillPackCount');
        if (skillPackEl) {
            const packs = (typeof SkillPacksModule !== 'undefined' && SkillPacksModule.skillPacks)
                ? SkillPacksModule.skillPacks : [];
            skillPackEl.textContent = Array.isArray(packs) && packs.length > 0 ? packs.length : '--';
        }
    },

    /**
     * Navigate to the main app and optionally switch to a specific view
     * @param {string} view - The view to activate (network, graphs, semester, skillpacks)
     */
    goToMainApp: (view) => {
        // Hide all pages, show main app
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('competenciesPage').classList.add('hidden');
        document.getElementById('skillPacksPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        // Ensure main app is set up
        if (!Dashboard._mainAppInitialized) {
            App.setupRoleBasedAccess();
            Dashboard._mainAppInitialized = true;
        }

        // Update the main app header info
        const username = StateGetters.getCurrentUser();
        if (username) {
            document.getElementById('currentUser').textContent =
                username.charAt(0).toUpperCase() + username.slice(1);
            document.getElementById('currentRole').textContent = StateGetters.getCurrentRole();
        }

        // Initialize visualization if needed
        setTimeout(() => {
            if (typeof VisualizationModule !== 'undefined') {
                VisualizationModule.init();
            }

            // Switch to the requested view
            Dashboard._switchView(view);

            // Initialize skill packs sidebar
            if (typeof SkillPacksModule !== 'undefined') {
                SkillPacksModule.initMainApp();
            }

            // Show keyboard shortcuts hint
            if (typeof UXEnhancements !== 'undefined') {
                UXEnhancements.showShortcutsHint();
                UXEnhancements.renderRecentlyViewed();
            }
        }, 200);
    },

    /**
     * Switch to a specific visualization view
     */
    _switchView: (view) => {
        if (!view) return;

        // Map dashboard sections to view button IDs
        const viewMap = {
            'network': 'networkViewBtn',
            'graphs': 'graphsViewBtn',
            'semester': 'semesterPlannerBtn',
            'skillpacks': null // handled separately
        };

        const btnId = viewMap[view];
        if (btnId) {
            const btn = document.getElementById(btnId);
            if (btn) btn.click();
        }
    },

    /**
     * Open proposal-related modals from dashboard
     */
    openProposals: () => {
        Dashboard.goToMainApp('network');
        // After main app loads, open proposal modal
        setTimeout(() => {
            if (Auth.isAdmin()) {
                ProposalsModule.showReviewModal();
            } else if (Auth.isFaculty()) {
                ModalsModule.openProposalModal();
            }
        }, 400);
    },

    /**
     * Open admin management from dashboard
     */
    openAdmin: () => {
        Dashboard.goToMainApp('network');
        // After main app loads, open manage modal
        setTimeout(() => {
            CoursesModule.showManageModal();
        }, 400);
    },

    /**
     * Show the competencies info page
     */
    showCompetencies: () => {
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('competenciesPage').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Show the skill packs browsing page
     */
    showSkillPacks: () => {
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('skillPacksPage').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Initialize skill packs on this page if available
        if (typeof SkillPacksModule !== 'undefined') {
            SkillPacksModule.initStandalonePage();
        }
    },

    /**
     * Go back to dashboard from any sub-page
     */
    backToDashboard: () => {
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('competenciesPage').classList.add('hidden');
        document.getElementById('skillPacksPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Hide keyboard shortcuts hint
        if (typeof UXEnhancements !== 'undefined') {
            UXEnhancements.hideShortcutsHint();
        }
    },

    _mainAppInitialized: false
};

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
        App.setupDashboardListeners();

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
     * Setup dashboard event listeners
     */
    setupDashboardListeners: () => {
        const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
        if (dashboardLogoutBtn) {
            dashboardLogoutBtn.addEventListener('click', App.handleLogout);
        }

        const backBtn = document.getElementById('backToDashboardBtn');
        if (backBtn) {
            backBtn.addEventListener('click', Dashboard.backToDashboard);
        }
    },

    /**
     * Handle login - now goes to dashboard instead of main app
     */
    handleLogin: () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        const result = Auth.login(username, password);

        if (result.success) {
            Dashboard.show(username);
            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = result.error;
        }
    },

    /**
     * Handle logout - returns to landing page
     */
    handleLogout: () => {
        Auth.logout();
        Dashboard._mainAppInitialized = false;

        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('competenciesPage').classList.add('hidden');
        document.getElementById('skillPacksPage').classList.add('hidden');
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

/**
 * Renders a decorative mini bipartite graph in the landing page preview section
 */
function renderLandingPreviewGraph() {
    const container = document.getElementById('landingPreviewGraph');
    if (!container || typeof d3 === 'undefined') return;

    const width = container.clientWidth || 900;
    const height = 340;

    const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Sample course and competency nodes
    const courses = [
        { id: 'CSI-160', label: 'CSI-160' },
        { id: 'CSI-260', label: 'CSI-260' },
        { id: 'CSI-300', label: 'CSI-300' },
        { id: 'CSI-340', label: 'CSI-340' },
        { id: 'CSI-440', label: 'CSI-440' },
    ];
    const competencies = [
        { id: 'Analysis', color: '#E52019' },
        { id: 'Communication', color: '#FFDD00' },
        { id: 'Collaboration', color: '#F7931E' },
        { id: 'Inquiry', color: '#3C8DAD' },
        { id: 'Creativity', color: '#C4D82D' },
        { id: 'Integration', color: '#7B4FD0' },
    ];

    // Edges (course -> competency with weight)
    const edges = [
        { s: 0, t: 0, w: 3 }, { s: 0, t: 3, w: 2 },
        { s: 1, t: 0, w: 2 }, { s: 1, t: 1, w: 3 }, { s: 1, t: 4, w: 1 },
        { s: 2, t: 1, w: 2 }, { s: 2, t: 2, w: 3 }, { s: 2, t: 5, w: 2 },
        { s: 3, t: 0, w: 3 }, { s: 3, t: 3, w: 3 }, { s: 3, t: 5, w: 1 },
        { s: 4, t: 1, w: 2 }, { s: 4, t: 2, w: 2 }, { s: 4, t: 4, w: 3 }, { s: 4, t: 5, w: 3 },
    ];

    const leftX = width * 0.22;
    const rightX = width * 0.78;
    const courseSpacing = (height - 60) / (courses.length - 1);
    const compSpacing = (height - 60) / (competencies.length - 1);

    courses.forEach((c, i) => { c.x = leftX; c.y = 30 + i * courseSpacing; });
    competencies.forEach((c, i) => { c.x = rightX; c.y = 30 + i * compSpacing; });

    // Draw edges with animation
    edges.forEach((e, i) => {
        const s = courses[e.s];
        const t = competencies[e.t];
        const line = svg.append('line')
            .attr('x1', s.x).attr('y1', s.y)
            .attr('x2', s.x).attr('y2', s.y)
            .attr('stroke', t.color)
            .attr('stroke-width', e.w * 0.8)
            .attr('stroke-opacity', 0.25);

        line.transition()
            .delay(300 + i * 60)
            .duration(600)
            .ease(d3.easeCubicOut)
            .attr('x2', t.x).attr('y2', t.y);
    });

    // Draw course nodes
    courses.forEach((c, i) => {
        const g = svg.append('g').attr('transform', `translate(${c.x}, ${c.y})`).style('opacity', 0);
        g.append('circle').attr('r', 22).attr('fill', '#003C5F').attr('stroke', 'white').attr('stroke-width', 2);
        g.append('text').text(c.label).attr('text-anchor', 'middle').attr('dy', '0.35em')
            .attr('fill', 'white').attr('font-size', '9px').attr('font-weight', '700');
        g.transition().delay(200 + i * 80).duration(400).style('opacity', 1);
    });

    // Draw competency nodes
    competencies.forEach((c, i) => {
        const g = svg.append('g').attr('transform', `translate(${c.x}, ${c.y})`).style('opacity', 0);
        g.append('circle').attr('r', 22).attr('fill', c.color).attr('stroke', 'white').attr('stroke-width', 2);
        g.append('text').text(c.id.substring(0, 6)).attr('text-anchor', 'middle').attr('dy', '0.35em')
            .attr('fill', 'white').attr('font-size', '8px').attr('font-weight', '700');
        g.transition().delay(400 + i * 80).duration(400).style('opacity', 1);
    });

    // Column labels
    svg.append('text').text('Courses').attr('x', leftX).attr('y', height - 4)
        .attr('text-anchor', 'middle').attr('fill', '#003C5F').attr('font-size', '12px')
        .attr('font-weight', '700').attr('opacity', 0.5);
    svg.append('text').text('Competencies').attr('x', rightX).attr('y', height - 4)
        .attr('text-anchor', 'middle').attr('fill', '#003C5F').attr('font-size', '12px')
        .attr('font-weight', '700').attr('opacity', 0.5);
}

// Initialize app when DOM is ready
async function initializeApp() {
    LandingAnimations.init();
    UXEnhancements.init();
    renderLandingPreviewGraph();
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
