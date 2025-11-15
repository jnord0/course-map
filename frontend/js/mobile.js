/**
 * Mobile Responsiveness Module
 * Handles mobile-specific interactions and responsive behavior
 */

window.MobileModule = {
    // State
    isMobile: false,
    sidebarOpen: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,

    /**
     * Initialize mobile responsiveness features
     */
    init() {
        console.log('MobileModule: Initializing mobile responsiveness features');

        // Detect if device is mobile
        this.detectMobileDevice();

        // Add mobile menu toggle button
        this.addMobileMenuToggle();

        // Setup touch gestures for modals
        this.setupModalSwipeGestures();

        // Setup responsive event listeners
        this.setupResponsiveListeners();

        // Apply mobile-specific styling
        this.applyMobileStyling();

        // Add touch controls for visualization
        this.addTouchControls();

        // Improve modal responsiveness
        this.improveModalResponsiveness();

        console.log('MobileModule: Initialization complete');
    },

    /**
     * Detect if the current device is mobile
     */
    detectMobileDevice() {
        this.isMobile = window.innerWidth <= 768;

        // Update on resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;

            // If transitioning to/from mobile, update UI
            if (wasMobile !== this.isMobile) {
                this.handleResponsiveChange();
            }
        });
    },

    /**
     * Add mobile menu toggle button
     */
    addMobileMenuToggle() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Check if toggle already exists
        if (document.getElementById('mobileMenuToggle')) return;

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobileMenuToggle';
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Toggle Menu');

        // Insert at the beginning of header
        const logoSection = header.querySelector('.logo-section');
        if (logoSection) {
            header.insertBefore(toggleBtn, logoSection);
        } else {
            header.insertBefore(toggleBtn, header.firstChild);
        }

        // Add click event
        toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Set initial state based on screen size
        if (this.isMobile) {
            this.closeSidebar();
        }
    },

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        if (this.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },

    /**
     * Open sidebar
     */
    openSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.getElementById('mobileMenuToggle');

        if (!sidebar) return;

        sidebar.classList.add('sidebar-open');
        sidebar.classList.remove('sidebar-closed');
        this.sidebarOpen = true;

        if (toggleBtn) {
            toggleBtn.innerHTML = '✕';
            toggleBtn.setAttribute('aria-label', 'Close Menu');
        }

        // Add overlay
        this.addSidebarOverlay();
    },

    /**
     * Close sidebar
     */
    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.getElementById('mobileMenuToggle');

        if (!sidebar) return;

        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        this.sidebarOpen = false;

        if (toggleBtn) {
            toggleBtn.innerHTML = '☰';
            toggleBtn.setAttribute('aria-label', 'Open Menu');
        }

        // Remove overlay
        this.removeSidebarOverlay();
    },

    /**
     * Add overlay when sidebar is open on mobile
     */
    addSidebarOverlay() {
        if (!this.isMobile) return;

        // Check if overlay already exists
        if (document.getElementById('sidebarOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    },

    /**
     * Remove sidebar overlay
     */
    removeSidebarOverlay() {
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Setup swipe gestures for modals
     */
    setupModalSwipeGestures() {
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) return;

            // Touch start
            modalContent.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                this.touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            // Touch end
            modalContent.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.touchEndY = e.changedTouches[0].screenY;
                this.handleModalSwipe(modal);
            }, { passive: true });
        });
    },

    /**
     * Handle modal swipe gesture
     */
    handleModalSwipe(modal) {
        const swipeThreshold = 100;
        const swipeDistanceX = this.touchEndX - this.touchStartX;
        const swipeDistanceY = this.touchEndY - this.touchStartY;

        // Swipe down to close
        if (swipeDistanceY > swipeThreshold && Math.abs(swipeDistanceX) < swipeThreshold) {
            // Close the modal
            modal.style.display = 'none';
        }
    },

    /**
     * Setup responsive event listeners
     */
    setupResponsiveListeners() {
        // Make buttons more touch-friendly
        const buttons = document.querySelectorAll('.btn, .action-btn, .toggle-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });

            btn.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResponsiveChange();
            }, 100);
        });
    },

    /**
     * Handle responsive changes (e.g., orientation change, resize)
     */
    handleResponsiveChange() {
        if (this.isMobile) {
            // Apply mobile optimizations
            this.closeSidebar();
            this.optimizeTableForMobile();
        } else {
            // Remove mobile-specific styling
            this.removeSidebarOverlay();
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('sidebar-open', 'sidebar-closed');
            }
        }
    },

    /**
     * Apply mobile-specific styling
     */
    applyMobileStyling() {
        if (!this.isMobile) return;

        // Add mobile class to body
        document.body.classList.add('mobile-device');

        // Optimize table view for mobile
        this.optimizeTableForMobile();
    },

    /**
     * Optimize table view for mobile devices
     */
    optimizeTableForMobile() {
        if (!this.isMobile) return;

        const tableView = document.getElementById('tableView');
        if (!tableView) return;

        // Add mobile-friendly scrolling hint
        const table = tableView.querySelector('.competency-table');
        if (table && !table.dataset.mobileOptimized) {
            table.dataset.mobileOptimized = 'true';

            // Add scroll hint
            const scrollHint = document.createElement('div');
            scrollHint.className = 'mobile-scroll-hint';
            scrollHint.innerHTML = '← Swipe to see more →';
            scrollHint.style.cssText = `
                text-align: center;
                padding: 8px;
                background: #fffacd;
                color: #856404;
                font-size: 12px;
                font-weight: 600;
                border-radius: 4px;
                margin-bottom: 10px;
            `;

            const tableContainer = tableView.querySelector('.table-container');
            if (tableContainer && !tableView.querySelector('.mobile-scroll-hint')) {
                tableContainer.parentNode.insertBefore(scrollHint, tableContainer);

                // Remove hint after first scroll
                tableContainer.addEventListener('scroll', function removeHint() {
                    scrollHint.style.display = 'none';
                    tableContainer.removeEventListener('scroll', removeHint);
                }, { once: true });
            }
        }
    },

    /**
     * Add touch-friendly visualization controls
     */
    addTouchControls() {
        const networkView = document.getElementById('networkView');
        if (!networkView) return;

        // Add pinch-to-zoom support for SVG
        const svg = networkView.querySelector('svg');
        if (!svg) return;

        let initialDistance = 0;
        let currentScale = 1;

        svg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            }
        }, { passive: false });

        svg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                const scale = currentDistance / initialDistance;
                currentScale *= scale;
                currentScale = Math.min(Math.max(0.5, currentScale), 3); // Limit scale between 0.5 and 3

                svg.style.transform = `scale(${currentScale})`;
                initialDistance = currentDistance;
            }
        }, { passive: false });
    },

    /**
     * Improve modal responsiveness
     */
    improveModalResponsiveness() {
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) return;

            // Add touch indicator for swipe-to-close
            if (this.isMobile && !modalContent.querySelector('.swipe-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'swipe-indicator';
                indicator.innerHTML = '─';
                indicator.style.cssText = `
                    text-align: center;
                    color: #ccc;
                    font-size: 24px;
                    padding: 5px;
                    cursor: grab;
                `;

                const modalHeader = modalContent.querySelector('.modal-header');
                if (modalHeader) {
                    modalHeader.insertBefore(indicator, modalHeader.firstChild);
                }
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileModule.init();
    });
} else {
    MobileModule.init();
}
