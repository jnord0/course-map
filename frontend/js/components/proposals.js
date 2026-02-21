// Proposals Management Component

const ProposalsModule = {
    currentProposalId: null,
    currentTab: 0,
    tabs: ['identity', 'outcomes', 'content', 'resources'],
    _formInitialized: false,

    /**
     * Initialize proposal form interactions
     */
    initializeForm: () => {
        // Tab navigation
        document.querySelectorAll('.proposal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                ProposalsModule.switchTab(tabName);
            });
        });

        // Previous/Next buttons
        document.getElementById('prevTab').addEventListener('click', () => {
            if (ProposalsModule.currentTab > 0) {
                ProposalsModule.currentTab--;
                ProposalsModule.switchTab(ProposalsModule.tabs[ProposalsModule.currentTab]);
            }
        });

        document.getElementById('nextTab').addEventListener('click', () => {
            if (ProposalsModule.currentTab < ProposalsModule.tabs.length - 1) {
                if (ProposalsModule.validateCurrentTab()) {
                    ProposalsModule.currentTab++;
                    ProposalsModule.switchTab(ProposalsModule.tabs[ProposalsModule.currentTab]);
                }
            }
        });

        // Dynamic CLO add/remove
        document.getElementById('addCLO').addEventListener('click', ProposalsModule.addCLO);
        document.getElementById('closContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-clo')) {
                const items = document.querySelectorAll('.clo-item');
                if (items.length > 1) {
                    e.target.closest('.clo-item').remove();
                }
            }
        });

        // Dynamic PLO add/remove
        document.getElementById('addPLO').addEventListener('click', ProposalsModule.addPLO);
        document.getElementById('plosContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-plo')) {
                const items = document.querySelectorAll('.plo-item');
                if (items.length > 1) {
                    e.target.closest('.plo-item').remove();
                }
            }
        });

        // Dynamic Assessment add/remove
        document.getElementById('addAssessment').addEventListener('click', ProposalsModule.addAssessment);
        document.getElementById('assessmentsContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-assessment')) {
                const items = document.querySelectorAll('.assessment-item');
                if (items.length > 1) {
                    e.target.closest('.assessment-item').remove();
                }
            }
        });
    },

    /**
     * Switch between form tabs
     * @param {string} tabName
     */
    switchTab: (tabName) => {
        const tabIndex = ProposalsModule.tabs.indexOf(tabName);
        if (tabIndex === -1) return;

        ProposalsModule.currentTab = tabIndex;

        // Update tab buttons
        document.querySelectorAll('.proposal-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.style.background = 'var(--champlain-navy)';
                tab.style.color = 'white';
                tab.classList.add('active');
            } else {
                tab.style.background = '#f0f0f0';
                tab.style.color = '#666';
                tab.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.proposal-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        // Update progress indicator
        const progressSteps = document.querySelectorAll('.progress-step');
        progressSteps.forEach((step, index) => {
            if (index <= tabIndex) {
                step.style.background = 'white';
            } else {
                step.style.background = 'rgba(255,255,255,0.3)';
            }
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevTab');
        const nextBtn = document.getElementById('nextTab');
        const submitBtn = document.getElementById('submitProposal');

        prevBtn.style.display = tabIndex === 0 ? 'none' : 'block';

        if (tabIndex === ProposalsModule.tabs.length - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    },

    /**
     * Validate current tab before moving to next
     * @returns {boolean}
     */
    validateCurrentTab: () => {
        const currentTabElement = document.getElementById(`tab-${ProposalsModule.tabs[ProposalsModule.currentTab]}`);
        const requiredFields = currentTabElement.querySelectorAll('[required]');

        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                field.style.borderColor = '#f44336';
                setTimeout(() => {
                    field.style.borderColor = '';
                }, 2000);
                alert('Please fill in all required fields before continuing.');
                return false;
            }
        }

        // Special validation for competencies
        if (ProposalsModule.tabs[ProposalsModule.currentTab] === 'outcomes') {
            const hasCompetency = Array.from(document.querySelectorAll('.competency-weight-select'))
                .some(select => parseInt(select.value) > 0);

            if (!hasCompetency) {
                alert('Please select at least one college competency with a weight greater than 0.');
                return false;
            }
        }

        return true;
    },

    /**
     * Add a new CLO input field
     */
    addCLO: () => {
        const container = document.getElementById('closContainer');
        const newItem = document.createElement('div');
        newItem.className = 'clo-item';
        newItem.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;';
        newItem.innerHTML = `
            <input type="text" class="clo-input" placeholder="CLO description" style="flex: 1; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
            <button type="button" class="remove-clo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
        `;
        container.appendChild(newItem);
    },

    /**
     * Add a new PLO input field
     */
    addPLO: () => {
        const container = document.getElementById('plosContainer');
        const newItem = document.createElement('div');
        newItem.className = 'plo-item';
        newItem.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;';
        newItem.innerHTML = `
            <input type="text" class="plo-input" placeholder="PLO description" style="flex: 1; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
            <button type="button" class="remove-plo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
        `;
        container.appendChild(newItem);
    },

    /**
     * Add a new assessment field
     */
    addAssessment: () => {
        const container = document.getElementById('assessmentsContainer');
        const newItem = document.createElement('div');
        newItem.className = 'assessment-item';
        newItem.style.cssText = 'background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid var(--champlain-green);';
        newItem.innerHTML = `
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" class="assessment-name" placeholder="Assessment name" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 4px;">
                <button type="button" class="remove-assessment" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            <textarea class="assessment-desc" placeholder="Description and how it links to learning outcomes..." rows="2" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
        `;
        container.appendChild(newItem);
    },

    /**
     * Show my proposals modal
     */
    showMyProposals: (containerId = 'myProposalsList', showModal = true) => {
        const myProposals = StateGetters.getProposals().filter(p => p.submittedBy === StateGetters.getCurrentUser());
        const listDiv = document.getElementById(containerId);

        if (myProposals.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">No proposals submitted yet.</p>';
        } else {
            listDiv.innerHTML = myProposals.map(p => {
                const hasFeedback = p.feedback && p.feedback.length > 0;
                return `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <div class="proposal-title">${p.courseCode}: ${p.courseTitle}</div>
                            <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                        </div>
                        <div class="proposal-info">
                            Submitted: ${p.submittedDate}
                            ${hasFeedback ? `<span style="color: #FF9800; font-weight: bold; margin-left: 10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                        </div>
                        <div class="proposal-actions">
                            <button class="action-btn btn-view" onclick="ProposalsModule.viewDetails(${p.id})">View Details</button>
                            ${p.status === 'pending' ? `
                                <button class="action-btn" style="background: var(--champlain-blue);" onclick="ProposalsModule.editProposal(${p.id})">✏️ Edit</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (showModal) {
            document.getElementById('myProposalsModal').style.display = 'block';
        }
    },

    /**
     * Show proposal review modal (admin only)
     * @param {string} containerId - optional override for the list container element ID
     * @param {boolean} showModal - whether to show the modal overlay (default true)
     */
    showReviewModal: (containerId = 'proposalList', showModal = true) => {
        const pendingProposals = StateGetters.getProposals().filter(p => p.status === 'pending');
        const listDiv = document.getElementById(containerId);

        if (pendingProposals.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">No pending proposals.</p>';
        } else {
            listDiv.innerHTML = pendingProposals.map(p => {
                const hasFeedback = p.feedback && p.feedback.length > 0;
                return `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <div class="proposal-title">${p.courseCode}: ${p.courseTitle}</div>
                            <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                        </div>
                        <div class="proposal-info">
                            By: ${p.submittedBy} | ${p.submittedDate}
                            ${hasFeedback ? `<span style="color: #FF9800; font-weight: bold; margin-left: 10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                        </div>
                        <div class="proposal-actions">
                            <button class="action-btn btn-view" onclick="ProposalsModule.viewDetails(${p.id})">View</button>
                            <button class="action-btn" style="background: #FF9800;" onclick="ProposalsModule.sendFeedback(${p.id})">💬 Feedback</button>
                            <button class="action-btn btn-approve" onclick="ProposalsModule.approve(${p.id})">Approve</button>
                            <button class="action-btn btn-reject" onclick="ProposalsModule.rejectWithFeedback(${p.id})">Reject</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (showModal) {
            document.getElementById('reviewModal').style.display = 'block';
        }
    },

    /**
     * View proposal details
     * @param {number} id
     */
    viewDetails: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;

        // Store current proposal ID for export
        ProposalsModule.currentProposalId = id;

        // Build competencies display
        let competenciesDisplay = '';
        if (proposal.competencies) {
            competenciesDisplay = Object.entries(proposal.competencies)
                .filter(([key, weight]) => weight > 0)
                .map(([key, weight]) => {
                    const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
                    const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
                    return `${symbol} ${key} (${weightLabel})`;
                })
                .join(', ');
        }

        // Build feedback section
        let feedbackSection = '';
        if (proposal.feedback && proposal.feedback.length > 0) {
            feedbackSection = `
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                    <h4 style="color: #856404; margin-bottom: 10px; font-size: 16px;">💬 Feedback History</h4>
                    ${proposal.feedback.map(fb => `
                        <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ffc107;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                                <strong>${fb.from}</strong> - ${fb.date}
                            </div>
                            <div style="font-size: 14px; color: #333;">${fb.message}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Build CLOs display
        let closDisplay = proposal.clos && proposal.clos.length > 0
            ? proposal.clos.map((clo, i) => `<li>${clo}</li>`).join('')
            : '<li>Not specified</li>';

        // Build PLOs display
        let plosDisplay = proposal.plos && proposal.plos.length > 0
            ? proposal.plos.map((plo, i) => `<li>${plo}</li>`).join('')
            : '<li>Not specified</li>';

        // Build assessments display
        let assessmentsDisplay = '';
        if (proposal.assessments && proposal.assessments.length > 0) {
            assessmentsDisplay = proposal.assessments.map(a => `
                <div style="margin-bottom: 12px; padding: 12px; background: #f0f0f0; border-radius: 4px;">
                    <strong>${a.name}</strong>
                    <p style="margin: 6px 0 0 0; font-size: 14px;">${a.description}</p>
                </div>
            `).join('');
        } else {
            assessmentsDisplay = '<p>Not specified</p>';
        }

        document.getElementById('proposalDetails').innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--champlain-navy); margin-bottom: 15px;">${proposal.courseCode}: ${proposal.courseTitle}</h3>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h4 style="margin-top: 0;">Course Identity</h4>
                    <p style="margin-bottom: 8px;"><strong>Catalog Description:</strong> ${proposal.catalogDescription || proposal.description}</p>
                    <p style="margin-bottom: 8px;"><strong>Credits:</strong> ${proposal.creditHours}</p>
                    <p style="margin-bottom: 8px;"><strong>Course Type:</strong> ${proposal.courseType || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Capacity:</strong> ${proposal.capacity || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Semester Offered:</strong> ${proposal.semesterOffered || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Instructional Method:</strong> ${proposal.instructionalMethod || 'Standard'}</p>
                    <p style="margin-bottom: 8px;"><strong>Prerequisites:</strong> ${proposal.prerequisites || 'None'}</p>
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h4 style="margin-top: 0;">Learning Outcomes</h4>
                    <p><strong>Course Learning Outcomes (CLOs):</strong></p>
                    <ul style="margin: 8px 0;">${closDisplay}</ul>
                    <p><strong>Program Learning Outcomes (PLOs):</strong></p>
                    <ul style="margin: 8px 0;">${plosDisplay}</ul>
                    <p style="margin-top: 12px;"><strong>Competencies:</strong> ${competenciesDisplay}</p>
                </div>

                <div style="background: #f3e5f5; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h4 style="margin-top: 0;">Course Content</h4>
                    <p><strong>Topical Outline:</strong></p>
                    <p style="white-space: pre-line; font-size: 14px;">${proposal.topicalOutline || 'Not specified'}</p>
                    <p style="margin-top: 12px;"><strong>Major Assessments:</strong></p>
                    ${assessmentsDisplay}
                    <p style="margin-top: 12px;"><strong>Justification:</strong> ${proposal.justification}</p>
                </div>

                <div style="background: #fff3e0; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h4 style="margin-top: 0;">Resources & Planning</h4>
                    <p style="margin-bottom: 8px;"><strong>Facility Type:</strong> ${proposal.facilityType || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Facility Requirements:</strong> ${proposal.facilityRequirements || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Technology:</strong> ${proposal.technologyRequirements || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Library Resources:</strong> ${proposal.libraryResources || 'Not specified'}</p>
                    <p style="margin-bottom: 8px;"><strong>Other Resources:</strong> ${proposal.otherResources || 'Not specified'}</p>
                </div>

                <p style="font-size: 13px; color: #666; margin-top: 20px;">Submitted by: ${proposal.submittedBy} | ${proposal.submittedDate}</p>
                ${feedbackSection}
            </div>
        `;

        document.getElementById('detailsModal').style.display = 'block';

        // Setup export button handler
        const exportBtn = document.getElementById('exportProposalBtn');
        if (exportBtn) {
            exportBtn.onclick = () => ProposalsModule.exportProposal(id);
        }
    },

    /**
     * Send feedback to faculty
     * @param {number} id
     */
    sendFeedback: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;

        const feedback = prompt(`Send feedback to ${proposal.submittedBy} about "${proposal.courseCode}":\n\n(Faculty will be able to revise their proposal based on your feedback)`);

        if (feedback && feedback.trim() !== '') {
            StateSetters.addProposalFeedback(id, feedback.trim());
            ProposalsModule.showReviewModal();
            // Also refresh proposals page list if it is currently visible
            const proposalsPage = document.getElementById('proposalsPage');
            if (proposalsPage && !proposalsPage.classList.contains('hidden')) {
                ProposalsModule.showReviewModal('pg-proposalList', false);
            }
            alert('Feedback sent successfully! Faculty member will be notified.');
        }
    },

    /**
     * Reject with feedback
     * @param {number} id
     */
    rejectWithFeedback: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;

        const feedback = prompt(`Please provide feedback for rejection of "${proposal.courseCode}":\n\n(This will help faculty understand why the proposal was not approved)`);

        if (feedback === null) return; // User cancelled

        if (feedback && feedback.trim() !== '') {
            StateSetters.addProposalFeedback(id, `[REJECTION] ${feedback.trim()}`);
        }

        if (confirm('Are you sure you want to reject this proposal?')) {
            StateSetters.updateProposalStatus(id, 'rejected');
            ProposalsModule.updatePendingBadge();
            ProposalsModule.showReviewModal();
            // Also refresh proposals page list if it is currently visible
            const proposalsPage = document.getElementById('proposalsPage');
            if (proposalsPage && !proposalsPage.classList.contains('hidden')) {
                ProposalsModule.showReviewModal('pg-proposalList', false);
            }
            alert('Proposal rejected with feedback.');
        }
    },

    /**
     * Edit proposal (faculty only)
     * @param {number} id
     */
    editProposal: (id) => {
        const proposal = StateGetters.getProposals().find(p => p.id === id);
        if (!proposal) return;

        ProposalsModule.currentProposalId = id;

        // Populate Tab 1: Course Identity
        const courseCodeParts = proposal.courseCode.split('-');
        document.getElementById('coursePrefix').value = courseCodeParts[0] || '';
        document.getElementById('courseNumber').value = courseCodeParts[1] || '';
        document.getElementById('courseTitle').value = proposal.courseTitle || '';
        document.getElementById('catalogDescription').value = proposal.catalogDescription || proposal.description || '';
        document.getElementById('creditHours').value = proposal.creditHours || '';
        document.getElementById('courseType').value = proposal.courseType || '';
        document.getElementById('capacity').value = proposal.capacity || '';
        document.getElementById('semesterOffered').value = proposal.semesterOffered || '';
        document.getElementById('instructionalMethod').value = proposal.instructionalMethod || 'STANDARD';
        document.getElementById('prerequisites').value = proposal.prerequisites || '';

        // Populate Tab 2: Learning Outcomes
        // CLOs
        const closContainer = document.getElementById('closContainer');
        closContainer.innerHTML = '';
        if (proposal.clos && proposal.clos.length > 0) {
            proposal.clos.forEach(clo => {
                const item = document.createElement('div');
                item.className = 'clo-item';
                item.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;';
                item.innerHTML = `
                    <input type="text" class="clo-input" value="${clo}" style="flex: 1; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
                    <button type="button" class="remove-clo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                `;
                closContainer.appendChild(item);
            });
        } else {
            ProposalsModule.addCLO();
        }

        // PLOs
        const plosContainer = document.getElementById('plosContainer');
        plosContainer.innerHTML = '';
        if (proposal.plos && proposal.plos.length > 0) {
            proposal.plos.forEach(plo => {
                const item = document.createElement('div');
                item.className = 'plo-item';
                item.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;';
                item.innerHTML = `
                    <input type="text" class="plo-input" value="${plo}" style="flex: 1; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
                    <button type="button" class="remove-plo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                `;
                plosContainer.appendChild(item);
            });
        } else {
            ProposalsModule.addPLO();
        }

        // Competencies
        const competencyMap = {
            'Inquiry': 'comp_inquiry',
            'Integration': 'comp_integration',
            'GlobalCulturalAwareness': 'comp_global',
            'Global/Cultural Awareness': 'comp_global',
            'Analysis': 'comp_analysis',
            'DiversityEquityInclusion': 'comp_dei',
            'Diversity, Equity & Inclusion': 'comp_dei',
            'Communication': 'comp_communication',
            'Collaboration': 'comp_collaboration',
            'Creativity': 'comp_creativity',
            'EthicalReasoning': 'comp_ethical',
            'Ethical Reasoning': 'comp_ethical',
            'QuantitativeLiteracy': 'comp_quantitative',
            'Quantitative Literacy': 'comp_quantitative'
        };

        // Reset all competency selects
        document.querySelectorAll('.competency-weight-select').forEach(select => {
            select.value = '0';
        });

        // Set values from proposal
        if (proposal.competencies) {
            Object.entries(proposal.competencies).forEach(([key, weight]) => {
                const selectId = competencyMap[key];
                if (selectId) {
                    const select = document.getElementById(selectId);
                    if (select) {
                        select.value = weight;
                    }
                }
            });
        }

        // Populate Tab 3: Course Content
        document.getElementById('topicalOutline').value = proposal.topicalOutline || '';
        document.getElementById('justification').value = proposal.justification || '';

        // Assessments
        const assessmentsContainer = document.getElementById('assessmentsContainer');
        assessmentsContainer.innerHTML = '';
        if (proposal.assessments && proposal.assessments.length > 0) {
            proposal.assessments.forEach(assessment => {
                const item = document.createElement('div');
                item.className = 'assessment-item';
                item.style.cssText = 'background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid var(--champlain-green);';
                item.innerHTML = `
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="assessment-name" value="${assessment.name}" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 4px;">
                        <button type="button" class="remove-assessment" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                    <textarea class="assessment-desc" rows="2" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px; resize: vertical;">${assessment.description}</textarea>
                `;
                assessmentsContainer.appendChild(item);
            });
        } else {
            ProposalsModule.addAssessment();
        }

        // Populate Tab 4: Resources
        document.getElementById('facilityType').value = proposal.facilityType || '';
        document.getElementById('facilityRequirements').value = proposal.facilityRequirements || '';
        document.getElementById('technologyRequirements').value = proposal.technologyRequirements || '';
        document.getElementById('libraryResources').value = proposal.libraryResources || '';
        document.getElementById('otherResources').value = proposal.otherResources || '';

        // Change submit button text
        const submitBtn = document.getElementById('submitProposal');
        if (submitBtn) {
            submitBtn.textContent = 'Update Proposal';
        }

        // Close my proposals modal
        document.getElementById('myProposalsModal').style.display = 'none';

        // Open proposal modal and reset to first tab
        ProposalsModule.currentTab = 0;
        ProposalsModule.switchTab('identity');
        document.getElementById('proposalModal').style.display = 'block';
    },

    /**
     * Export proposal as formatted document
     * @param {number} proposalId
     */
    exportProposal: (proposalId) => {
        const proposal = StateGetters.getProposals().find(p => p.id === proposalId);

        if (!proposal) {
            alert('Proposal not found');
            return;
        }

        // Create formatted document (implementation similar to before but with new fields)
        let content = `CHAMPLAIN COLLEGE
ACADEMIC AFFAIRS
Course Proposal Form

================================================================================

COURSE INFORMATION
================================================================================

Course Code:        ${proposal.courseCode}
Course Title:       ${proposal.courseTitle}
Credit Hours:       ${proposal.creditHours}
Course Type:        ${proposal.courseType || 'Not specified'}
Capacity:           ${proposal.capacity || 'Not specified'}
Semester Offered:   ${proposal.semesterOffered || 'Not specified'}
Prerequisites:      ${proposal.prerequisites || 'None'}

================================================================================

COURSE DESCRIPTION
================================================================================

${proposal.catalogDescription || proposal.description}

Generated: ${new Date().toLocaleString()}
System: Champlain Academic Affairs Management System
Export ID: ${proposal.id}-${Date.now()}
`;

        // Create download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const date = new Date().toISOString().split('T')[0];
        const filename = `proposal-${proposal.courseCode.replace(/[^a-zA-Z0-9]/g, '-')}-${date}.txt`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`Proposal for ${proposal.courseCode} exported successfully!`);
    },

    /**
     * Approve a proposal
     * @param {number} id
     */
    approve: (id) => {
        if (confirm('Approve this proposal?')) {
            StateSetters.updateProposalStatus(id, 'approved');
            ProposalsModule.updatePendingBadge();
            ProposalsModule.showReviewModal();
            // Also refresh proposals page list if it is currently visible
            const proposalsPage = document.getElementById('proposalsPage');
            if (proposalsPage && !proposalsPage.classList.contains('hidden')) {
                ProposalsModule.showReviewModal('pg-proposalList', false);
            }
            alert('Proposal approved!');
        }
    },

    /**
     * Submit new proposal or update existing
     * @param {Event} e
     */
    submitProposal: (e) => {
        e.preventDefault();

        // Collect competencies
        const competencies = {};
        const competencyMap = {
            'comp_inquiry': 'Inquiry',
            'comp_integration': 'Integration',
            'comp_global': 'GlobalCulturalAwareness',
            'comp_analysis': 'Analysis',
            'comp_dei': 'DiversityEquityInclusion',
            'comp_communication': 'Communication',
            'comp_collaboration': 'Collaboration',
            'comp_creativity': 'Creativity',
            'comp_ethical': 'EthicalReasoning',
            'comp_quantitative': 'QuantitativeLiteracy'
        };

        let hasAtLeastOne = false;
        Object.entries(competencyMap).forEach(([selectId, compName]) => {
            const select = document.getElementById(selectId);
            const weight = parseInt(select.value);
            if (weight > 0) {
                competencies[compName] = weight;
                hasAtLeastOne = true;
            }
        });

        if (!hasAtLeastOne) {
            alert('Please select at least one college competency with a weight greater than 0');
            ProposalsModule.switchTab('outcomes');
            return;
        }

        // Collect CLOs
        const clos = Array.from(document.querySelectorAll('.clo-input'))
            .map(input => input.value.trim())
            .filter(val => val.length > 0);

        // Collect PLOs
        const plos = Array.from(document.querySelectorAll('.plo-input'))
            .map(input => input.value.trim())
            .filter(val => val.length > 0);

        // Collect assessments
        const assessments = Array.from(document.querySelectorAll('.assessment-item')).map(item => {
            const name = item.querySelector('.assessment-name').value.trim();
            const description = item.querySelector('.assessment-desc').value.trim();
            return { name, description };
        }).filter(a => a.name.length > 0);

        // Build course code
        const coursePrefix = document.getElementById('coursePrefix').value.trim().toUpperCase();
        const courseNumber = document.getElementById('courseNumber').value.trim();
        const courseCode = `${coursePrefix}-${courseNumber}`;

        const proposalData = {
            courseCode: courseCode,
            courseTitle: document.getElementById('courseTitle').value.trim(),
            catalogDescription: document.getElementById('catalogDescription').value.trim(),
            description: document.getElementById('catalogDescription').value.trim(), // Backwards compat
            creditHours: document.getElementById('creditHours').value,
            courseType: document.getElementById('courseType').value,
            capacity: document.getElementById('capacity').value,
            semesterOffered: document.getElementById('semesterOffered').value,
            instructionalMethod: document.getElementById('instructionalMethod').value,
            prerequisites: document.getElementById('prerequisites').value.trim(),
            clos: clos,
            plos: plos,
            competencies: competencies,
            topicalOutline: document.getElementById('topicalOutline').value.trim(),
            assessments: assessments,
            justification: document.getElementById('justification').value.trim(),
            facilityType: document.getElementById('facilityType').value,
            facilityRequirements: document.getElementById('facilityRequirements').value.trim(),
            technologyRequirements: document.getElementById('technologyRequirements').value.trim(),
            libraryResources: document.getElementById('libraryResources').value.trim(),
            otherResources: document.getElementById('otherResources').value.trim()
        };

        if (ProposalsModule.currentProposalId) {
            // Update existing proposal
            StateSetters.updateProposal(ProposalsModule.currentProposalId, proposalData);

            const successMsg = document.getElementById('proposalSuccess');
            successMsg.textContent = 'Proposal updated successfully!';
            successMsg.classList.remove('hidden');

            setTimeout(() => {
                ModalsModule.closeProposalModal();
                successMsg.classList.add('hidden');
                ProposalsModule.currentProposalId = null;
                document.getElementById('submitProposal').textContent = 'Submit Proposal';
                ProposalsModule.resetForm();
                // Refresh proposals page list if visible
                const proposalsPage = document.getElementById('proposalsPage');
                if (proposalsPage && !proposalsPage.classList.contains('hidden')) {
                    ProposalsModule.showMyProposals('pg-myProposalsList', false);
                }
            }, 2000);
        } else {
            // Create new proposal
            const proposal = {
                ...proposalData,
                submittedBy: StateGetters.getCurrentUser(),
                submittedDate: new Date().toISOString().split('T')[0],
                status: 'pending',
                feedback: []
            };

            StateSetters.addProposal(proposal);

            const successMsg = document.getElementById('proposalSuccess');
            successMsg.textContent = 'Course proposal submitted successfully!';
            successMsg.classList.remove('hidden');

            setTimeout(() => {
                ModalsModule.closeProposalModal();
                successMsg.classList.add('hidden');
                ProposalsModule.resetForm();
                // Refresh proposals page list if visible
                const proposalsPage = document.getElementById('proposalsPage');
                if (proposalsPage && !proposalsPage.classList.contains('hidden')) {
                    ProposalsModule.showMyProposals('pg-myProposalsList', false);
                }
            }, 2000);
        }
    },

    /**
     * Reset form to initial state
     */
    resetForm: () => {
        document.getElementById('proposalForm').reset();
        ProposalsModule.currentTab = 0;
        ProposalsModule.switchTab('identity');

        // Reset CLOs to one empty item
        document.getElementById('closContainer').innerHTML = '';
        ProposalsModule.addCLO();

        // Reset PLOs to one empty item
        document.getElementById('plosContainer').innerHTML = '';
        ProposalsModule.addPLO();

        // Reset assessments to one empty item
        document.getElementById('assessmentsContainer').innerHTML = '';
        ProposalsModule.addAssessment();
    },

    /**
     * Update pending badge count
     */
    updatePendingBadge: () => {
        const pendingCount = StateGetters.getProposals().filter(p => p.status === 'pending').length;
        const badge = document.getElementById('pendingBadge');
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};
