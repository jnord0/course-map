// Course Management Component - Comprehensive Edition
// Aligned with course.json nested structure

const CoursesModule = {
    currentEditTab: 'identity',
    editTabs: ['identity', 'outcomes', 'content', 'resources', 'metadata'],

    /**
     * Initialize course management module
     */
    init: () => {
        // Setup edit modal tab navigation
        CoursesModule.setupEditModalTabs();
    },

    /**
     * Setup tab navigation for edit modal
     */
    setupEditModalTabs: () => {
        const tabs = document.querySelectorAll('.edit-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                CoursesModule.switchEditTab(targetTab);
            });
        });

        // Setup navigation buttons
        const prevBtn = document.getElementById('editPrevTab');
        const nextBtn = document.getElementById('editNextTab');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => CoursesModule.navigateEditTabs(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => CoursesModule.navigateEditTabs(1));
        }
    },

    /**
     * Switch to a specific edit tab
     * @param {string} tabName
     */
    switchEditTab: (tabName) => {
        CoursesModule.currentEditTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.edit-tab').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
                tab.style.background = 'var(--champlain-navy)';
                tab.style.color = 'white';
            } else {
                tab.classList.remove('active');
                tab.style.background = '#f0f0f0';
                tab.style.color = '#666';
            }
        });

        // Update tab content
        document.querySelectorAll('.edit-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`edit-tab-${tabName}`).classList.remove('hidden');

        // Update progress bar
        const tabIndex = CoursesModule.editTabs.indexOf(tabName);
        document.querySelectorAll('[id^="edit-progress-"]').forEach((bar, index) => {
            if (index <= tabIndex) {
                const inner = bar.querySelector('div');
                if (inner) inner.style.transform = 'translateX(0)';
                else bar.style.background = 'white';
            } else {
                const inner = bar.querySelector('div');
                if (inner) inner.style.transform = 'translateX(-100%)';
                else bar.style.background = 'rgba(255,255,255,0.3)';
            }
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('editPrevTab');
        const nextBtn = document.getElementById('editNextTab');
        const saveBtn = document.getElementById('saveEditCourse');

        if (prevBtn) prevBtn.style.display = tabIndex === 0 ? 'none' : 'block';
        if (nextBtn) nextBtn.style.display = tabIndex === CoursesModule.editTabs.length - 1 ? 'none' : 'block';
        if (saveBtn) {
            if (tabIndex === CoursesModule.editTabs.length - 1) {
                saveBtn.classList.remove('hidden');
            } else {
                saveBtn.classList.add('hidden');
            }
        }
    },

    /**
     * Navigate between edit tabs
     * @param {number} direction - -1 for previous, 1 for next
     */
    navigateEditTabs: (direction) => {
        const currentIndex = CoursesModule.editTabs.indexOf(CoursesModule.currentEditTab);
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < CoursesModule.editTabs.length) {
            CoursesModule.switchEditTab(CoursesModule.editTabs[newIndex]);
        }
    },

    /**
     * Update available courses list with search filter
     * @param {string} searchTerm
     */
    updateAvailableCourses: (searchTerm = '') => {
        // Update text search in filters
        const filters = StateGetters.getActiveFilters();
        filters.textSearch = searchTerm;
        StateSetters.setActiveFilters(filters);

        // Apply all filters and update display
        FilterModule.applyFiltersAndUpdate();
    },

    /**
     * Update selected courses display
     */
    updateSelectedCourses: () => {
        const selectedDiv = document.getElementById('selectedCourses');
        const selectedCourses = StateGetters.getSelectedCourses();

        if (selectedCourses.length === 0) {
            selectedDiv.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px; padding: 10px;">No courses selected</p>';
        } else {
            selectedDiv.innerHTML = selectedCourses.map(course => `
                <div class="selected-course-item">
                    <span><strong>${course.code}</strong> - ${course.name}</span>
                    <button class="remove-course-btn" onclick="CoursesModule.removeCourseSelection(${course.id})">Remove</button>
                </div>
            `).join('');
        }
    },

    /**
     * Toggle course selection for visualization
     * @param {number} courseId
     */
    toggleCourseSelection: (courseId) => {
        StateSetters.toggleCourseSelection(courseId);
        const searchInput = document.getElementById('courseSearch');
        CoursesModule.updateAvailableCourses(searchInput ? searchInput.value : '');
        CoursesModule.updateSelectedCourses();
        CompetenciesModule.updateTracker();

        // Update similar courses display
        if (typeof FilterModule !== 'undefined' && FilterModule.updateSimilarCourses) {
            FilterModule.updateSimilarCourses();
        }
    },

    /**
     * Remove course from selection
     * @param {number} courseId
     */
    removeCourseSelection: (courseId) => {
        StateSetters.removeCourseSelection(courseId);
        const searchInput = document.getElementById('courseSearch');
        CoursesModule.updateAvailableCourses(searchInput ? searchInput.value : '');
        CoursesModule.updateSelectedCourses();
        CompetenciesModule.updateTracker();

        // Update similar courses display
        if (typeof FilterModule !== 'undefined' && FilterModule.updateSimilarCourses) {
            FilterModule.updateSimilarCourses();
        }
    },

    /**
     * Show manage courses modal (admin only)
     */
    showManageModal: () => {
        CoursesModule.updateCoursesList();
        CoursesModule.updateCompetenciesList();
        CoursesModule.updateObjectivesList();
        CoursesModule.updateSystemStats();
        document.getElementById('manageModal').style.display = 'block';

        // Setup search listener
        const searchInput = document.getElementById('manageCourseSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.addEventListener('input', (e) => {
                CoursesModule.updateCoursesList(e.target.value);
            });
        }
    },

    /**
     * Update courses list in manage modal
     * @param {string} searchTerm
     */
    updateCoursesList: (searchTerm = '') => {
        const listDiv = document.getElementById('coursesList');
        const courses = StateGetters.getCourses();

        const filteredCourses = courses.filter(course => {
            const matchesSearch = searchTerm === '' ||
                course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });

        if (filteredCourses.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666;">No courses found</p>';
        } else {
            listDiv.innerHTML = filteredCourses.map(course => {
                // Get competency names from object keys with weights
                const compEntries = Object.entries(course.competencies || {});
                const compNames = compEntries
                    .filter(([id, weight]) => weight > 0)
                    .map(([compId, weight]) => {
                        const comp = StateGetters.getCompetencies().find(comp => comp.id === compId);
                        const name = comp ? comp.name : compId;
                        const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
                        return `${symbol} ${name}`;
                    }).join(', ');

                return `
                    <div class="proposal-card">
                        <div class="proposal-header">
                            <div class="proposal-title">${course.code}: ${course.name}</div>
                        </div>
                        <div class="proposal-info">
                            <div style="margin-bottom: 4px;"><strong>Credits:</strong> ${course.creditHours || 'N/A'}</div>
                            <div style="margin-bottom: 4px;"><strong>Prerequisites:</strong> ${course.prerequisites || 'None'}</div>
                            <div style="margin-bottom: 4px;"><strong>Competencies:</strong> ${compNames || 'None'}</div>
                            ${course.description ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">${course.description.substring(0, 100)}...</div>` : ''}
                        </div>
                        <div class="proposal-actions">
                            <button class="action-btn btn-view" onclick="CoursesModule.editCourse(${course.id})">✏️ Edit</button>
                            <button class="action-btn btn-reject" onclick="CoursesModule.deleteCourse(${course.id})">🗑️ Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    /**
     * Update competencies list in manage modal
     */
    updateCompetenciesList: () => {
        const listDiv = document.getElementById('competenciesList');
        const competencies = StateGetters.getCompetencies();
        const courses = StateGetters.getCourses();

        listDiv.innerHTML = competencies.map(comp => {
            // Count how many courses address this competency
            const courseCount = courses.filter(course => {
                return Object.keys(course.competencies || {}).includes(comp.id);
            }).length;

            const emphasizedCount = courses.filter(course => {
                return (course.competencies || {})[comp.id] === 3;
            }).length;

            return `
                <div class="competency-manage-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 600; color: var(--champlain-navy); font-size: 15px;">${comp.name}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">ID: ${comp.id}</div>
                        </div>
                        <button class="small-action-btn" onclick="CoursesModule.editCompetency('${comp.id}')" title="Edit Competency">
                            ✏️
                        </button>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 10px;">
                        <div style="font-size: 12px;">
                            <span style="color: #666;">Courses:</span>
                            <strong style="color: var(--champlain-blue);">${courseCount}</strong>
                        </div>
                        <div style="font-size: 12px;">
                            <span style="color: #666;">Emphasized:</span>
                            <strong style="color: var(--champlain-green);">${emphasizedCount}</strong>
                        </div>
                    </div>
                </div>
            `;
        }).join('') + `
            <button class="btn" onclick="CoursesModule.addCompetency()" style="margin-top: 15px;">
                + Add New Competency
            </button>
        `;
    },

    /**
     * Update learning objectives list in manage modal
     */
    updateObjectivesList: () => {
        const listDiv = document.getElementById('objectivesList');

        // Get unique PLOs and CLOs from courses
        const allPLOs = new Set();
        const allCLOs = new Set();

        StateGetters.getCourses().forEach(course => {
            if (course.plos) course.plos.forEach(plo => allPLOs.add(plo));
            if (course.clos) course.clos.forEach(clo => allCLOs.add(clo));
        });

        const ploArray = Array.from(allPLOs).sort();
        const cloArray = Array.from(allCLOs).sort();

        listDiv.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--champlain-navy); font-size: 14px; margin-bottom: 10px;">Program Learning Objectives (PLOs)</h4>
                ${ploArray.length > 0 ? ploArray.map(plo => `
                    <div class="objective-item">
                        <span>${plo.toUpperCase()}</span>
                    </div>
                `).join('') : '<p style="color: #999; font-size: 13px;">No PLOs defined</p>'}
                <button class="btn" onclick="CoursesModule.managePLOs()" style="margin-top: 10px; font-size: 13px;">
                    Manage PLOs
                </button>
            </div>

            <div>
                <h4 style="color: var(--champlain-navy); font-size: 14px; margin-bottom: 10px;">Course Learning Objectives (CLOs)</h4>
                ${cloArray.length > 0 ? cloArray.map(clo => `
                    <div class="objective-item">
                        <span>${clo.toUpperCase()}</span>
                    </div>
                `).join('') : '<p style="color: #999; font-size: 13px;">No CLOs defined</p>'}
                <button class="btn" onclick="CoursesModule.manageCLOs()" style="margin-top: 10px; font-size: 13px;">
                    Manage CLOs
                </button>
            </div>
        `;
    },

    /**
     * Update system statistics
     */
    updateSystemStats: () => {
        const statsDiv = document.getElementById('systemStats');
        if (!statsDiv) return;

        const courses = StateGetters.getCourses();
        const competencies = StateGetters.getCompetencies();
        const proposals = StateGetters.getProposals();

        const pendingProposals = proposals.filter(p => p.status === 'pending').length;
        const approvedProposals = proposals.filter(p => p.status === 'approved').length;

        // Calculate average competencies per course
        const avgCompetencies = courses.length > 0
            ? (courses.reduce((sum, course) => sum + Object.keys(course.competencies || {}).length, 0) / courses.length).toFixed(1)
            : 0;

        statsDiv.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="stat-card" style="background: linear-gradient(135deg, #4CAF50, #45a049);">
                    <div class="stat-value">${courses.length}</div>
                    <div class="stat-label">Total Courses</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #2196F3, #1976D2);">
                    <div class="stat-value">${competencies.length}</div>
                    <div class="stat-label">Competencies</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #FF9800, #F57C00);">
                    <div class="stat-value">${pendingProposals}</div>
                    <div class="stat-label">Pending Proposals</div>
                </div>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                    <strong>Approved Proposals:</strong> ${approvedProposals}
                </div>
                <div style="font-size: 13px; color: #666;">
                    <strong>Avg Competencies/Course:</strong> ${avgCompetencies}
                </div>
            </div>
        `;
    },

    /**
     * Edit competency
     * @param {string} compId
     */
    editCompetency: (compId) => {
        const competencies = StateGetters.getCompetencies();
        const comp = competencies.find(c => c.id === compId);

        if (!comp) return;

        const newName = prompt('Edit Competency Name:', comp.name);

        if (newName && newName.trim() !== '') {
            comp.name = newName.trim();
            CoursesModule.updateCompetenciesList();
            alert('Competency updated successfully!');
        }
    },

    /**
     * Add new competency
     */
    addCompetency: () => {
        const name = prompt('Enter new competency name:');

        if (!name || name.trim() === '') return;

        const id = prompt('Enter competency ID (lowercase, no spaces):',
            name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));

        if (!id || id.trim() === '') return;

        const competencies = StateGetters.getCompetencies();

        // Check if ID already exists
        if (competencies.find(c => c.id === id)) {
            alert('A competency with this ID already exists!');
            return;
        }

        competencies.push({
            id: id.trim(),
            name: name.trim()
        });

        CoursesModule.updateCompetenciesList();
        alert('Competency added successfully!');
    },

    /**
     * Manage PLOs
     */
    managePLOs: () => {
        alert('PLO Management - Coming Soon!\n\nThis feature will allow you to:\n• Add new PLOs\n• Edit existing PLOs\n• Delete unused PLOs\n• Map PLOs to courses');
    },

    /**
     * Manage CLOs
     */
    manageCLOs: () => {
        alert('CLO Management - Coming Soon!\n\nThis feature will allow you to:\n• Add new CLOs\n• Edit existing CLOs\n• Delete unused CLOs\n• Map CLOs to courses');
    },

    /**
     * Show add/edit course modal
     * @param {number|null} courseId
     */
    showEditModal: (courseId = null) => {
        StateSetters.setEditingCourse(courseId);
        CoursesModule.switchEditTab('identity'); // Start at first tab

        const competencies = StateGetters.getCompetencies();
        const currentUser = StateGetters.getCurrentUser();

        if (courseId) {
            // Edit existing course
            const course = StateGetters.getCourses().find(c => c.id === courseId);
            if (!course) return;

            document.getElementById('editCourseTitle').textContent = 'Edit Course';
            CoursesModule.populateEditForm(course, competencies);
        } else {
            // Add new course
            document.getElementById('editCourseTitle').textContent = 'Add New Course';
            CoursesModule.clearEditForm();
            CoursesModule.buildCompetencyMapping(competencies, {});

            // Set defaults
            document.getElementById('editCreatedBy').value = currentUser || '';
            document.getElementById('editVersion').value = '0.1.0';
            document.getElementById('editStatus').value = 'ACTIVE';
            document.getElementById('editReviewStatus').value = 'APPROVED';
            document.getElementById('editEffectiveTerm').value = 'FALL';
            document.getElementById('editEffectiveYear').value = '2025';
            document.getElementById('editInstructionalMethod').value = 'STANDARD';
        }

        // Setup dynamic list handlers
        CoursesModule.setupDynamicLists();

        document.getElementById('editCourseModal').style.display = 'block';
    },

    /**
     * Populate edit form with course data
     * @param {Object} course
     * @param {Array} competencies
     */
    populateEditForm: (course, competencies) => {
        // Tab 1: Course Identity
        const codeMatch = course.code.match(/^([A-Z]+)-?(\d+)$/);
        if (codeMatch) {
            document.getElementById('editCoursePrefix').value = codeMatch[1];
            document.getElementById('editCourseNumber').value = codeMatch[2];
        }

        document.getElementById('editCourseTitle_field').value = course.name || '';
        document.getElementById('editTranscriptTitle').value = course.transcriptTitle || course.name || '';
        document.getElementById('editCatalogDescription').value = course.description || '';
        document.getElementById('editCreditHours').value = course.creditHours || '';
        document.getElementById('editFacultyLoad').value = course.facultyLoad || '';
        document.getElementById('editCapacity').value = course.capacity || '';
        document.getElementById('editCourseType').value = course.courseType || '';
        document.getElementById('editCourseSubcategory').value = course.subcategory || '';
        document.getElementById('editSemesterOffered').value = course.semesterOffered || 'BOTH';
        document.getElementById('editInstructionalMethod').value = course.instructionalMethod || 'STANDARD';
        document.getElementById('editEffectiveTerm').value = course.effectiveTerm || 'FALL';
        document.getElementById('editEffectiveYear').value = course.effectiveYear || 2025;
        document.getElementById('editPrerequisites').value = course.prerequisites || '';

        // Tab 2: Learning Outcomes
        CoursesModule.populateCLOs(course.clos || []);
        CoursesModule.populatePLOs(course.plos || []);
        CoursesModule.buildCompetencyMapping(competencies, course.competencies || {});

        // Tab 3: Course Content
        document.getElementById('editTopicalOutline').value = course.topicalOutline || '';
        CoursesModule.populateAssessments(course.assessments || []);

        // Tab 4: Resources
        document.getElementById('editFacilityType').value = course.facilityType || '';
        document.getElementById('editFacilityRequirements').value = course.facilityRequirements || '';
        document.getElementById('editTechnologyRequirements').value = course.technologyRequirements || '';
        document.getElementById('editLibraryResources').value = course.libraryResources || '';
        document.getElementById('editOtherResources').value = course.otherResources || '';

        // Tab 5: Metadata
        document.getElementById('editVersion').value = course.version || '0.1.0';
        document.getElementById('editCreatedBy').value = course.createdBy || '';
        document.getElementById('editStatus').value = course.status || 'ACTIVE';
        document.getElementById('editReviewStatus').value = course.reviewStatus || 'APPROVED';
        document.getElementById('editProposalId').value = course.proposalId || '';
        document.getElementById('editNotes').value = course.notes || '';
    },

    /**
     * Clear all form fields
     */
    clearEditForm: () => {
        document.querySelectorAll('#editCourseForm input, #editCourseForm textarea, #editCourseForm select').forEach(field => {
            if (field.type === 'number') field.value = '';
            else if (field.type !== 'button' && field.type !== 'submit') field.value = '';
        });

        // Reset dynamic lists to one item each
        document.getElementById('editClosContainer').innerHTML = CoursesModule.getCLOTemplate();
        document.getElementById('editPlosContainer').innerHTML = CoursesModule.getPLOTemplate();
        document.getElementById('editAssessmentsContainer').innerHTML = CoursesModule.getAssessmentTemplate();
    },

    /**
     * Build competency mapping UI
     * @param {Array} competencies
     * @param {Object} currentMapping
     */
    buildCompetencyMapping: (competencies, currentMapping) => {
        const container = document.getElementById('editCompetencyMapping');
        container.innerHTML = competencies.map(comp => {
            const currentWeight = currentMapping[comp.id] || 0;
            return `
                <div class="competency-weight-option">
                    <label for="edit_comp_${comp.id}" style="flex: 1; margin: 0; font-weight: 600;">${comp.name}</label>
                    <select id="edit_comp_${comp.id}" class="competency-weight-select">
                        <option value="0" ${currentWeight === 0 ? 'selected' : ''}>Not Selected</option>
                        <option value="1" ${currentWeight === 1 ? 'selected' : ''}>Addressed (1)</option>
                        <option value="2" ${currentWeight === 2 ? 'selected' : ''}>Reinforced (2)</option>
                        <option value="3" ${currentWeight === 3 ? 'selected' : ''}>Emphasized (3)</option>
                    </select>
                </div>
            `;
        }).join('');
    },

    /**
     * Get CLO template HTML
     */
    getCLOTemplate: () => {
        return `
            <div class="edit-clo-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #2196F3;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" class="edit-clo-id" placeholder="CLO ID (e.g., CLO1)" style="width: 120px; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
                    <input type="text" class="edit-clo-desc" placeholder="CLO description" style="flex: 1; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
                    <button type="button" class="remove-edit-clo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                </div>
                <input type="text" class="edit-clo-plos" placeholder="Linked PLO IDs (comma-separated, e.g., PLO1,PLO2)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
            </div>
        `;
    },

    /**
     * Get PLO template HTML
     */
    getPLOTemplate: () => {
        return `
            <div class="edit-plo-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #9C27B0;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" class="edit-plo-id" placeholder="PLO ID (e.g., PLO1)" style="width: 120px; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
                    <input type="text" class="edit-plo-desc" placeholder="PLO description" style="flex: 1; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
                    <button type="button" class="remove-edit-plo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                </div>
                <input type="text" class="edit-plo-comps" placeholder="Linked competency codes (comma-separated, e.g., INQ,ANL)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
            </div>
        `;
    },

    /**
     * Get Assessment template HTML
     */
    getAssessmentTemplate: () => {
        return `
            <div class="edit-assessment-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid var(--champlain-green);">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" class="edit-assessment-name" placeholder="Assessment name" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 4px;">
                    <button type="button" class="remove-edit-assessment" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                </div>
                <textarea class="edit-assessment-desc" placeholder="Description..." rows="2" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px; resize: vertical; margin-bottom: 8px;"></textarea>
                <input type="text" class="edit-assessment-clos" placeholder="Linked CLO IDs (comma-separated, e.g., CLO1,CLO2)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
            </div>
        `;
    },

    /**
     * Populate CLOs in form
     * @param {Array} clos
     */
    populateCLOs: (clos) => {
        const container = document.getElementById('editClosContainer');
        if (!clos || clos.length === 0) {
            container.innerHTML = CoursesModule.getCLOTemplate();
        } else {
            container.innerHTML = clos.map(clo => `
                <div class="edit-clo-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #2196F3;">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="edit-clo-id" placeholder="CLO ID" value="${clo.id || ''}" style="width: 120px; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
                        <input type="text" class="edit-clo-desc" placeholder="CLO description" value="${clo.description || ''}" style="flex: 1; padding: 10px; border: 2px solid #2196F3; border-radius: 4px;">
                        <button type="button" class="remove-edit-clo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                    <input type="text" class="edit-clo-plos" placeholder="Linked PLO IDs" value="${(clo.linkedPLOs || []).join(', ')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                </div>
            `).join('');
        }
    },

    /**
     * Populate PLOs in form
     * @param {Array} plos
     */
    populatePLOs: (plos) => {
        const container = document.getElementById('editPlosContainer');
        if (!plos || plos.length === 0) {
            container.innerHTML = CoursesModule.getPLOTemplate();
        } else {
            container.innerHTML = plos.map(plo => `
                <div class="edit-plo-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #9C27B0;">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="edit-plo-id" placeholder="PLO ID" value="${plo.id || ''}" style="width: 120px; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
                        <input type="text" class="edit-plo-desc" placeholder="PLO description" value="${plo.description || ''}" style="flex: 1; padding: 10px; border: 2px solid #9C27B0; border-radius: 4px;">
                        <button type="button" class="remove-edit-plo" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                    <input type="text" class="edit-plo-comps" placeholder="Linked competencies" value="${(plo.competencies || []).join(', ')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                </div>
            `).join('');
        }
    },

    /**
     * Populate assessments in form
     * @param {Array} assessments
     */
    populateAssessments: (assessments) => {
        const container = document.getElementById('editAssessmentsContainer');
        if (!assessments || assessments.length === 0) {
            container.innerHTML = CoursesModule.getAssessmentTemplate();
        } else {
            container.innerHTML = assessments.map(assessment => `
                <div class="edit-assessment-item" style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid var(--champlain-green);">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" class="edit-assessment-name" placeholder="Assessment name" value="${assessment.name || ''}" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 4px;">
                        <button type="button" class="remove-edit-assessment" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                    <textarea class="edit-assessment-desc" placeholder="Description..." rows="2" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px; resize: vertical; margin-bottom: 8px;">${assessment.description || ''}</textarea>
                    <input type="text" class="edit-assessment-clos" placeholder="Linked CLO IDs" value="${(assessment.linkedCLOs || []).join(', ')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                </div>
            `).join('');
        }
    },

    /**
     * Setup dynamic list handlers (add/remove items)
     */
    setupDynamicLists: () => {
        // CLO handlers
        document.getElementById('addEditCLO').onclick = () => {
            document.getElementById('editClosContainer').insertAdjacentHTML('beforeend', CoursesModule.getCLOTemplate());
            CoursesModule.attachRemoveHandlers();
        };

        // PLO handlers
        document.getElementById('addEditPLO').onclick = () => {
            document.getElementById('editPlosContainer').insertAdjacentHTML('beforeend', CoursesModule.getPLOTemplate());
            CoursesModule.attachRemoveHandlers();
        };

        // Assessment handlers
        document.getElementById('addEditAssessment').onclick = () => {
            document.getElementById('editAssessmentsContainer').insertAdjacentHTML('beforeend', CoursesModule.getAssessmentTemplate());
            CoursesModule.attachRemoveHandlers();
        };

        // Attach remove handlers
        CoursesModule.attachRemoveHandlers();
    },

    /**
     * Attach remove button handlers
     */
    attachRemoveHandlers: () => {
        document.querySelectorAll('.remove-edit-clo').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.edit-clo-item').remove();
            };
        });

        document.querySelectorAll('.remove-edit-plo').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.edit-plo-item').remove();
            };
        });

        document.querySelectorAll('.remove-edit-assessment').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.edit-assessment-item').remove();
            };
        });
    },

    /**
     * Edit course
     * @param {number} id
     */
    editCourse: (id) => {
        CoursesModule.showEditModal(id);
    },

    /**
     * Delete course
     * @param {number} id
     */
    deleteCourse: (id) => {
        const course = StateGetters.getCourses().find(c => c.id === id);
        if (!course) return;

        if (confirm(`Are you sure you want to delete "${course.code}: ${course.name}"?\n\nThis action cannot be undone.`)) {
            StateSetters.deleteCourse(id);
            CoursesModule.updateCoursesList();
            CoursesModule.updateAvailableCourses();
            CoursesModule.updateSystemStats();
            CompetenciesModule.updateTracker();
            alert('Course deleted successfully!');
        }
    },

    /**
     * Save course from edit modal
     * @param {Event} e
     */
    saveCourse: (e) => {
        e.preventDefault();

        // Gather all form data
        const prefix = document.getElementById('editCoursePrefix').value.trim().toUpperCase();
        const number = document.getElementById('editCourseNumber').value.trim();
        const courseCode = `${prefix}-${number}`;

        // Collect competency mapping
        const competencies = {};
        let hasAtLeastOne = false;
        StateGetters.getCompetencies().forEach(comp => {
            const select = document.getElementById(`edit_comp_${comp.id}`);
            if (select) {
                const weight = parseInt(select.value);
                if (weight > 0) {
                    competencies[comp.id] = weight;
                    hasAtLeastOne = true;
                }
            }
        });

        if (!hasAtLeastOne) {
            alert('Please select at least one competency with a weight greater than 0');
            return;
        }

        // Collect CLOs
        const clos = [];
        document.querySelectorAll('.edit-clo-item').forEach(item => {
            const id = item.querySelector('.edit-clo-id').value.trim();
            const desc = item.querySelector('.edit-clo-desc').value.trim();
            const plosStr = item.querySelector('.edit-clo-plos').value.trim();
            if (id && desc) {
                clos.push({
                    id: id,
                    description: desc,
                    linkedPLOs: plosStr ? plosStr.split(',').map(p => p.trim()).filter(p => p) : []
                });
            }
        });

        // Collect PLOs
        const plos = [];
        document.querySelectorAll('.edit-plo-item').forEach(item => {
            const id = item.querySelector('.edit-plo-id').value.trim();
            const desc = item.querySelector('.edit-plo-desc').value.trim();
            const compsStr = item.querySelector('.edit-plo-comps').value.trim();
            if (id && desc) {
                plos.push({
                    id: id,
                    description: desc,
                    competencies: compsStr ? compsStr.split(',').map(c => c.trim()).filter(c => c) : []
                });
            }
        });

        // Collect Assessments
        const assessments = [];
        document.querySelectorAll('.edit-assessment-item').forEach(item => {
            const name = item.querySelector('.edit-assessment-name').value.trim();
            const desc = item.querySelector('.edit-assessment-desc').value.trim();
            const closStr = item.querySelector('.edit-assessment-clos').value.trim();
            if (name) {
                assessments.push({
                    name: name,
                    description: desc,
                    linkedCLOs: closStr ? closStr.split(',').map(c => c.trim()).filter(c => c) : []
                });
            }
        });

        // Build comprehensive course data object
        const courseData = {
            // Basic identity (legacy format for compatibility)
            code: courseCode,
            name: document.getElementById('editCourseTitle_field').value.trim(),
            description: document.getElementById('editCatalogDescription').value.trim(),
            creditHours: parseInt(document.getElementById('editCreditHours').value),
            prerequisites: document.getElementById('editPrerequisites').value.trim(),
            competencies: competencies,

            // Extended identity fields
            transcriptTitle: document.getElementById('editTranscriptTitle').value.trim() || document.getElementById('editCourseTitle_field').value.trim(),
            facultyLoad: parseInt(document.getElementById('editFacultyLoad').value) || parseInt(document.getElementById('editCreditHours').value),
            capacity: parseInt(document.getElementById('editCapacity').value),
            courseType: document.getElementById('editCourseType').value,
            subcategory: document.getElementById('editCourseSubcategory').value.trim(),
            semesterOffered: document.getElementById('editSemesterOffered').value,
            instructionalMethod: document.getElementById('editInstructionalMethod').value,
            effectiveTerm: document.getElementById('editEffectiveTerm').value,
            effectiveYear: parseInt(document.getElementById('editEffectiveYear').value),

            // Learning outcomes
            clos: clos,
            plos: plos,

            // Course content
            topicalOutline: document.getElementById('editTopicalOutline').value.trim(),
            assessments: assessments,

            // Resources
            facilityType: document.getElementById('editFacilityType').value,
            facilityRequirements: document.getElementById('editFacilityRequirements').value.trim(),
            technologyRequirements: document.getElementById('editTechnologyRequirements').value.trim(),
            libraryResources: document.getElementById('editLibraryResources').value.trim(),
            otherResources: document.getElementById('editOtherResources').value.trim(),

            // Metadata
            version: document.getElementById('editVersion').value.trim(),
            createdBy: document.getElementById('editCreatedBy').value.trim(),
            status: document.getElementById('editStatus').value,
            reviewStatus: document.getElementById('editReviewStatus').value,
            proposalId: document.getElementById('editProposalId').value.trim(),
            notes: document.getElementById('editNotes').value.trim()
        };

        // Validate prerequisites
        if (courseData.prerequisites && courseData.prerequisites.trim().length > 0) {
            const validation = PrerequisitesModule.validatePrerequisites(courseCode, courseData.prerequisites);

            if (!validation.isValid) {
                alert('Prerequisite Validation Errors:\n\n' + validation.errors.join('\n\n') +
                      '\n\nPlease fix these errors before saving.');
                return;
            }

            if (validation.warnings.length > 0) {
                const proceed = confirm('Prerequisite Warnings:\n\n' + validation.warnings.join('\n\n') +
                                      '\n\nDo you want to continue anyway?');
                if (!proceed) return;
            }
        }

        if (AppState.editingCourseId) {
            // Update existing course
            StateSetters.updateCourse(AppState.editingCourseId, courseData);
        } else {
            // Add new course
            StateSetters.addCourse(courseData);
        }

        CoursesModule.updateCoursesList();
        CoursesModule.updateAvailableCourses();
        CoursesModule.updateSystemStats();
        CompetenciesModule.updateTracker();
        ModalsModule.closeEditCourseModal();
        alert(AppState.editingCourseId ? 'Course updated successfully!' : 'Course added successfully!');
    }
};
