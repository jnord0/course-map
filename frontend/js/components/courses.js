// Course Management Component

const CoursesModule = {
    /**
     * Update available courses list with search filter
     * @param {string} searchTerm 
     */
    updateAvailableCourses: (searchTerm = '') => {
        const availableDiv = document.getElementById('availableCourses');
        const courses = StateGetters.getCourses();
        
        // If no search term, show placeholder message
        if (searchTerm === '' || searchTerm.trim().length === 0) {
            availableDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 20px; font-size: 13px;">Type to search courses...</p>';
            return;
        }
        
        const filteredCourses = courses.filter(course => {
            const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
        
        if (filteredCourses.length === 0) {
            availableDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No courses found</p>';
        } else {
            availableDiv.innerHTML = filteredCourses.map(course => {
                // Get competency names from object keys
                const compNames = Object.keys(course.competencies || {}).map(compId => {
                    const comp = StateGetters.getCompetencies().find(comp => comp.id === compId);
                    return comp ? comp.name : compId;
                }).join(', ');
                
                const isSelected = AppState.selectedCourseIds.includes(course.id);
                
                return `
                    <div class="course-search-item ${isSelected ? 'selected' : ''}" 
                         onclick="CoursesModule.toggleCourseSelection(${course.id})">
                        <div class="course-search-code">${course.code}</div>
                        <div class="course-search-name">${course.name}</div>
                        <div class="course-search-comps">📚 ${compNames}</div>
                    </div>
                `;
            }).join('');
        }
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
        const competencies = StateGetters.getCompetencies();
        
        if (courseId) {
            // Edit existing course
            const course = StateGetters.getCourses().find(c => c.id === courseId);
            if (!course) return;
            
            document.getElementById('editCourseTitle').textContent = 'Edit Course';
            document.getElementById('editCourseCode').value = course.code;
            document.getElementById('editCourseName').value = course.name;
            document.getElementById('editCourseDescription').value = course.description || '';
            document.getElementById('editCreditHours').value = course.creditHours || '';
            document.getElementById('editPrerequisites').value = course.prerequisites || '';
            document.getElementById('editJustification').value = course.justification || '';
            
            // Build competency weight selectors with current selections
            const compDiv = document.getElementById('editCourseCompetencies');
            compDiv.innerHTML = competencies.map(comp => {
                const currentWeight = course.competencies[comp.id] || 0;
                return `
                    <div class="competency-option" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                        <label for="edit_${comp.id}" style="flex: 1; margin: 0;">${comp.name}</label>
                        <select id="edit_${comp.id}" style="width: 120px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="0" ${currentWeight === 0 ? 'selected' : ''}>None (0)</option>
                            <option value="1" ${currentWeight === 1 ? 'selected' : ''}>Addressed (1)</option>
                            <option value="2" ${currentWeight === 2 ? 'selected' : ''}>Reinforced (2)</option>
                            <option value="3" ${currentWeight === 3 ? 'selected' : ''}>Emphasized (3)</option>
                        </select>
                    </div>
                `;
            }).join('');
        } else {
            // Add new course
            document.getElementById('editCourseTitle').textContent = 'Add New Course';
            document.getElementById('editCourseCode').value = '';
            document.getElementById('editCourseName').value = '';
            document.getElementById('editCourseDescription').value = '';
            document.getElementById('editCreditHours').value = '';
            document.getElementById('editPrerequisites').value = '';
            document.getElementById('editJustification').value = '';
            
            // Build competency weight selectors
            const compDiv = document.getElementById('editCourseCompetencies');
            compDiv.innerHTML = competencies.map(comp => `
                <div class="competency-option" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                    <label for="edit_${comp.id}" style="flex: 1; margin: 0;">${comp.name}</label>
                    <select id="edit_${comp.id}" style="width: 120px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="0" selected>None (0)</option>
                        <option value="1">Addressed (1)</option>
                        <option value="2">Reinforced (2)</option>
                        <option value="3">Emphasized (3)</option>
                    </select>
                </div>
            `).join('');
        }
        
        document.getElementById('editCourseModal').style.display = 'block';
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
        
        const competencies = {};
        let hasAtLeastOne = false;
        
        StateGetters.getCompetencies().forEach(comp => {
            const select = document.getElementById(`edit_${comp.id}`);
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
        
        const courseCode = document.getElementById('editCourseCode').value;
        const courseName = document.getElementById('editCourseName').value;
        const courseDescription = document.getElementById('editCourseDescription').value;
        const creditHours = document.getElementById('editCreditHours').value;
        const prerequisites = document.getElementById('editPrerequisites').value;
        const justification = document.getElementById('editJustification').value;

        // Validate prerequisites for circular dependencies
        if (prerequisites && prerequisites.trim().length > 0) {
            const validation = PrerequisitesModule.validatePrerequisites(courseCode, prerequisites);

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

        const courseData = {
            code: courseCode,
            name: courseName,
            description: courseDescription,
            creditHours: creditHours,
            prerequisites: prerequisites,
            justification: justification,
            competencies: competencies,
            // Preserve existing fields if editing
            plos: AppState.editingCourseId ? StateGetters.getCourses().find(c => c.id === AppState.editingCourseId)?.plos : [],
            clos: AppState.editingCourseId ? StateGetters.getCourses().find(c => c.id === AppState.editingCourseId)?.clos : []
        };

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

// NOTE: When integrating with backend, replace state operations with API calls
// Example:
// deleteCourse: async (id) => {
//     if (confirm('Are you sure you want to delete this course?')) {
//         try {
//             const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
//             if (response.ok) {
//                 StateSetters.deleteCourse(id);
//                 CoursesModule.updateCoursesList();
//                 alert('Course deleted successfully!');
//             }
//         } catch (error) {
//             alert('Error deleting course: ' + error.message);
//         }
//     }
// }