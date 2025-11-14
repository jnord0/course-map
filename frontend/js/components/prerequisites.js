// Prerequisite Management Component
// Handles prerequisite validation, chain analysis, and pathway visualization

const PrerequisitesModule = {
    /**
     * Parse prerequisite string into array of course codes
     * @param {string} prereqString - e.g., "CSI-340, CSI-360"
     * @returns {Array<string>} - e.g., ["CSI-340", "CSI-360"]
     */
    parsePrerequisites: (prereqString) => {
        if (!prereqString || prereqString.trim() === '') return [];
        return prereqString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    },

    /**
     * Get all prerequisites for a course (direct only)
     * @param {Object} course - Course object
     * @returns {Array<string>} - Array of prerequisite course codes
     */
    getDirectPrerequisites: (course) => {
        if (!course) return [];

        // Handle new format with courseData
        if (course.courseData && course.courseData.courseIdentity && course.courseData.courseIdentity.prerequisites) {
            return course.courseData.courseIdentity.prerequisites.map(p =>
                `${p.coursePrefix}-${p.courseNumber}`
            );
        }

        // Handle legacy format with string
        if (course.prerequisites) {
            return PrerequisitesModule.parsePrerequisites(course.prerequisites);
        }

        return [];
    },

    /**
     * Get all prerequisites for a course recursively (full chain)
     * @param {string} courseCode - Course code to analyze
     * @param {Array<Object>} allCourses - All available courses
     * @param {Set<string>} visited - Set of already visited courses (for cycle detection)
     * @returns {Object} - { chain: Array<string>, hasCycle: boolean, cycleNode: string|null }
     */
    getPrerequisiteChain: (courseCode, allCourses = null, visited = new Set()) => {
        if (!courseCode) return { chain: [], hasCycle: false, cycleNode: null };

        const courses = allCourses || StateGetters.getCourses();

        // Check for circular dependency
        if (visited.has(courseCode)) {
            return { chain: [], hasCycle: true, cycleNode: courseCode };
        }

        visited.add(courseCode);

        const course = courses.find(c => c.code === courseCode);
        if (!course) {
            visited.delete(courseCode);
            return { chain: [], hasCycle: false, cycleNode: null };
        }

        const directPrereqs = PrerequisitesModule.getDirectPrerequisites(course);
        const fullChain = [...directPrereqs];

        // Recursively get prerequisites of prerequisites
        for (const prereqCode of directPrereqs) {
            const result = PrerequisitesModule.getPrerequisiteChain(prereqCode, courses, new Set(visited));

            // If cycle detected, return immediately
            if (result.hasCycle) {
                return { chain: fullChain, hasCycle: true, cycleNode: result.cycleNode };
            }

            // Add nested prerequisites to chain (avoiding duplicates)
            result.chain.forEach(code => {
                if (!fullChain.includes(code)) {
                    fullChain.push(code);
                }
            });
        }

        visited.delete(courseCode);
        return { chain: fullChain, hasCycle: false, cycleNode: null };
    },

    /**
     * Get all courses that list this course as a prerequisite (reverse prerequisites)
     * @param {string} courseCode - Course code to analyze
     * @param {Array<Object>} allCourses - All available courses
     * @returns {Array<string>} - Array of course codes that depend on this course
     */
    getCoursesEnabled: (courseCode, allCourses = null) => {
        if (!courseCode) return [];

        const courses = allCourses || StateGetters.getCourses();
        const enabledCourses = [];

        courses.forEach(course => {
            const prereqs = PrerequisitesModule.getDirectPrerequisites(course);
            if (prereqs.includes(courseCode)) {
                enabledCourses.push(course.code);
            }
        });

        return enabledCourses;
    },

    /**
     * Get full pathway - what this course enables recursively
     * @param {string} courseCode - Course code to analyze
     * @param {Array<Object>} allCourses - All available courses
     * @param {Set<string>} visited - Set of already visited courses
     * @returns {Array<string>} - Array of all courses in the pathway
     */
    getFullPathway: (courseCode, allCourses = null, visited = new Set()) => {
        if (!courseCode) return [];
        if (visited.has(courseCode)) return [];

        const courses = allCourses || StateGetters.getCourses();
        visited.add(courseCode);

        const directlyEnabled = PrerequisitesModule.getCoursesEnabled(courseCode, courses);
        const fullPathway = [...directlyEnabled];

        // Recursively get courses enabled by the enabled courses
        directlyEnabled.forEach(enabledCode => {
            const nestedPathway = PrerequisitesModule.getFullPathway(enabledCode, courses, new Set(visited));
            nestedPathway.forEach(code => {
                if (!fullPathway.includes(code)) {
                    fullPathway.push(code);
                }
            });
        });

        return fullPathway;
    },

    /**
     * Validate prerequisites for circular dependencies
     * @param {string} courseCode - Course code to validate
     * @param {Array<string>} newPrerequisites - New prerequisites to validate
     * @param {Array<Object>} allCourses - All available courses
     * @returns {Object} - { isValid: boolean, errors: Array<string>, warnings: Array<string> }
     */
    validatePrerequisites: (courseCode, newPrerequisites, allCourses = null) => {
        const courses = allCourses || StateGetters.getCourses();
        const errors = [];
        const warnings = [];

        // Parse prerequisites
        const prereqCodes = typeof newPrerequisites === 'string'
            ? PrerequisitesModule.parsePrerequisites(newPrerequisites)
            : newPrerequisites;

        // Check 1: Self-reference
        if (prereqCodes.includes(courseCode)) {
            errors.push(`A course cannot be a prerequisite of itself (${courseCode})`);
        }

        // Check 2: Non-existent courses
        prereqCodes.forEach(prereqCode => {
            const prereqCourse = courses.find(c => c.code === prereqCode);
            if (!prereqCourse) {
                warnings.push(`Prerequisite course "${prereqCode}" not found in system`);
            }
        });

        // Check 3: Circular dependencies
        // For each prerequisite, check if adding it would create a cycle
        for (const prereqCode of prereqCodes) {
            // Check if the prerequisite course has this course in its prerequisite chain
            const result = PrerequisitesModule.getPrerequisiteChain(prereqCode, courses, new Set());
            if (result.chain.includes(courseCode)) {
                errors.push(
                    `Circular dependency detected: ${courseCode} → ${prereqCode} → ... → ${courseCode}`
                );
            }

            // Also check if the prerequisite enables courses that lead back here
            const pathway = PrerequisitesModule.getFullPathway(courseCode, courses, new Set());
            if (pathway.includes(prereqCode)) {
                errors.push(
                    `Circular dependency detected: ${courseCode} enables ${prereqCode} (directly or indirectly)`
                );
            }
        }

        // Check 4: Duplicate prerequisites
        const duplicates = prereqCodes.filter((code, index) => prereqCodes.indexOf(code) !== index);
        if (duplicates.length > 0) {
            warnings.push(`Duplicate prerequisites: ${duplicates.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    },

    /**
     * Validate all courses in the system for circular dependencies
     * @param {Array<Object>} allCourses - All available courses
     * @returns {Array<Object>} - Array of validation results
     */
    validateAllCourses: (allCourses = null) => {
        const courses = allCourses || StateGetters.getCourses();
        const results = [];

        courses.forEach(course => {
            const prereqs = PrerequisitesModule.getDirectPrerequisites(course);
            const validation = PrerequisitesModule.validatePrerequisites(course.code, prereqs, courses);

            if (!validation.isValid || validation.warnings.length > 0) {
                results.push({
                    courseCode: course.code,
                    courseName: course.name,
                    ...validation
                });
            }
        });

        return results;
    },

    /**
     * Get course pathway analysis for a student
     * Shows what courses can be taken based on completed courses
     * @param {Array<string>} completedCourses - Array of completed course codes
     * @param {Array<Object>} allCourses - All available courses
     * @returns {Object} - { available: Array, locked: Array, completed: Array }
     */
    getStudentPathway: (completedCourses = [], allCourses = null) => {
        const courses = allCourses || StateGetters.getCourses();
        const available = [];
        const locked = [];
        const completed = [...completedCourses];

        courses.forEach(course => {
            // Skip if already completed
            if (completed.includes(course.code)) {
                return;
            }

            const prereqs = PrerequisitesModule.getDirectPrerequisites(course);

            // Check if all prerequisites are completed
            const allPrereqsMet = prereqs.every(prereqCode => completed.includes(prereqCode));

            if (allPrereqsMet) {
                available.push({
                    code: course.code,
                    name: course.name,
                    credits: course.creditHours || course.courseData?.courseIdentity?.credits || 3,
                    prerequisites: prereqs,
                    enables: PrerequisitesModule.getCoursesEnabled(course.code, courses)
                });
            } else {
                const missingPrereqs = prereqs.filter(prereqCode => !completed.includes(prereqCode));
                locked.push({
                    code: course.code,
                    name: course.name,
                    credits: course.creditHours || course.courseData?.courseIdentity?.credits || 3,
                    prerequisites: prereqs,
                    missingPrerequisites: missingPrereqs
                });
            }
        });

        return { available, locked, completed };
    },

    /**
     * Build prerequisite graph data for D3.js visualization
     * @param {Array<string>} focusCourses - Array of course codes to focus on (optional)
     * @param {Array<Object>} allCourses - All available courses
     * @returns {Object} - { nodes: Array, links: Array }
     */
    buildPrerequisiteGraph: (focusCourses = null, allCourses = null) => {
        const courses = allCourses || StateGetters.getCourses();
        const nodes = [];
        const links = [];
        const nodeSet = new Set();

        // If focus courses specified, only include those and their prerequisites/enabled courses
        let coursesToInclude = courses;
        if (focusCourses && focusCourses.length > 0) {
            const includedCodes = new Set(focusCourses);

            // Add all prerequisites
            focusCourses.forEach(courseCode => {
                const result = PrerequisitesModule.getPrerequisiteChain(courseCode, courses);
                result.chain.forEach(code => includedCodes.add(code));
            });

            // Add all enabled courses
            focusCourses.forEach(courseCode => {
                const enabled = PrerequisitesModule.getCoursesEnabled(courseCode, courses);
                enabled.forEach(code => includedCodes.add(code));
            });

            coursesToInclude = courses.filter(c => includedCodes.has(c.code));
        }

        // Build nodes
        coursesToInclude.forEach(course => {
            if (!nodeSet.has(course.code)) {
                nodeSet.add(course.code);

                const prereqs = PrerequisitesModule.getDirectPrerequisites(course);
                const enables = PrerequisitesModule.getCoursesEnabled(course.code, courses);

                nodes.push({
                    id: course.code,
                    name: course.name,
                    code: course.code,
                    credits: course.creditHours || course.courseData?.courseIdentity?.credits || 3,
                    prerequisiteCount: prereqs.length,
                    enablesCount: enables.length,
                    isFocus: focusCourses ? focusCourses.includes(course.code) : false
                });
            }
        });

        // Build links (prerequisite relationships)
        coursesToInclude.forEach(course => {
            const prereqs = PrerequisitesModule.getDirectPrerequisites(course);
            prereqs.forEach(prereqCode => {
                // Only add link if both nodes exist
                if (nodeSet.has(prereqCode) && nodeSet.has(course.code)) {
                    links.push({
                        source: prereqCode,
                        target: course.code,
                        type: 'prerequisite'
                    });
                }
            });
        });

        return { nodes, links };
    },

    /**
     * Show course details with prerequisites and enabled courses
     * @param {string} courseCode - Course code to show details for
     */
    showCourseDetails: (courseCode) => {
        const courses = StateGetters.getCourses();
        const course = courses.find(c => c.code === courseCode);

        if (!course) {
            alert('Course not found: ' + courseCode);
            return;
        }

        const prereqs = PrerequisitesModule.getDirectPrerequisites(course);
        const prereqChain = PrerequisitesModule.getPrerequisiteChain(courseCode, courses);
        const enables = PrerequisitesModule.getCoursesEnabled(courseCode, courses);
        const pathway = PrerequisitesModule.getFullPathway(courseCode, courses);

        // Build prerequisite info HTML
        let prereqHTML = '<div style="margin-top: 10px;">';
        prereqHTML += '<h4 style="color: var(--champlain-navy); margin-bottom: 8px;">Prerequisites</h4>';

        if (prereqs.length === 0) {
            prereqHTML += '<p style="color: #666; font-size: 13px;">No prerequisites</p>';
        } else {
            prereqHTML += '<p style="font-size: 13px; margin-bottom: 8px;"><strong>Direct:</strong> ' + prereqs.join(', ') + '</p>';
            if (prereqChain.chain.length > prereqs.length) {
                const indirectPrereqs = prereqChain.chain.filter(code => !prereqs.includes(code));
                prereqHTML += '<p style="font-size: 13px; color: #666;"><strong>Indirect:</strong> ' + indirectPrereqs.join(', ') + '</p>';
            }
        }
        prereqHTML += '</div>';

        // Build enabled courses HTML
        let enabledHTML = '<div style="margin-top: 15px;">';
        enabledHTML += '<h4 style="color: var(--champlain-navy); margin-bottom: 8px;">Courses This Enables</h4>';

        if (enables.length === 0) {
            enabledHTML += '<p style="color: #666; font-size: 13px;">This course is not a prerequisite for any other course</p>';
        } else {
            enabledHTML += '<p style="font-size: 13px; margin-bottom: 8px;"><strong>Direct:</strong> ' + enables.join(', ') + '</p>';
            if (pathway.length > enables.length) {
                const indirectEnabled = pathway.filter(code => !enables.includes(code));
                enabledHTML += '<p style="font-size: 13px; color: #666;"><strong>Indirect:</strong> ' + indirectEnabled.join(', ') + '</p>';
            }
        }
        enabledHTML += '</div>';

        // Show in alert (will be replaced with modal later)
        const message = `${course.code}: ${course.name}\n\n` +
            `Credits: ${course.creditHours || course.courseData?.courseIdentity?.credits || 'N/A'}\n\n` +
            `Prerequisites (${prereqs.length}):\n${prereqs.length > 0 ? prereqs.join(', ') : 'None'}\n\n` +
            `Full Prerequisite Chain (${prereqChain.chain.length}):\n${prereqChain.chain.length > 0 ? prereqChain.chain.join(' → ') : 'None'}\n\n` +
            `Enables (${enables.length}):\n${enables.length > 0 ? enables.join(', ') : 'None'}\n\n` +
            `Full Pathway (${pathway.length}):\n${pathway.length > 0 ? pathway.join(' → ') : 'None'}`;

        alert(message);
    }
};

// Export module
window.PrerequisitesModule = PrerequisitesModule;
