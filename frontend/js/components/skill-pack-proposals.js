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
            // Auto-fill competencies and prerequisites when a course is selected
            tbody.addEventListener('change', (e) => {
                if (e.target.classList.contains('sp-course-select')) {
                    const tr = e.target.closest('tr');
                    if (tr) {
                        SkillPackProposalsModule._autoFillCourseRow(tr, e.target.value);
                    }
                }
            });

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
        const options = [
            '<option value="">-- Select a course --</option>',
            `<option value="__new__" ${selectedCode === '__new__' ? 'selected' : ''}>➕ New Course (TBD)</option>`
        ];
        courses.forEach(c => {
            const code = c.code || '';
            const title = c.name || c.title || '';
            const selected = code === selectedCode ? 'selected' : '';
            options.push(`<option value="${code}" ${selected}>${code} – ${title}</option>`);
        });
        return options.join('');
    },

    // Cell HTML helpers (shared by addCourseRow and _autoFillCourseRow for mode switching)

    _competencyCellInnerHTML: (selectedCompetencies = []) => {
        const names = [
            'Analysis', 'Collaboration', 'Communication', 'Creativity',
            'Diversity, Equity & Inclusion', 'Global/Cultural Awareness',
            'Information Literacy', 'Inquiry', 'Integration',
            'Quantitative Literacy', 'Scientific Literacy', 'Technology Literacy'
        ];
        const checks = names.map(c => `
            <label style="display:flex; align-items:center; gap:4px; font-size:11px; cursor:pointer; padding:1px 0;">
                <input type="checkbox" class="sp-course-competency-cb" value="${c}"
                    ${selectedCompetencies.includes(c) ? 'checked' : ''}
                    style="accent-color:var(--champlain-navy); cursor:pointer; flex-shrink:0;">
                <span>${c}</span>
            </label>`).join('');
        return `<div style="display:flex; flex-direction:column; gap:2px; max-height:175px; overflow-y:auto; padding:6px; border:1px solid #ccc; border-radius:4px; background:#fafafa;">${checks}</div>`;
    },

    _prereqCellInnerHTML: (prereqArray = []) => {
        const tags = prereqArray.map(p =>
            `<span class="sp-prereq-tag" data-prereq="${p}" style="display:inline-flex; align-items:center; gap:2px; background:var(--champlain-blue); color:white; padding:2px 7px 2px 8px; border-radius:12px; font-size:11px; white-space:nowrap;">${p}<button type="button" class="sp-prereq-remove" style="background:none; border:none; color:white; cursor:pointer; padding:0 0 0 2px; font-size:13px; line-height:1;">&times;</button></span>`
        ).join('');
        return `<div class="sp-prereq-wrap">
            <div class="sp-prereq-list" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px; min-height:18px;">${tags}</div>
            <div style="display:flex; gap:4px;">
                <input type="text" class="sp-prereq-input" placeholder="e.g. CSI-140"
                    style="flex:1; min-width:0; padding:5px 6px; border:1px solid #ccc; border-radius:4px; font-size:12px;">
                <button type="button" class="sp-prereq-add"
                    style="padding:5px 8px; background:var(--champlain-blue); color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; flex-shrink:0;">+</button>
            </div>
        </div>`;
    },

    _newCourseNameCellInnerHTML: (name = '') =>
        `<label style="font-size:11px; font-weight:600; color:var(--champlain-navy); display:block; margin-bottom:4px;">Placeholder Name</label>
        <input type="text" class="sp-new-course-name" value="${name}"
            placeholder="e.g. Advanced Data Science"
            style="width:100%; padding:6px; border:1px solid #90caf9; border-radius:4px; font-size:13px; box-sizing:border-box;">`,

    _newCourseDescCellInnerHTML: (desc = '') =>
        `<label style="font-size:11px; font-weight:600; color:var(--champlain-navy); display:block; margin-bottom:4px;">Why is this course needed?</label>
        <textarea class="sp-new-course-description" rows="4"
            placeholder="Describe the need for this new course and what it would cover..."
            style="width:100%; padding:6px; border:1px solid #90caf9; border-radius:4px; font-size:13px; resize:vertical; box-sizing:border-box;">${desc}</textarea>`,

    /**
     * Append a new course row to the courses table.
     * @param {object} data - Optional pre-fill data for edit mode.
     */
    addCourseRow: (data = {}) => {
        const tbody = document.getElementById('spCoursesTableBody');
        if (!tbody) return;

        const isNewCourse = data.courseCode === '__new__';

        // Backward-compat: support old single 'competency' string and new 'competencies' array
        const selectedCompetencies = Array.isArray(data.competencies)
            ? data.competencies
            : (data.competency ? [data.competency] : []);

        // Backward-compat: support old 'prerequisites' string and new array
        const prereqArray = Array.isArray(data.prerequisites)
            ? data.prerequisites
            : (data.prerequisites ? data.prerequisites.split(',').map(s => s.trim()).filter(Boolean) : []);

        const SP = SkillPackProposalsModule;
        const compOrNameCell = isNewCourse
            ? SP._newCourseNameCellInnerHTML(data.placeholderName || '')
            : SP._competencyCellInnerHTML(selectedCompetencies);
        const prereqOrDescCell = isNewCourse
            ? SP._newCourseDescCellInnerHTML(data.newCourseDescription || '')
            : SP._prereqCellInnerHTML(prereqArray);

        // Auto-select "New course" disposition when adding a TBD row
        const disposition = isNewCourse ? 'new' : (data.disposition || 'existing');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:8px; min-width:180px; vertical-align:top;">
                <select class="sp-course-select" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
                    ${SP._buildCourseOptions(data.courseCode || '')}
                </select>
            </td>
            <td style="padding:8px; min-width:180px; vertical-align:top;">
                <textarea class="sp-course-contribution" rows="3"
                    placeholder="How does this course contribute to the skill pack outcome?"
                    style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; resize:vertical;">${data.contribution || ''}</textarea>
            </td>
            <td style="padding:8px; min-width:190px; vertical-align:top;">${compOrNameCell}</td>
            <td style="padding:8px; min-width:160px; vertical-align:top;">${prereqOrDescCell}</td>
            <td style="padding:8px; min-width:140px; vertical-align:top;">
                <select class="sp-course-disposition"
                    style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
                    <option value="existing" ${disposition === 'existing' ? 'selected' : ''}>Existing – as is</option>
                    <option value="modification" ${disposition === 'modification' ? 'selected' : ''}>Modification needed</option>
                    <option value="new" ${disposition === 'new' ? 'selected' : ''}>New course</option>
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
     * Auto-fill (or switch mode for) a course row when its dropdown changes.
     * - If __new__ is selected: swap cells to placeholder-name + description mode.
     * - If a real course is selected from __new__ mode: restore competency + prereq cells, then fill.
     * - If a real course is selected normally: fill competencies and prerequisites.
     * @param {Element} tr - The table row element.
     * @param {string} courseCode - Selected course code or '__new__'.
     */
    _autoFillCourseRow: (tr, courseCode) => {
        const SP = SkillPackProposalsModule;
        const cells = tr.querySelectorAll('td');
        const compCell = cells[2];
        const prereqCell = cells[3];
        const dispositionSelect = tr.querySelector('.sp-course-disposition');
        const isCurrentlyNewMode = !!compCell.querySelector('.sp-new-course-name');

        if (!courseCode) return;

        if (courseCode === '__new__') {
            // Switch to new-course mode (placeholder name + description)
            compCell.innerHTML = SP._newCourseNameCellInnerHTML('');
            prereqCell.innerHTML = SP._newCourseDescCellInnerHTML('');
            if (dispositionSelect) dispositionSelect.value = 'new';
            return;
        }

        // Switching to a real course — restore competency/prereq cells if in new-course mode
        if (isCurrentlyNewMode) {
            compCell.innerHTML = SP._competencyCellInnerHTML([]);
            prereqCell.innerHTML = SP._prereqCellInnerHTML([]);
            if (dispositionSelect && dispositionSelect.value === 'new') {
                dispositionSelect.value = 'existing';
            }
        }

        // Look up the course and auto-fill
        const courses = StateGetters.getCourses ? StateGetters.getCourses() : [];
        const course = courses.find(c => c.code === courseCode);
        if (!course) return;

        // Map both short-code and long-form competency keys to checkbox display names
        const compToDisplayName = {
            'INQ': 'Inquiry',        'INT': 'Integration',
            'GCU': 'Global/Cultural Awareness', 'ANL': 'Analysis',
            'DEI': 'Diversity, Equity & Inclusion', 'COM': 'Communication',
            'COL': 'Collaboration',  'CRE': 'Creativity',
            'SCI': 'Scientific Literacy', 'INL': 'Information Literacy',
            'TEC': 'Technology Literacy', 'QNT': 'Quantitative Literacy',
            'Inquiry': 'Inquiry', 'Integration': 'Integration',
            'GlobalCulturalAwareness': 'Global/Cultural Awareness',
            'Analysis': 'Analysis', 'DiversityEquityInclusion': 'Diversity, Equity & Inclusion',
            'Communication': 'Communication', 'Collaboration': 'Collaboration',
            'Creativity': 'Creativity', 'ScientificLiteracy': 'Scientific Literacy',
            'InformationLiteracy': 'Information Literacy',
            'TechnologyLiteracy': 'Technology Literacy',
            'QuantitativeLiteracy': 'Quantitative Literacy'
        };

        // Build set of display names for competencies this course covers
        const toCheck = new Set();
        if (course.competencies) {
            Object.entries(course.competencies).forEach(([key, weight]) => {
                if (weight > 0) {
                    const name = compToDisplayName[key];
                    if (name) toCheck.add(name);
                }
            });
        }

        // Check/uncheck competency boxes to match course data
        tr.querySelectorAll('.sp-course-competency-cb').forEach(cb => {
            cb.checked = toCheck.has(cb.value);
        });

        // Auto-fill prerequisites from course data
        const prereqList = tr.querySelector('.sp-prereq-list');
        if (prereqList) {
            prereqList.innerHTML = '';
            if (course.prerequisites) {
                course.prerequisites.split(',').map(p => p.trim()).filter(Boolean).forEach(p => {
                    SP._addPrereqTag(prereqList, p);
                });
            } else if (course.prerequisiteList && course.prerequisiteList.length > 0) {
                course.prerequisiteList.forEach(p => {
                    SP._addPrereqTag(prereqList, `${p.coursePrefix}-${p.courseNumber}`);
                });
            }
        }
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
                        ${hasFeedback ? `<span style="color:#FF9800; font-weight:bold; margin-left:10px;">◻ ${p.feedback.length} Feedback</span>` : ''}
                    </div>
                    <div class="proposal-actions">
                        <button class="action-btn btn-view" onclick="SkillPackProposalsModule.viewDetails(${p.id})">View Details</button>
                        ${p.status === 'pending' ? `
                            <button class="action-btn" style="background:var(--champlain-blue);" onclick="SkillPackProposalsModule.editProposal(${p.id})">✎ Edit</button>
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
                        ${hasFeedback ? `<span style="color:#FF9800; font-weight:bold; margin-left:10px;">◻ ${p.feedback.length} Feedback</span>` : ''}
                    </div>
                    <div class="proposal-actions">
                        <button class="action-btn btn-view" onclick="SkillPackProposalsModule.viewDetails(${p.id})">View</button>
                        <button class="action-btn" style="background:#FF9800;" onclick="SkillPackProposalsModule.sendFeedback(${p.id})">◻ Feedback</button>
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
    // Impact Analysis (auto-generated from proposal data)
    // -------------------------------------------------------------------------

    /**
     * Build the "Resources & Impact" section HTML entirely from proposal data.
     * Derives course changes, competency coverage, prerequisite scope, and a
     * generated program-impact narrative instead of just echoing free-text fields.
     * @param {Object} proposal
     * @returns {string} HTML string
     */
    _buildImpactSection: (proposal) => {
        const courses = proposal.courses || [];

        // ── 1. Group courses by disposition ──────────────────────────────────
        const byDisposition = { new: [], modification: [], elimination: [], existing: [] };
        courses.forEach(c => {
            const d = (c.disposition || 'existing').toLowerCase();
            if (byDisposition[d]) byDisposition[d].push(c);
            else byDisposition.existing.push(c);
        });

        const dispositionStyle = {
            new:          { label: 'New',           bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
            modification: { label: 'Modification',  bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
            elimination:  { label: 'Elimination',   bg: '#fdecea', color: '#b71c1c', border: '#ef9a9a' },
            existing:     { label: 'Existing',      bg: '#f5f5f5', color: '#555',    border: '#e0e0e0' },
        };

        const renderChangeGroup = (key, list) => {
            if (list.length === 0) return '';
            const { label, bg, color, border } = dispositionStyle[key];
            const items = list.map(c => {
                const code = c.courseCode === '__new__'
                    ? `<em>${c.placeholderName || 'Unnamed'}</em> (planned)`
                    : `<strong>${c.courseCode}</strong>`;
                const note = c.notes ? `<span style="color:#666; font-size:12px;"> — ${c.notes}</span>` : '';
                const desc = (c.courseCode === '__new__' && c.newCourseDescription)
                    ? `<div style="font-size:12px; color:#666; margin-top:3px;">${c.newCourseDescription}</div>`
                    : '';
                return `<li style="margin-bottom:6px;">${code}${note}${desc}</li>`;
            }).join('');
            return `
                <div style="background:${bg}; border:1px solid ${border}; border-left:3px solid ${color}; border-radius:5px; padding:10px 14px; margin-bottom:10px;">
                    <div style="font-size:11px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                        ${label} (${list.length})
                    </div>
                    <ul style="margin:0; padding-left:18px; font-size:13px;">${items}</ul>
                </div>
            `;
        };

        const changeSection = [
            renderChangeGroup('new', byDisposition.new),
            renderChangeGroup('modification', byDisposition.modification),
            renderChangeGroup('elimination', byDisposition.elimination),
            renderChangeGroup('existing', byDisposition.existing),
        ].join('');

        // ── 2. Competency coverage ────────────────────────────────────────────
        const ALL_COMPETENCIES = [
            'Inquiry', 'Integration', 'Global/Cultural Awareness', 'Analysis',
            'Diversity, Equity & Inclusion', 'Communication', 'Collaboration',
            'Creativity', 'Scientific Literacy', 'Information Literacy',
            'Technology Literacy', 'Quantitative Literacy'
        ];
        // Count how many courses cover each competency
        const compCounts = {};
        ALL_COMPETENCIES.forEach(c => { compCounts[c] = 0; });
        courses.forEach(c => {
            const comps = Array.isArray(c.competencies) ? c.competencies : [];
            comps.forEach(comp => {
                // Normalise variant names that may appear in older data
                const normalized = ALL_COMPETENCIES.find(
                    a => a.toLowerCase() === comp.toLowerCase() ||
                         a.replace(/[^a-z]/gi,'').toLowerCase() === comp.replace(/[^a-z]/gi,'').toLowerCase()
                ) || comp;
                if (compCounts[normalized] !== undefined) compCounts[normalized]++;
            });
        });

        const covered   = ALL_COMPETENCIES.filter(c => compCounts[c] > 0);
        const uncovered = ALL_COMPETENCIES.filter(c => compCounts[c] === 0);

        const compPills = ALL_COMPETENCIES.map(c => {
            const count = compCounts[c];
            const isCovered = count > 0;
            const bg     = isCovered ? 'var(--champlain-navy)' : '#eee';
            const fg     = isCovered ? 'white'                 : '#aaa';
            const badge  = isCovered
                ? `<span style="background:rgba(255,255,255,0.25); border-radius:8px; padding:0 5px; font-size:10px; margin-left:4px;">${count}</span>`
                : '';
            return `<span style="display:inline-flex; align-items:center; background:${bg}; color:${fg}; padding:4px 10px; border-radius:14px; font-size:11px; font-weight:600; margin:3px; white-space:nowrap;">${c}${badge}</span>`;
        }).join('');

        const coveragePercent = Math.round((covered.length / ALL_COMPETENCIES.length) * 100);
        const barColor = coveragePercent >= 75 ? 'var(--champlain-green)'
                       : coveragePercent >= 50 ? 'var(--champlain-bright-blue)'
                       : '#ff9800';

        const competencySection = `
            <div style="margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; font-weight:600; color:#444;">Coverage: ${covered.length} / ${ALL_COMPETENCIES.length} competencies (${coveragePercent}%)</span>
            </div>
            <div style="background:#eee; border-radius:4px; height:6px; margin-bottom:12px; overflow:hidden;">
                <div style="width:${coveragePercent}%; background:${barColor}; height:100%; border-radius:4px; transition:width 0.4s;"></div>
            </div>
            <div style="line-height:1.8;">${compPills}</div>
            ${uncovered.length > 0
                ? `<p style="margin:10px 0 0; font-size:12px; color:#888;">Not addressed: ${uncovered.join(', ')}</p>`
                : '<p style="margin:10px 0 0; font-size:12px; color:var(--champlain-green); font-weight:600;">✓ All competencies addressed</p>'
            }
        `;

        // ── 3. Prerequisite scope ─────────────────────────────────────────────
        const packCodes = new Set(courses.map(c => c.courseCode).filter(Boolean));
        const externalPrereqs = new Set();
        const withPrereqs = [];
        courses.forEach(c => {
            const prereqs = Array.isArray(c.prerequisites) ? c.prerequisites : [];
            if (prereqs.length > 0) {
                const external = prereqs.filter(p => !packCodes.has(p));
                if (external.length > 0) external.forEach(p => externalPrereqs.add(p));
                withPrereqs.push({ code: c.courseCode, prereqs, external });
            }
        });

        let prereqSection = '<p style="font-size:13px; color:#666;">No prerequisite requirements within this skill pack.</p>';
        if (withPrereqs.length > 0) {
            const rows = withPrereqs.map(({ code, prereqs, external }) => {
                const tags = prereqs.map(p => {
                    const isInternal = packCodes.has(p);
                    const bg = isInternal ? 'var(--champlain-blue)' : '#ff9800';
                    return `<span style="background:${bg}; color:white; padding:2px 8px; border-radius:10px; font-size:11px; white-space:nowrap;">${p}</span>`;
                }).join(' ');
                return `<div style="margin-bottom:6px; font-size:13px;"><strong>${code}</strong> requires: ${tags}</div>`;
            }).join('');
            const legend = `
                <div style="font-size:11px; color:#888; margin-bottom:8px; display:flex; gap:10px; flex-wrap:wrap;">
                    <span><span style="background:var(--champlain-blue); color:white; padding:1px 6px; border-radius:8px; font-size:10px;">code</span> within this skill pack</span>
                    <span><span style="background:#ff9800; color:white; padding:1px 6px; border-radius:8px; font-size:10px;">code</span> external prerequisite</span>
                </div>
            `;
            const externalNote = externalPrereqs.size > 0
                ? `<p style="font-size:12px; color:#e65100; margin-top:8px;">⚠ Students will need prior completion of: ${[...externalPrereqs].join(', ')}</p>`
                : `<p style="font-size:12px; color:var(--champlain-green); margin-top:8px;">✓ All prerequisites are fulfilled within this skill pack.</p>`;
            prereqSection = legend + rows + externalNote;
        }

        // ── 4. Generated impact narrative ─────────────────────────────────────
        const programs = (proposal.affiliatedPrograms && proposal.affiliatedPrograms.length > 0)
            ? proposal.affiliatedPrograms
            : (proposal.affiliatedProgram ? [proposal.affiliatedProgram] : []);

        const narrativeParts = [];
        if (programs.length > 0) {
            narrativeParts.push(`This skill pack directly affects <strong>${programs.join(' and ')}</strong>.`);
        }
        if (byDisposition.new.length > 0) {
            const names = byDisposition.new.map(c =>
                c.courseCode === '__new__' ? (c.placeholderName || 'a new course') : c.courseCode
            ).join(', ');
            narrativeParts.push(`It introduces ${byDisposition.new.length} new course${byDisposition.new.length > 1 ? 's' : ''} (${names}), which will require curriculum committee approval and resource allocation.`);
        }
        if (byDisposition.modification.length > 0) {
            const names = byDisposition.modification.map(c => c.courseCode).join(', ');
            narrativeParts.push(`${byDisposition.modification.length} existing course${byDisposition.modification.length > 1 ? 's' : ''} (${names}) will require modifications — course owner coordination is needed.`);
        }
        if (byDisposition.elimination.length > 0) {
            const names = byDisposition.elimination.map(c => c.courseCode).join(', ');
            narrativeParts.push(`${byDisposition.elimination.length} course${byDisposition.elimination.length > 1 ? 's' : ''} (${names}) would be eliminated, potentially affecting students currently enrolled.`);
        }
        if (uncovered.length <= 3 && uncovered.length > 0) {
            narrativeParts.push(`Competency coverage is strong (${coveragePercent}%), with ${uncovered.join(' and ')} not yet addressed — consider whether additional content could close these gaps.`);
        } else if (covered.length === ALL_COMPETENCIES.length) {
            narrativeParts.push(`The skill pack achieves full competency coverage across all ${ALL_COMPETENCIES.length} institutional competencies.`);
        }
        if (externalPrereqs.size > 0) {
            narrativeParts.push(`Students entering this skill pack must have prior knowledge of ${[...externalPrereqs].join(', ')}, which may limit accessibility.`);
        }

        const generatedNarrative = narrativeParts.length > 0
            ? `<div style="font-size:13px; line-height:1.7; color:#444;">${narrativeParts.map(p => `<p style="margin:0 0 8px;">${p}</p>`).join('')}</div>`
            : '<p style="font-size:13px; color:#666;">Insufficient data to generate an impact narrative.</p>';

        const submittedNarrative = proposal.programImpact
            ? `<div style="margin-top:12px; padding:10px 14px; background:#f8f9fa; border-left:3px solid #ccc; border-radius:0 4px 4px 0; font-size:13px; color:#555; font-style:italic;">${proposal.programImpact}</div>`
            : '';

        // ── 5. Resources (still shown from submitted data) ────────────────────
        const resourceRows = [
            ['Technology', proposal.technologyRequirements],
            ['Library Resources', proposal.libraryResources],
        ].filter(([, v]) => v).map(([label, val]) =>
            `<p style="margin-bottom:8px;"><strong>${label}:</strong> ${val}</p>`
        ).join('') || '<p style="color:#666; font-size:13px;">No resource requirements specified.</p>';

        // ── Assemble ──────────────────────────────────────────────────────────
        const section = (title, content, color = '#fff3e0', icon = '') => `
            <div style="background:${color}; border-radius:6px; padding:14px 16px; margin-bottom:14px;">
                <h5 style="margin:0 0 10px; font-size:13px; color:var(--champlain-navy); text-transform:uppercase; letter-spacing:0.5px;">${icon} ${title}</h5>
                ${content}
            </div>
        `;

        return `
            ${section('Course Changes', changeSection || '<p style="color:#666; font-size:13px;">No courses listed.</p>', '#f8f9fa', '📋')}
            ${section('Competency Coverage', competencySection, '#e8f5e9', '🎯')}
            ${section('Prerequisite Scope', prereqSection, '#e3f2fd', '🔗')}
            ${section('Program Impact', generatedNarrative + submittedNarrative, '#fff3e0', '📊')}
            ${section('Resources', resourceRows, '#fafafa', '📦')}
        `;
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
                const isNew = c.courseCode === '__new__';
                const courseDisplay = isNew
                    ? `<span style="color:#e65100; font-style:italic;">NEW: ${c.placeholderName || 'TBD'}</span>`
                    : c.courseCode;
                const compsOrDesc = isNew
                    ? `<em style="color:#666; font-size:12px;">${c.newCourseDescription || '–'}</em>`
                    : (Array.isArray(c.competencies) && c.competencies.length > 0
                        ? c.competencies.join(', ')
                        : (c.competency || '–'));
                const prereqs = isNew
                    ? '<span style="color:#aaa;">N/A</span>'
                    : (Array.isArray(c.prerequisites) && c.prerequisites.length > 0
                        ? c.prerequisites.join(', ')
                        : (typeof c.prerequisites === 'string' && c.prerequisites ? c.prerequisites : 'None'));
                return `
                <tr${isNew ? ' style="background:#fff8e1;"' : ''}>
                    <td style="padding:8px; border:1px solid #ddd;">${courseDisplay}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${c.contribution || '–'}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${compsOrDesc}</td>
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
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Competencies / Description</th>
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

        // Build feedback history with styled type badges
        const _spFbMeta = (fb) => {
            const typeMap = {
                general:  { label: 'General Comment',    bg: '#e8f4fd', color: '#1565c0', border: '#90caf9' },
                revision: { label: 'Revision Requested', bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
                critical: { label: 'Critical Concern',   bg: '#fff3e0', color: '#bf360c', border: '#ffcc80' },
                reject:   { label: 'Rejected',           bg: '#fdecea', color: '#b71c1c', border: '#ef9a9a' },
            };
            let type = fb.feedbackType || 'general';
            let msg = fb.message || '';
            if (!fb.feedbackType) {
                if (msg.startsWith('[REJECTION]'))              { type = 'reject';   msg = msg.replace('[REJECTION]', '').trim(); }
                else if (msg.startsWith('[REVISION REQUESTED]')) { type = 'revision'; msg = msg.replace('[REVISION REQUESTED]', '').trim(); }
                else if (msg.startsWith('[CRITICAL CONCERN]'))   { type = 'critical'; msg = msg.replace('[CRITICAL CONCERN]', '').trim(); }
            }
            return { ...(typeMap[type] || typeMap.general), msg };
        };

        let feedbackSection = '';
        if (proposal.feedback && proposal.feedback.length > 0) {
            feedbackSection = `
                <div style="margin-top:24px;">
                    <h4 style="color:var(--champlain-navy); margin-bottom:14px; font-size:15px; display:flex; align-items:center; gap:8px;">
                        💬 Feedback History <span style="font-size:12px; font-weight:400; color:#888;">(${proposal.feedback.length} message${proposal.feedback.length > 1 ? 's' : ''})</span>
                    </h4>
                    ${proposal.feedback.map(fb => {
                        const { label, bg, color, border, msg } = _spFbMeta(fb);
                        return `
                        <div style="background:${bg}; border:1px solid ${border}; border-left:4px solid ${color}; border-radius:6px; padding:14px 16px; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="background:${color}; color:white; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; white-space:nowrap;">${label}</span>
                                    <span style="font-size:13px; font-weight:600; color:#333;">${fb.from}</span>
                                </div>
                                <span style="font-size:12px; color:#777;">${fb.date}</span>
                            </div>
                            <div style="font-size:14px; color:#333; line-height:1.6; white-space:pre-wrap;">${msg}</div>
                        </div>
                    `}).join('')}
                </div>
            `;
        }

        const detailsEl = document.getElementById('spProposalDetails');
        if (!detailsEl) return;

        // Build main content HTML string
        const contentHtml = `
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

                <div style="margin-bottom:15px;">
                    <h4 style="color:var(--champlain-navy); margin-bottom:12px;">Resources &amp; Impact</h4>
                    ${SkillPackProposalsModule._buildImpactSection(proposal)}
                </div>

                <p style="font-size:13px; color:#666; margin-top:20px;">
                    Submitted by: ${proposal.submittedBy} | ${proposal.submittedDate}
                </p>
                ${feedbackSection}
            </div>
        `;

        // Wrap content with inline-comments sidebar
        const isAdmin = Auth && Auth.hasRole && Auth.hasRole('Administrator');
        const inlineComments = proposal.inlineComments || [];
        detailsEl.innerHTML = InlineCommentsUI.wrapWithSidebar(contentHtml, inlineComments, id, true, isAdmin);

        const modal = document.getElementById('spDetailsModal');
        if (modal) modal.style.display = 'block';

        // Enable text-selection commenting for admins
        InlineCommentsUI.init();
        const mainContent = document.getElementById('ic-main-content');
        if (mainContent) InlineCommentsUI.enable(mainContent, id, true);
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

        FeedbackModal.open({
            title: 'Reject Skill Pack Proposal',
            subtitle: `Rejecting: ${proposal.skillPackName}   |   Submitted by: ${proposal.submittedBy}`,
            mode: 'reject',
            onSubmit: ({ message }) => {
                StateSetters.addSkillPackProposalFeedback(id, message, 'reject');
                StateSetters.updateSkillPackProposalStatus(id, 'rejected');
                SkillPackProposalsModule.showReviewQueue('pg-spReviewList', false);
            }
        });
    },

    sendFeedback: (id) => {
        const proposal = StateGetters.getSkillPackProposals().find(p => p.id === id);
        if (!proposal) return;

        FeedbackModal.open({
            title: 'Send Feedback',
            subtitle: `To: ${proposal.submittedBy}   |   Skill Pack: ${proposal.skillPackName}`,
            mode: 'feedback',
            onSubmit: ({ message, feedbackType }) => {
                const prefix = feedbackType === 'revision' ? '[REVISION REQUESTED] '
                             : feedbackType === 'critical' ? '[CRITICAL CONCERN] '
                             : '';
                StateSetters.addSkillPackProposalFeedback(id, prefix + message, feedbackType);
                SkillPackProposalsModule.showReviewQueue('pg-spReviewList', false);
            }
        });
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

            if (courseCode === '__new__') {
                // New (TBD) course — save placeholder name and description instead of competencies/prereqs
                courses.push({
                    courseCode: '__new__',
                    placeholderName: row.querySelector('.sp-new-course-name')?.value.trim() || '',
                    newCourseDescription: row.querySelector('.sp-new-course-description')?.value.trim() || '',
                    contribution: row.querySelector('.sp-course-contribution')?.value.trim() || '',
                    competencies: [],
                    prerequisites: [],
                    disposition: 'new',
                    notes: row.querySelector('.sp-course-notes')?.value.trim() || ''
                });
                return;
            }

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
