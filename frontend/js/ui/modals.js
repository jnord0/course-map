// Modals Management Module

const ModalsModule = {
    /**
     * Open proposal submission modal
     */
    openProposalModal: () => {
        // Initialize form if not already done
        if (!ProposalsModule._formInitialized) {
            ProposalsModule.initializeForm();
            ProposalsModule._formInitialized = true;
        }

        // Reset form to initial state
        ProposalsModule.resetForm();

        document.getElementById('proposalModal').style.display = 'block';
    },

    /**
     * Close proposal submission modal
     */
    closeProposalModal: () => {
        document.getElementById('proposalModal').style.display = 'none';
        ProposalsModule.currentProposalId = null;
        document.getElementById('submitProposal').textContent = 'Submit Proposal';
    },
    
    /**
     * Close review modal
     */
    closeReviewModal: () => {
        document.getElementById('reviewModal').style.display = 'none';
    },
    
    /**
     * Close my proposals modal
     */
    closeMyProposalsModal: () => {
        document.getElementById('myProposalsModal').style.display = 'none';
    },
    
    /**
     * Close details modal
     */
    closeDetailsModal: () => {
        document.getElementById('detailsModal').style.display = 'none';
    },
    
    /**
     * Close manage courses modal
     */
    closeManageModal: () => {
        document.getElementById('manageModal').style.display = 'none';
    },
    
    /**
     * Close edit course modal
     */
    closeEditCourseModal: () => {
        document.getElementById('editCourseModal').style.display = 'none';
        StateSetters.clearEditingCourse();
    },
    
    /**
     * Close all open modals. Called during page navigation to prevent
     * modals from persisting across page transitions.
     */
    closeAllModals: () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        // Also close comparison and shortcuts modals
        const comparison = document.getElementById('comparisonModal');
        if (comparison) comparison.style.display = 'none';
        const shortcuts = document.getElementById('shortcutsModal');
        if (shortcuts) shortcuts.style.display = 'none';
    },

    /**
     * Setup modal click-outside-to-close functionality
     */
    setupModalListeners: () => {
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };
    }
};