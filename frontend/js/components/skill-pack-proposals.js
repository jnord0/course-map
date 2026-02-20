// Skill Pack Proposals Component
// Handles the full lifecycle of skill pack proposals: submit, review, approve, reject

const SkillPackProposalsModule = {
    currentProposalId: null,
    currentTab: 0,
    tabs: ['overview', 'courses', 'resources'],

    // -------------------------------------------------------------------------
    // Form Initialization
    // -------------------------------------------------------------------------

    /**
     * Initialize the skill pack proposal form event listeners.
     * Should be called once after the DOM is ready.
     */
    initializeForm: () => {
        // Tab navigation buttons
        document.querySelectorAll('.sp-proposal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                SkillPackProposalsModule.switchTab(e.target.dataset.tab);
            });
        });

        const prevBtn = document.getElementById('spPrevTab');
        const nextBtn = document.getElementById('spNextTab');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (SkillPackProposalsModule.currentTab > 0) {
                    SkillPackProposalsModule.currentTab--;
                    SkillPackProposalsModule.switchTab(
                        SkillPackProposalsModule.tabs[SkillPackProposalsModule.currentTab]
                    );
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (SkillPackProposalsModule.currentTab < SkillPackProposalsModule.tabs.length - 1) {
                    if (SkillPackProposalsModule.validateCurrentTab()) {
                        SkillPackProposalsModule.currentTab++;
                        SkillPackProposalsModule.switchTab(
                            SkillPackProposalsModule.tabs[SkillPackProposalsModule.currentTab]
                        );
                    }
                }
            });
        }

        // Add Course Row button
        const addCourseRowBtn = document.getElementById('spAddCourseRow');
        if (addCourseRowBtn) {
            addCourseRowBtn.addEventListener('click', () => {
                SkillPackProposalsModule.addCourseRow();
            });
        }

        // Delegate clicks inside the courses table body
        const tbody = document.getElementById('spCoursesTableBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (e.target.classList.contains('sp-remove-course-row')) {
                    const rows = tbody.querySelectorAll('tr');
                    if (rows.length > 1) {
                        e.target.closest('tr').remove();
                    }
                }
                if (e.target.classList.contains('sp-prereq-add')) {
                    const wrap = e.target.closest('.sp-prereq-wrap');
                    const input = wrap ? wrap.querySelector('.sp-prereq-input') : null;
                    if (input && input.value.trim()) {
                        SkillPackProposalsModule._addPrereqTag(
                            wrap.querySelector('.sp-prereq-list'),
                            input.value.trim()
                        );
                        input.value = '';
                    }
                }
                if (e.target.classList.contains('sp-prereq-remove')) {
                    e.target.closest('.sp-prereq-tag').remove();
                }
            });
            tbody.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.classList.contains('sp-prereq-input')) {
                    e.preventDefault();
                    const wrap = e.target.closest('.sp-prereq-wrap');
                    if (e.target.value.trim()) {
                        SkillPackProposalsModule._addPrereqTag(
                            wrap.querySelector('.sp-prereq-list'),
                            e.target.value.trim()
                        );
                        e.target.value = '';
                    }
                }
            });
        }

        // Affiliated programs dynamic list
        const addProgramBtn = document.getElementById('spAddAffiliatedProgram');
        if (addProgramBtn) {
            addProgramBtn.addEventListener('click', () => {
                SkillPackProposalsModule._addAffiliatedProgramInput();
            });
        }
        const programsList = document.getElementById('spAffiliatedProgramsList');
        if (programsList) {
            programsList.addEventListener('click', (e) => {
                if (e.target.classList.contains('sp-program-remove')) {
                    const row = e.target.closest('.sp-program-row');
                    if (row && programsList.children.length > 1) {
                        row.remove();
                    }
                }
            });
        }

    },

    // -------------------------------------------------------------------------
    // Tab Navigation
    // -------------------------------------------------------------------------

    /**
     * Switch to a named tab and update progress indicators.
     * @param {string} tabName - 'overview' | 'courses' | 'resources'
     */
    switchTab: (tabName) => {
        const tabIndex = SkillPackProposalsModule.tabs.indexOf(tabName);
        if (tabIndex === -1) return;
        SkillPackProposalsModule.currentTab = tabIndex;

        // Update tab button styles
        document.querySelectorAll('.sp-proposal-tab').forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.style.background = isActive ? 'var(--champlain-navy)' : '#f0f0f0';
            tab.style.color = isActive ? 'white' : '#666';
            tab.classList.toggle('active', isActive);
        });

        // Show/hide tab content panels
        document.querySelectorAll('.sp-proposal-tab-content').forEach(panel => {
            panel.classList.add('hidden');
        });
        const activePanel = document.getElementById(`sp-tab-${tabName}`);
        if (activePanel) activePanel.classList.remove('hidden');

        // Update progress dots
        document.querySelectorAll('.sp-progress-step').forEach((step, i) => {
            step.style.background = i <= tabIndex ? 'white' : 'rgba(255,255,255,0.3)';
        });

        // Show/hide navigation buttons
        const prevBtn = document.getElementById('spPrevTab');
        const nextBtn = document.getElementById('spNextTab');
        const submitBtn = document.getElementById('spSubmitProposal');

        if (prevBtn) prevBtn.style.display = tabIndex === 0 ? 'none' : 'block';

        if (tabIndex === SkillPackProposalsModule.tabs.length - 1) {
            if (nextBtn) nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
        } else {
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
        }
    },

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    validateCurrentTab: () => {
        const tabName = SkillPackProposalsModule.tabs[SkillPackProposalsModule.currentTab];
        const panel = document.getElementById(`sp-tab-${tabName}`);
        if (!panel) return true;

        const requiredFields = panel.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                field.style.borderColor = '#f44336';
                setTimeout(() => { field.style.borderColor = ''; }, 2000);
                alert('Please fill in all required fields before continuing.');
                return false;
            }
        }

        // On the courses tab, require at least one course row to have a course selected
        if (tabName === 'courses') {
            const selects = document.querySelectorAll('.sp-course-select');
            const hasOne = Array.from(selects).some(s => s.value !== '');
            if (!hasOne) {
                alert('Please add at least one course to the skill pack.');
                return false;
            }
        }

        return true;
    },

    // -------------------------------------------------------------------------
    // Course Rows (Tab 2)
    // -------------------------------------------------------------------------

    /**
     * Build the options list for a course selector from state data.
     * @param {string} selectedCode - Pre-selected course code (for edit mode).
     * @returns {string} HTML option tags
     */
    _buildCourseOptions: (selectedCode = '') => {
        const courses = StateGetters.getCourses ? StateGetters.getCourses() : [];
        const options = ['<option value="">-- Select a course --</option>'];
        courses.forEach(c => {
            const code = c.code || '';
            const title = c.name || c.title || '';
            const selected = code === selectedCode ? 'selected' : '';
            options.push(`<option value="${code}" ${selected}>${code} – ${title}</option>`);
        });
        return options.join('');
    },

    /**
     * Append a new course row to the courses table.
     * @param {object} data - Optional pre-fill data for edit mode.
     */
    addCourseRow: (data = {}) => {
        const tbody = document.getElementById('spCoursesTableBody');
        if (!tbody) return;

        const competencyNames = [
            'Inquiry', 'Integration', 'Global/Cultural Awareness', 'Analysis',
            'Diversity/Equity/Inclusion', 'Communication', 'Collaboration',
            'Creativity', 'Ethical Reasoning', 'Quantitative Literacy'
        ];

        // Backward-compat: support old single 'competency' string and new 'competencies' array
        const selectedCompetencies = Array.isArray(data.competencies)
            ? data.competencies
            : (data.competency ? [data.competency] : []);

        // Backward-compat: support old 'prerequisites' string and new array
        const prereqArray = Array.isArray(data.prerequisites)
            ? data.prerequisites
            : (data.prerequisites ? data.prerequisites.split(',').map(s => s.trim()).filter(Boolean) : []);

        const competencyChecks = competencyNames.map(c => `
            <label style="display:flex; align-items:center; gap:4px; font-size:11px; cursor:pointer; padding:1px 0;">
                <input type="checkbox" class="sp-course-competency-cb" value="${c}"
                    ${selectedCompetencies.includes(c) ? 'checked' : ''}
                    style="accent-color:var(--champlain-navy); cursor:pointer; flex-shrink:0;">
                <span>${c}</span>
            </label>`).join('');

        const prereqTagsHtml = prereqArray.map(p =>
            `<span class="sp-prereq-tag" data-prereq="${p}" style="display:inline-flex; align-items:center; gap:2px; background:var(--champlain-blue); color:white; padding:2px 7px 2px 8px; border-radius:12px; font-size:11px; white-space:nowrap;">${p}<button type="button" class="sp-prereq-remove" style="background:none; border:none; color:white; cursor:pointer; padding:0 0 0 2px; font-size:13px; line-height:1;">&times;</button></span>`
        ).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:8px; min-width:180px; vertical-align:top;">
                <select class="sp-course-select" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
                    ${SkillPackProposalsModule._buildCourseOptions(data.courseCode || '')}
                </select>
            </td>
            <td style="padding:8px; min-width:180px; vertical-align:top;">
                <textarea class="sp-course-contribution" rows="3"
                    placeholder="How does this course contribute to the skill pack outcome?"
                    style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; resize:vertical;">${data.contribution || ''}</textarea>
            </td>
            <td style="padding:8px; min-width:190px; vertical-align:top;">
                <div style="display:flex; flex-direction:column; gap:2px; max-height:175px; overflow-y:auto; padding:6px; border:1px solid #ccc; border-radius:4px; background:#fafafa;">
                    ${competencyChecks}
                </div>
            </td>
            <td style="padding:8px; min-width:160px; vertical-align:top;">
                <div class="sp-prereq-wrap">
                    <div class="sp-prereq-list" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px; min-height:18px;">${prereqTagsHtml}</div>
                    <div style="display:flex; gap:4px;">
                        <input type="text" class="sp-prereq-input" placeholder="e.g. CSI-140"
                            style="flex:1; min-width:0; padding:5px 6px; border:1px solid #ccc; border-radius:4px; font-size:12px;">
                        <button type="button" class="sp-prereq-add"
                            style="padding:5px 8px; background:var(--champlain-blue); color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; flex-shrink:0;">+</button>
                    </div>
                </div>
            </td>
            <td style="padding:8px; min-width:140px; vertical-align:top;">
                <select class="sp-course-disposition"
                    style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
                    <option value="existing" ${(data.disposition || 'existing') === 'existing' ? 'selected' : ''}>Existing – as is</option>
                    <option value="modification" ${data.disposition === 'modification' ? 'selected' : ''}>Modification needed</option>
                    <option value="new" ${data.disposition === 'new' ? 'selected' : ''}>New course</option>
                </select>
            </td>
            <td style="padding:8px; min-width:130px; vertical-align:top;">
                <input type="text" class="sp-course-notes" value="${data.notes || ''}"
                    placeholder="Any notes..."
                    style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
            </td>
            <td style="padding:8px; text-align:center; vertical-align:top;">
                <button type="button" class="sp-remove-course-row"
                    style="padding:5px 10px; background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    },

    /**
     * Add a program input row to the affiliated programs list.
     * @param {string} value - Pre-filled value for edit mode.
     */
    _addAffiliatedProgramInput: (value = '') => {
        const list = document.getElementById('spAffiliatedProgramsList');
        if (!list) return;
        const row = document.createElement('div');
        row.className = 'sp-program-row';
        row.style.cssText = 'display:flex; gap:8px; align-items:center;';
        row.innerHTML = `
            <input type="text" class="sp-program-input" value="${value}"
                placeholder="Degree program this skill pack is related to"
                style="flex:1; padding:8px 12px; border:1px solid #ccc; border-radius:4px; font-size:14px;">
            <button type="button" class="sp-program-remove"
                style="padding:6px 12px; background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px; flex-shrink:0;">✕</button>
        `;
        list.appendChild(row);
    },

    /**
     * Add a prerequisite tag to a prereq list container.
     * @param {Element} container - The .sp-prereq-list element.
     * @param {string} value - The prereq course code.
     */
    _addPrereqTag: (container, value) => {
        if (!container || !value) return;
        const span = document.createElement('span');
        span.className = 'sp-prereq-tag';
        span.dataset.prereq = value;
        span.style.cssText = 'display:inline-flex; align-items:center; gap:2px; background:var(--champlain-blue); color:white; padding:2px 7px 2px 8px; border-radius:12px; font-size:11px; white-space:nowrap;';
        span.innerHTML = `${value}<button type="button" class="sp-prereq-remove" style="background:none; border:none; color:white; cursor:pointer; padding:0 0 0 2px; font-size:13px; line-height:1;">&times;</button>`;
        container.appendChild(span);
    },

    // -------------------------------------------------------------------------
    // My Proposals (Faculty view)
    // -------------------------------------------------------------------------

    /**
     * Render the faculty's own skill pack proposals into a container element.
     * @param {string} containerId - ID of the container div
     * @param {boolean} showModal - Whether to open the modal overlay (unused here, kept for API parity)
     */
    showMyProposals: (containerId = 'spMyProposalsList', showModal = false) => {
        const currentUser = StateGetters.getCurrentUser();
        const myProposals = StateGetters.getSkillPackProposals().filter(
            p => p.submittedBy === currentUser
        );
        const listDiv = document.getElementById(containerId);
        if (!listDiv) return;

        if (myProposals.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No skill pack proposals submitted yet.</p>';
            return;
        }

        listDiv.innerHTML = myProposals.map(p => {
            const hasFeedback = p.feedback && p.feedback.length > 0;
            return `
                <div class="proposal-card">
                    <div class="proposal-header">
                        <div class="proposal-title">${p.skillPackName}</div>
                        <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                    </div>
                    <div class="proposal-info">
                        Submitted: ${p.submittedDate}
                        ${(p.affiliatedPrograms && p.affiliatedPrograms.length > 0)
                            ? ` | Programs: ${p.affiliatedPrograms.join(', ')}`
                            : (p.affiliatedProgram ? ` | Program: ${p.affiliatedProgram}` : '')}
                        ${hasFeedback ? `<span style="color:#FF9800; font-weight:bold; margin-left:10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                    </div>
                    <div class="proposal-actions">
                        <button class="action-btn btn-view" onclick="SkillPackProposalsModule.viewDetails(${p.id})">View Details</button>
                        ${p.status === 'pending' ? `
                            <button class="action-btn" style="background:var(--champlain-blue);" onclick="SkillPackProposalsModule.editProposal(${p.id})">✏️ Edit</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // -------------------------------------------------------------------------
    // Admin Review Queue
    // -------------------------------------------------------------------------

    /**
     * Render the admin review queue of pending skill pack proposals.
     * @param {string} containerId - ID of the container div
     * @param {boolean} showModal - Whether to open the modal overlay
     */
    showReviewQueue: (containerId = 'spReviewList', showModal = false) => {
        const pending = StateGetters.getSkillPackProposals().filter(p => p.status === 'pending');
        const listDiv = document.getElementById(containerId);
        if (!listDiv) return;

        if (pending.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No pending skill pack proposals.</p>';
            return;
        }

        listDiv.innerHTML = pending.map(p => {
            const hasFeedback = p.feedback && p.feedback.length > 0;
            return `
                <div class="proposal-card">
                    <div class="proposal-header">
                        <div class="proposal-title">${p.skillPackName}</div>
                        <div class="proposal-status status-${p.status}">${p.status.toUpperCase()}</div>
                    </div>
                    <div class="proposal-info">
                        By: ${p.submittedBy} | ${p.submittedDate}
                        ${(p.affiliatedPrograms && p.affiliatedPrograms.length > 0)
                            ? ` | Programs: ${p.affiliatedPrograms.join(', ')}`
                            : (p.affiliatedProgram ? ` | Program: ${p.affiliatedProgram}` : '')}
                        ${hasFeedback ? `<span style="color:#FF9800; font-weight:bold; margin-left:10px;">💬 ${p.feedback.length} Feedback</span>` : ''}
                    </div>
                    <div class="proposal-actions">
                        <button class="action-btn btn-view" onclick="SkillPackProposalsModule.viewDetails(${p.id})">View</button>
                        <button class="action-btn" style="background:#FF9800;" onclick="SkillPackProposalsModule.sendFeedback(${p.id})">💬 Feedback</button>
                        <button class="action-btn btn-approve" onclick="SkillPackProposalsModule.approve(${p.id})">Approve</button>
                        <button class="action-btn btn-reject" onclick="SkillPackProposalsModule.rejectWithFeedback(${p.id})">Reject</button>
                    </div>
                </div>
            `;
        }).join('');

        if (showModal) {
            const modal = document.getElementById('spReviewModal');
            if (modal) modal.style.display = 'block';
        }
    },

    // -------------------------------------------------------------------------
    // View Details
    // -------------------------------------------------------------------------

    /**
     * Open the details modal and render the full proposal content.
     * @param {number} id
     */
    viewDetails: (id) => {
        const proposal = StateGetters.getSkillPackProposals().find(p => p.id === id);
        if (!proposal) return;

        SkillPackProposalsModule.currentProposalId = id;

        // Build course rows table
        let coursesTable = '';
        if (proposal.courses && proposal.courses.length > 0) {
            const rows = proposal.courses.map(c => {
                const comps = Array.isArray(c.competencies) && c.competencies.length > 0
                    ? c.competencies.join(', ')
                    : (c.competency || '–');
                const prereqs = Array.isArray(c.prerequisites) && c.prerequisites.length > 0
                    ? c.prerequisites.join(', ')
                    : (typeof c.prerequisites === 'string' && c.prerequisites ? c.prerequisites : 'None');
                return `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${c.courseCode}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${c.contribution || '–'}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${comps}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${prereqs}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${c.disposition || '–'}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${c.notes || '–'}</td>
                </tr>
            `}).join('');
            coursesTable = `
                <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:8px;">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Course</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Contribution to LO</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Competency (L3)</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Prerequisites</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Disposition</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Notes</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else {
            coursesTable = '<p style="color:#666;">No courses specified.</p>';
        }

        // Build feedback history
        let feedbackSection = '';
        if (proposal.feedback && proposal.feedback.length > 0) {
            feedbackSection = `
                <div style="margin-top:20px; padding:15px; background:#fff3cd; border-left:4px solid #ff9800; border-radius:4px;">
                    <h4 style="color:#856404; margin-bottom:10px; font-size:16px;">💬 Feedback History</h4>
                    ${proposal.feedback.map(fb => `
                        <div style="background:white; padding:12px; border-radius:4px; margin-bottom:10px; border:1px solid #ffc107;">
                            <div style="font-size:12px; color:#666; margin-bottom:6px;"><strong>${fb.from}</strong> – ${fb.date}</div>
                            <div style="font-size:14px; color:#333;">${fb.message}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const detailsEl = document.getElementById('spProposalDetails');
        if (!detailsEl) return;

        detailsEl.innerHTML = `
            <div style="margin-bottom:20px;">
                <h3 style="color:var(--champlain-navy); margin-bottom:15px;">${proposal.skillPackName}</h3>

                <div style="background:#f8f9fa; padding:15px; border-radius:6px; margin-bottom:15px;">
                    <h4 style="margin-top:0;">Overview</h4>
                    <p style="margin-bottom:8px;"><strong>Affiliated Programs:</strong> ${
                        proposal.affiliatedPrograms && proposal.affiliatedPrograms.length > 0
                            ? proposal.affiliatedPrograms.join(', ')
                            : (proposal.affiliatedProgram || 'N/A')
                    }</p>
                    <p style="margin-bottom:8px;"><strong>Description:</strong> ${proposal.description}</p>
                    <p style="margin-bottom:8px;"><strong>Outcome:</strong> ${proposal.outcome}</p>
                    <p style="margin-bottom:0;"><strong>Rationale:</strong> ${proposal.rationale}</p>
                </div>

                <div style="background:#e3f2fd; padding:15px; border-radius:6px; margin-bottom:15px;">
                    <h4 style="margin-top:0;">Courses</h4>
                    ${coursesTable}
                </div>

                <div style="background:#fff3e0; padding:15px; border-radius:6px; margin-bottom:15px;">
                    <h4 style="margin-top:0;">Resources &amp; Impact</h4>
                    <p style="margin-bottom:8px;"><strong>Technology Requirements:</strong> ${proposal.technologyRequirements || 'N/A'}</p>
                    <p style="margin-bottom:8px;"><strong>Library Resources:</strong> ${proposal.libraryResources || 'N/A'}</p>
                    <p style="margin-bottom:8px;"><strong>New Course Proposals:</strong> ${proposal.newCourseProposals || 'None'}</p>
                    <p style="margin-bottom:8px;"><strong>Course Modifications:</strong> ${proposal.courseModifications || 'None'}</p>
                    <p style="margin-bottom:8px;"><strong>Course Eliminations:</strong> ${proposal.courseEliminations || 'None'}</p>
                    <p style="margin-bottom:0;"><strong>Impact on Other Programs:</strong> ${proposal.programImpact || 'None'}</p>
                </div>

                <p style="font-size:13px; color:#666; margin-top:20px;">
                    Submitted by: ${proposal.submittedBy} | ${proposal.submittedDate}
                </p>
                ${feedbackSection}
            </div>
        `;

        const modal = document.getElementById('spDetailsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    },

    // -------------------------------------------------------------------------
    // Admin Actions
    // -------------------------------------------------------------------------

    approve: (id) => {
        if (!confirm('Approve this skill pack proposal?')) return;
        StateSetters.updateSkillPackProposalStatus(id, 'approved');
        SkillPackProposalsModule.showReviewQueue('pg-spReviewList', false);
        alert('Skill pack proposal approved!');
    },

    rejectWithFeedback: (id) => {
        const proposal = StateGetters.getSkillPackProposals().find(p => p.id === id);
        if (!proposal) return;

        const feedback = prompt(
            `Please provide feedback for rejection of "${proposal.skillPackName}":\n\n(This will help faculty understand why the proposal was not approved)`
        );
        if (feedback === null) return;

        if (feedback && feedback.trim()) {
            StateSetters.addSkillPackProposalFeedback(id, `[REJECTION] ${feedback.trim()}`);
        }

        if (confirm('Are you sure you want to reject this proposal?')) {
            StateSetters.updateSkillPackProposalStatus(id, 'rejected');
            SkillPackProposalsModule.showReviewQueue('pg-spReviewList', false);
            alert('Skill pack proposal rejected with feedback.');
        }
    },

    sendFeedback: (id) => {
        const proposal = StateGetters.getSkillPackProposals().find(p => p.id === id);
        if (!proposal) return;

        const feedback = prompt(
            `Send feedback to ${proposal.submittedBy} about "${proposal.skillPackName}":\n\n(Faculty will be able to revise their proposal based on your feedback)`
        );

        if (feedback && feedback.trim()) {
            StateSetters.addSkillPackProposalFeedback(id, feedback.trim());
            SkillPackProposalsModule.showReviewQueue('pg-spReviewList', false);
            alert('Feedback sent successfully!');
        }
    },

    // -------------------------------------------------------------------------
    // Submit / Update
    // -------------------------------------------------------------------------

    /**
     * Collect form data, validate, and submit (or update) a skill pack proposal.
     * @param {Event} e
     */
    submitProposal: (e) => {
        e.preventDefault();

        // Validate required fields across all panels without switching tabs
        const requiredInputs = document.querySelectorAll('#spProposalForm [required]');
        for (let field of requiredInputs) {
            if (!field.value.trim()) {
                field.focus();
                field.style.borderColor = '#f44336';
                setTimeout(() => { field.style.borderColor = ''; }, 2000);
                // Switch to the tab that contains the failing field
                const panel = field.closest('.sp-proposal-tab-content');
                if (panel) {
                    const tabId = panel.id.replace('sp-tab-', '');
                    SkillPackProposalsModule.switchTab(tabId);
                }
                alert('Please fill in all required fields before submitting.');
                return;
            }
        }

        // Collect course rows
        const courses = [];
        const rows = document.querySelectorAll('#spCoursesTableBody tr');
        rows.forEach(row => {
            const courseCode = row.querySelector('.sp-course-select')?.value || '';
            if (!courseCode) return;
            const competencies = Array.from(row.querySelectorAll('.sp-course-competency-cb:checked'))
                .map(cb => cb.value);
            const prerequisites = Array.from(row.querySelectorAll('.sp-prereq-tag'))
                .map(tag => tag.dataset.prereq)
                .filter(Boolean);
            courses.push({
                courseCode,
                contribution: row.querySelector('.sp-course-contribution')?.value.trim() || '',
                competencies,
                prerequisites,
                disposition: row.querySelector('.sp-course-disposition')?.value || 'existing',
                notes: row.querySelector('.sp-course-notes')?.value.trim() || ''
            });
        });

        if (courses.length === 0) {
            alert('Please add at least one course to the skill pack.');
            SkillPackProposalsModule.switchTab('courses');
            return;
        }

        const proposalData = {
            skillPackName: document.getElementById('spSkillPackName')?.value.trim() || '',
            affiliatedPrograms: Array.from(document.querySelectorAll('#spAffiliatedProgramsList .sp-program-input'))
                .map(inp => inp.value.trim()).filter(Boolean),
            description: document.getElementById('spDescription')?.value.trim() || '',
            outcome: document.getElementById('spOutcome')?.value.trim() || '',
            rationale: document.getElementById('spRationale')?.value.trim() || '',
            technologyRequirements: document.getElementById('spTechnologyRequirements')?.value.trim() || '',
            libraryResources: document.getElementById('spLibraryResources')?.value.trim() || '',
            newCourseProposals: document.getElementById('spNewCourseProposals')?.value.trim() || '',
            courseModifications: document.getElementById('spCourseModifications')?.value.trim() || '',
            courseEliminations: document.getElementById('spCourseEliminations')?.value.trim() || '',
            programImpact: document.getElementById('spProgramImpact')?.value.trim() || '',
            courses
        };

        const successMsg = document.getElementById('spProposalSuccess');

        if (SkillPackProposalsModule.currentProposalId) {
            // Update existing
            StateSetters.updateSkillPackProposal(SkillPackProposalsModule.currentProposalId, proposalData);
            if (successMsg) {
                successMsg.textContent = 'Skill pack proposal updated successfully!';
                successMsg.classList.remove('hidden');
            }
            setTimeout(() => {
                SkillPackProposalsModule._closeProposalModal();
                if (successMsg) successMsg.classList.add('hidden');
                SkillPackProposalsModule.currentProposalId = null;
                const submitBtn = document.getElementById('spSubmitProposal');
                if (submitBtn) submitBtn.textContent = 'Submit Proposal';
                SkillPackProposalsModule.resetForm();
                SkillPackProposalsModule.showMyProposals('pg-spMyProposalsList');
            }, 2000);
        } else {
            // New submission
            const proposal = {
                ...proposalData,
                submittedBy: StateGetters.getCurrentUser(),
                submittedDate: new Date().toISOString().split('T')[0],
                status: 'pending',
                feedback: []
            };
            StateSetters.addSkillPackProposal(proposal);
            if (successMsg) {
                successMsg.textContent = 'Skill pack proposal submitted successfully!';
                successMsg.classList.remove('hidden');
            }
            setTimeout(() => {
                SkillPackProposalsModule._closeProposalModal();
                if (successMsg) successMsg.classList.add('hidden');
                SkillPackProposalsModule.resetForm();
                SkillPackProposalsModule.showMyProposals('pg-spMyProposalsList');
            }, 2000);
        }
    },

    // -------------------------------------------------------------------------
    // Edit Proposal
    // -------------------------------------------------------------------------

    editProposal: (id) => {
        const proposal = StateGetters.getSkillPackProposals().find(p => p.id === id);
        if (!proposal) return;

        SkillPackProposalsModule.currentProposalId = id;

        // Tab 1: Overview
        const setVal = (elId, val) => {
            const el = document.getElementById(elId);
            if (el) el.value = val || '';
        };
        setVal('spSkillPackName', proposal.skillPackName);

        // Rebuild affiliated programs list
        const progList = document.getElementById('spAffiliatedProgramsList');
        if (progList) {
            progList.innerHTML = '';
            const programs = proposal.affiliatedPrograms && proposal.affiliatedPrograms.length > 0
                ? proposal.affiliatedPrograms
                : (proposal.affiliatedProgram ? [proposal.affiliatedProgram] : []);
            programs.forEach(p => SkillPackProposalsModule._addAffiliatedProgramInput(p));
            if (progList.children.length === 0) SkillPackProposalsModule._addAffiliatedProgramInput();
        }

        setVal('spDescription', proposal.description);
        setVal('spOutcome', proposal.outcome);
        setVal('spRationale', proposal.rationale);

        // Tab 2: Courses – rebuild rows
        const tbody = document.getElementById('spCoursesTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            if (proposal.courses && proposal.courses.length > 0) {
                proposal.courses.forEach(c => SkillPackProposalsModule.addCourseRow(c));
            } else {
                SkillPackProposalsModule.addCourseRow();
            }
        }

        // Tab 3: Resources
        setVal('spTechnologyRequirements', proposal.technologyRequirements);
        setVal('spLibraryResources', proposal.libraryResources);
        setVal('spNewCourseProposals', proposal.newCourseProposals);
        setVal('spCourseModifications', proposal.courseModifications);
        setVal('spCourseEliminations', proposal.courseEliminations);
        setVal('spProgramImpact', proposal.programImpact);

        const submitBtn = document.getElementById('spSubmitProposal');
        if (submitBtn) submitBtn.textContent = 'Update Proposal';

        SkillPackProposalsModule.currentTab = 0;
        SkillPackProposalsModule.switchTab('overview');
        SkillPackProposalsModule._openProposalModal();
    },

    // -------------------------------------------------------------------------
    // Reset
    // -------------------------------------------------------------------------

    resetForm: () => {
        const form = document.getElementById('spProposalForm');
        if (form) form.reset();

        SkillPackProposalsModule.currentTab = 0;
        SkillPackProposalsModule.switchTab('overview');

        // Reset affiliated programs to one empty row
        const progList = document.getElementById('spAffiliatedProgramsList');
        if (progList) {
            progList.innerHTML = '';
            SkillPackProposalsModule._addAffiliatedProgramInput();
        }

        const tbody = document.getElementById('spCoursesTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            SkillPackProposalsModule.addCourseRow();
        }
    },

    // -------------------------------------------------------------------------
    // Modal helpers (called from HTML onclick attributes)
    // -------------------------------------------------------------------------

    openProposalModal: () => {
        SkillPackProposalsModule.currentProposalId = null;
        SkillPackProposalsModule._openProposalModal();
        try {
            SkillPackProposalsModule.resetForm();
        } catch (err) {
            console.error('Skill pack form reset error:', err);
        }
    },

    _openProposalModal: () => {
        const modal = document.getElementById('spProposalModal');
        if (modal) modal.style.display = 'block';
    },

    _closeProposalModal: () => {
        const modal = document.getElementById('spProposalModal');
        if (modal) modal.style.display = 'none';
    },

    closeDetailsModal: () => {
        const modal = document.getElementById('spDetailsModal');
        if (modal) modal.style.display = 'none';
    }
};
