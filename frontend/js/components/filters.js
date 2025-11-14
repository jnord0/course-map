// Advanced Search & Filtering Component

const FilterModule = {
    /**
     * Get all unique departments from courses
     * @returns {Array} Array of department prefixes
     */
    getDepartments: () => {
        const courses = StateGetters.getCourses();
        const departments = new Set();
        courses.forEach(course => {
            if (course.code) {
                const prefix = course.code.split('-')[0];
                departments.add(prefix);
            }
        });
        return Array.from(departments).sort();
    },

    /**
     * Get all unique credit hour values
     * @returns {Array} Array of credit hour values
     */
    getCreditHours: () => {
        const courses = StateGetters.getCourses();
        const credits = new Set();
        courses.forEach(course => {
            if (course.creditHours) {
                credits.add(parseInt(course.creditHours));
            }
        });
        return Array.from(credits).sort((a, b) => a - b);
    },

    /**
     * Apply all active filters to courses
     * @param {Array} courses - Array of courses to filter
     * @param {Object} filters - Filter configuration object
     * @returns {Array} Filtered courses
     */
    applyFilters: (courses, filters) => {
        let filtered = [...courses];

        // Text search filter
        if (filters.textSearch && filters.textSearch.trim().length > 0) {
            const searchTerm = filters.textSearch.toLowerCase();
            filtered = filtered.filter(course => {
                const matchesCode = course.code.toLowerCase().includes(searchTerm);
                const matchesName = course.name.toLowerCase().includes(searchTerm);
                const matchesDescription = course.description && course.description.toLowerCase().includes(searchTerm);
                return matchesCode || matchesName || matchesDescription;
            });
        }

        // Department filter
        if (filters.departments && filters.departments.length > 0) {
            filtered = filtered.filter(course => {
                const prefix = course.code.split('-')[0];
                return filters.departments.includes(prefix);
            });
        }

        // Credit hours filter
        if (filters.creditHours && filters.creditHours.length > 0) {
            filtered = filtered.filter(course => {
                return filters.creditHours.includes(parseInt(course.creditHours));
            });
        }

        // Semester offered filter
        if (filters.semesterOffered && filters.semesterOffered.length > 0) {
            filtered = filtered.filter(course => {
                // Check if course semesterOffered matches any selected semester
                // 'BOTH' should match if either FALL or SPRING is selected
                if (course.semesterOffered === 'BOTH') {
                    return true;
                }
                return filters.semesterOffered.includes(course.semesterOffered);
            });
        }

        // Competency filter (courses must have ALL selected competencies)
        if (filters.competencies && filters.competencies.length > 0) {
            filtered = filtered.filter(course => {
                const courseCompetencies = Object.keys(course.competencies || {});
                return filters.competencies.every(comp =>
                    courseCompetencies.includes(comp)
                );
            });
        }

        // Competency weight filter
        if (filters.competencyWeights && filters.competencyWeights.length > 0) {
            filtered = filtered.filter(course => {
                const weights = Object.values(course.competencies || {});
                return weights.some(weight => filters.competencyWeights.includes(weight));
            });
        }

        // Prerequisite filter
        if (filters.prerequisiteMode) {
            if (filters.prerequisiteMode === 'none') {
                // Only courses with no prerequisites
                filtered = filtered.filter(course => {
                    const prereqList = course.prerequisiteList || [];
                    return prereqList.length === 0;
                });
            } else if (filters.prerequisiteMode === 'has') {
                // Only courses with prerequisites
                filtered = filtered.filter(course => {
                    const prereqList = course.prerequisiteList || [];
                    return prereqList.length > 0;
                });
            } else if (filters.prerequisiteMode === 'specific' && filters.prerequisiteSpecific) {
                // Courses that have specific course as prerequisite
                filtered = filtered.filter(course => {
                    const prereqList = course.prerequisiteList || [];
                    if (prereqList.length === 0) return false;
                    return prereqList.some(prereq =>
                        prereq.coursePrefix + '-' + prereq.courseNumber === filters.prerequisiteSpecific
                    );
                });
            } else if (filters.prerequisiteMode === 'eligible' && filters.completedCourses) {
                // Courses the user is eligible for based on completed courses
                filtered = filtered.filter(course => {
                    const prereqList = course.prerequisiteList || [];
                    if (prereqList.length === 0) {
                        return true; // No prerequisites, always eligible
                    }
                    // Check if all prerequisites are in completed courses
                    return prereqList.every(prereq => {
                        const prereqCode = prereq.coursePrefix + '-' + prereq.courseNumber;
                        return filters.completedCourses.includes(prereqCode);
                    });
                });
            }
        }

        // Course type filter (Major, GenEd, etc.)
        if (filters.courseType && filters.courseType.length > 0) {
            filtered = filtered.filter(course => {
                if (!course.courseType || course.courseType.length === 0) return false;
                return course.courseType.some(type =>
                    filters.courseType.includes(type.category)
                );
            });
        }

        // Capacity range filter
        if (filters.capacityMin !== undefined || filters.capacityMax !== undefined) {
            filtered = filtered.filter(course => {
                const capacity = parseInt(course.capacity) || 0;
                const min = filters.capacityMin !== undefined ? filters.capacityMin : 0;
                const max = filters.capacityMax !== undefined ? filters.capacityMax : 999;
                return capacity >= min && capacity <= max;
            });
        }

        return filtered;
    },

    /**
     * Find courses similar to a given course
     * Uses competency overlap, department, and credit hours as similarity metrics
     * @param {number} courseId - ID of the course to compare
     * @param {number} limit - Maximum number of similar courses to return
     * @returns {Array} Array of similar courses with similarity scores
     */
    findSimilarCourses: (courseId, limit = 5) => {
        const courses = StateGetters.getCourses();
        const targetCourse = courses.find(c => c.id === courseId);

        if (!targetCourse) return [];

        const similarities = courses
            .filter(c => c.id !== courseId)
            .map(course => {
                let score = 0;

                // Competency overlap (50% weight)
                const targetComps = Object.keys(targetCourse.competencies || {});
                const courseComps = Object.keys(course.competencies || {});
                const intersection = targetComps.filter(c => courseComps.includes(c));
                const union = new Set([...targetComps, ...courseComps]);
                const compScore = union.size > 0 ? (intersection.length / union.size) * 50 : 0;
                score += compScore;

                // Weighted competency similarity (20% weight)
                let weightScore = 0;
                intersection.forEach(comp => {
                    const targetWeight = targetCourse.competencies[comp] || 0;
                    const courseWeight = course.competencies[comp] || 0;
                    const diff = Math.abs(targetWeight - courseWeight);
                    weightScore += (3 - diff) / 3; // 0 diff = 1, 1 diff = 0.66, 2 diff = 0.33, 3 diff = 0
                });
                if (intersection.length > 0) {
                    score += (weightScore / intersection.length) * 20;
                }

                // Same department (15% weight)
                const targetDept = targetCourse.code.split('-')[0];
                const courseDept = course.code.split('-')[0];
                if (targetDept === courseDept) {
                    score += 15;
                }

                // Same credit hours (10% weight)
                if (targetCourse.creditHours === course.creditHours) {
                    score += 10;
                }

                // Same course type (5% weight)
                if (targetCourse.courseType && course.courseType) {
                    const targetTypes = targetCourse.courseType.map(t => t.category);
                    const courseTypes = course.courseType.map(t => t.category);
                    const typeMatch = targetTypes.some(t => courseTypes.includes(t));
                    if (typeMatch) {
                        score += 5;
                    }
                }

                return { course, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return similarities;
    },

    /**
     * Find courses that cover multiple specified competencies
     * @param {Array} competencyIds - Array of competency IDs
     * @param {string} mode - 'all' (course must have all) or 'any' (course must have at least one)
     * @param {number} minWeight - Minimum competency weight (1, 2, or 3)
     * @returns {Array} Filtered courses
     */
    findCoursesByCompetencies: (competencyIds, mode = 'all', minWeight = 1) => {
        const courses = StateGetters.getCourses();

        return courses.filter(course => {
            const courseComps = course.competencies || {};

            if (mode === 'all') {
                // Course must have ALL specified competencies at or above minWeight
                return competencyIds.every(compId =>
                    courseComps[compId] !== undefined && courseComps[compId] >= minWeight
                );
            } else {
                // Course must have AT LEAST ONE specified competency at or above minWeight
                return competencyIds.some(compId =>
                    courseComps[compId] !== undefined && courseComps[compId] >= minWeight
                );
            }
        });
    },

    /**
     * Get course prerequisites as a readable string
     * @param {Object} course - Course object
     * @returns {string} Formatted prerequisites string
     */
    getPrerequisitesString: (course) => {
        const prereqList = course.prerequisiteList || [];
        if (prereqList.length === 0) {
            return 'None';
        }
        return prereqList
            .map(prereq => prereq.coursePrefix + '-' + prereq.courseNumber)
            .join(', ');
    },

    /**
     * Clear all active filters
     */
    clearFilters: () => {
        StateSetters.setActiveFilters({
            textSearch: '',
            departments: [],
            creditHours: [],
            semesterOffered: [],
            competencies: [],
            competencyWeights: [],
            prerequisiteMode: null,
            prerequisiteSpecific: null,
            completedCourses: [],
            courseType: [],
            capacityMin: undefined,
            capacityMax: undefined
        });
    },

    /**
     * Get filter summary for display
     * @param {Object} filters - Filter object
     * @returns {string} Human-readable filter summary
     */
    getFilterSummary: (filters) => {
        const parts = [];

        if (filters.textSearch) {
            parts.push(`Search: "${filters.textSearch}"`);
        }
        if (filters.departments && filters.departments.length > 0) {
            parts.push(`Departments: ${filters.departments.join(', ')}`);
        }
        if (filters.creditHours && filters.creditHours.length > 0) {
            parts.push(`Credits: ${filters.creditHours.join(', ')}`);
        }
        if (filters.semesterOffered && filters.semesterOffered.length > 0) {
            parts.push(`Semester: ${filters.semesterOffered.join(', ')}`);
        }
        if (filters.competencies && filters.competencies.length > 0) {
            const compNames = filters.competencies.map(id => {
                const comp = StateGetters.getCompetencies().find(c => c.id === id);
                return comp ? comp.name : id;
            });
            parts.push(`Competencies: ${compNames.join(', ')}`);
        }
        if (filters.competencyWeights && filters.competencyWeights.length > 0) {
            const weightNames = filters.competencyWeights.map(w =>
                w === 1 ? 'Addressed' : w === 2 ? 'Reinforced' : 'Emphasized'
            );
            parts.push(`Weights: ${weightNames.join(', ')}`);
        }

        return parts.length > 0 ? parts.join(' | ') : 'No filters active';
    },

    /**
     * Initialize filter UI
     */
    initializeFilterUI: () => {
        // Update department checkboxes
        const departments = FilterModule.getDepartments();
        const deptContainer = document.getElementById('filterDepartments');
        if (deptContainer) {
            deptContainer.innerHTML = departments.map(dept => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${dept}" onchange="FilterModule.updateFilters()">
                    <span>${dept}</span>
                </label>
            `).join('');
        }

        // Update credit hours checkboxes
        const credits = FilterModule.getCreditHours();
        const creditsContainer = document.getElementById('filterCredits');
        if (creditsContainer) {
            creditsContainer.innerHTML = credits.map(credit => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${credit}" onchange="FilterModule.updateFilters()">
                    <span>${credit} Credit${credit > 1 ? 's' : ''}</span>
                </label>
            `).join('');
        }

        // Update competency checkboxes
        const competencies = StateGetters.getCompetencies();
        const compContainer = document.getElementById('filterCompetencies');
        if (compContainer) {
            compContainer.innerHTML = competencies.map(comp => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${comp.id}" onchange="FilterModule.updateFilters()">
                    <span>${comp.name}</span>
                </label>
            `).join('');
        }
    },

    /**
     * Update filters based on UI state
     */
    updateFilters: () => {
        const filters = StateGetters.getActiveFilters();

        // Get selected departments
        const deptCheckboxes = document.querySelectorAll('#filterDepartments input[type="checkbox"]:checked');
        filters.departments = Array.from(deptCheckboxes).map(cb => cb.value);

        // Get selected credit hours
        const creditCheckboxes = document.querySelectorAll('#filterCredits input[type="checkbox"]:checked');
        filters.creditHours = Array.from(creditCheckboxes).map(cb => parseInt(cb.value));

        // Get selected semesters
        const semesterCheckboxes = document.querySelectorAll('#filterSemesters input[type="checkbox"]:checked');
        filters.semesterOffered = Array.from(semesterCheckboxes).map(cb => cb.value);

        // Get selected competencies
        const compCheckboxes = document.querySelectorAll('#filterCompetencies input[type="checkbox"]:checked');
        filters.competencies = Array.from(compCheckboxes).map(cb => cb.value);

        // Get selected competency weights
        const weightCheckboxes = document.querySelectorAll('#filterWeights input[type="checkbox"]:checked');
        filters.competencyWeights = Array.from(weightCheckboxes).map(cb => parseInt(cb.value));

        // Get course type
        const typeCheckboxes = document.querySelectorAll('#filterCourseType input[type="checkbox"]:checked');
        filters.courseType = Array.from(typeCheckboxes).map(cb => cb.value);

        // Update state
        StateSetters.setActiveFilters(filters);

        // Update course display
        FilterModule.applyFiltersAndUpdate();
    },

    /**
     * Apply filters and update course display
     */
    applyFiltersAndUpdate: () => {
        const filters = StateGetters.getActiveFilters();
        const allCourses = StateGetters.getCourses();
        const filteredCourses = FilterModule.applyFilters(allCourses, filters);

        // Update the available courses display with filtered results
        const availableDiv = document.getElementById('availableCourses');

        if (filteredCourses.length === 0) {
            availableDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No courses match the selected filters</p>';
        } else {
            availableDiv.innerHTML = filteredCourses.map(course => {
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

        // Update filter summary
        const summaryDiv = document.getElementById('filterSummary');
        if (summaryDiv) {
            summaryDiv.textContent = FilterModule.getFilterSummary(filters);
        }

        // Update results count
        const countDiv = document.getElementById('filterResultsCount');
        if (countDiv) {
            countDiv.textContent = `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`;
        }
    },

    /**
     * Show advanced filter panel
     */
    showFilterPanel: () => {
        FilterModule.initializeFilterUI();
        document.getElementById('filterPanel').style.display = 'block';
    },

    /**
     * Hide advanced filter panel
     */
    hideFilterPanel: () => {
        document.getElementById('filterPanel').style.display = 'none';
    },

    /**
     * Toggle filter panel visibility
     */
    toggleFilterPanel: () => {
        const panel = document.getElementById('filterPanel');
        if (panel.style.display === 'block') {
            FilterModule.hideFilterPanel();
        } else {
            FilterModule.showFilterPanel();
        }
    },

    /**
     * Show save preset dialog
     */
    showSavePresetDialog: () => {
        const name = prompt('Enter a name for this filter preset:');
        if (name && name.trim().length > 0) {
            const preset = StateSetters.saveFilterPreset(name.trim());
            alert(`Filter preset "${preset.name}" saved successfully!`);
        }
    },

    /**
     * Show load preset dialog
     */
    showLoadPresetDialog: () => {
        const presets = StateGetters.getFilterPresets();

        if (presets.length === 0) {
            alert('No saved filter presets found.\n\nCreate some filters and click "Save Filter Preset" to save them for later use.');
            return;
        }

        // Build preset selection dialog
        let message = 'Select a filter preset to load:\n\n';
        presets.forEach((preset, index) => {
            message += `${index + 1}. ${preset.name}\n`;
            message += `   Created: ${preset.createdDate} by ${preset.createdBy}\n\n`;
        });
        message += '\nEnter the number of the preset to load (or 0 to cancel):';

        const selection = prompt(message);
        const presetIndex = parseInt(selection) - 1;

        if (presetIndex >= 0 && presetIndex < presets.length) {
            const preset = presets[presetIndex];
            StateSetters.loadFilterPreset(preset.id);
            FilterModule.restoreFiltersFromState();
            FilterModule.applyFiltersAndUpdate();
            alert(`Filter preset "${preset.name}" loaded successfully!`);
        }
    },

    /**
     * Restore filter UI from state
     */
    restoreFiltersFromState: () => {
        const filters = StateGetters.getActiveFilters();

        // Restore department checkboxes
        document.querySelectorAll('#filterDepartments input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.departments.includes(cb.value);
        });

        // Restore credit hours checkboxes
        document.querySelectorAll('#filterCredits input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.creditHours.includes(parseInt(cb.value));
        });

        // Restore semester checkboxes
        document.querySelectorAll('#filterSemesters input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.semesterOffered.includes(cb.value);
        });

        // Restore competency checkboxes
        document.querySelectorAll('#filterCompetencies input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.competencies.includes(cb.value);
        });

        // Restore weight checkboxes
        document.querySelectorAll('#filterWeights input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.competencyWeights.includes(parseInt(cb.value));
        });

        // Restore course type checkboxes
        document.querySelectorAll('#filterCourseType input[type="checkbox"]').forEach(cb => {
            cb.checked = filters.courseType.includes(cb.value);
        });
    },

    /**
     * Show similar courses for a given course
     * @param {number} courseId - Course ID to find similar courses for
     */
    showSimilarCourses: (courseId) => {
        const similarCourses = FilterModule.findSimilarCourses(courseId, 5);
        const section = document.getElementById('similarCoursesSection');
        const list = document.getElementById('similarCoursesList');

        if (similarCourses.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        list.innerHTML = similarCourses.map(item => {
            const scorePercent = Math.round(item.score);
            return `
                <div class="similar-course-item" onclick="CoursesModule.toggleCourseSelection(${item.course.id})">
                    <div class="similar-course-code">
                        ${item.course.code}
                        <span class="similarity-score">${scorePercent}% match</span>
                    </div>
                    <div class="similar-course-name">${item.course.name}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * Update similar courses when selection changes
     */
    updateSimilarCourses: () => {
        const selectedCourses = StateGetters.getSelectedCourses();

        // Show similar courses for the most recently selected course
        if (selectedCourses.length > 0) {
            const latestCourse = selectedCourses[selectedCourses.length - 1];
            FilterModule.showSimilarCourses(latestCourse.id);
        } else {
            const section = document.getElementById('similarCoursesSection');
            if (section) {
                section.style.display = 'none';
            }
        }
    }
};

// Expose to window
window.FilterModule = FilterModule;
