// Scheduling Component - Course scheduling and conflict detection

const SchedulingModule = {
    /**
     * Get all available semesters for planning
     * @returns {Array} Array of semester objects
     */
    getAvailableSemesters: () => {
        const currentYear = new Date().getFullYear();
        const semesters = [];

        // Generate next 4 semesters
        for (let i = 0; i < 2; i++) {
            const year = currentYear + i;
            semesters.push(
                { id: `fall-${year}`, name: `Fall ${year}`, term: 'FALL', year: year },
                { id: `spring-${year + 1}`, name: `Spring ${year + 1}`, term: 'SPRING', year: year + 1 }
            );
        }

        // Add summer sessions
        for (let i = 0; i < 2; i++) {
            const year = currentYear + i;
            semesters.splice(i * 3 + 2, 0,
                { id: `summer-${year}`, name: `Summer ${year}`, term: 'SUMMER', year: year }
            );
        }

        return semesters;
    },

    /**
     * Get user's schedule for a specific semester
     * @param {string} semesterId
     * @returns {Object} Schedule object
     */
    getSemesterSchedule: (semesterId) => {
        const username = StateGetters.getCurrentUser();
        if (!username) return null;

        const userSchedules = StateGetters.getUserSchedules();
        const schedule = userSchedules[semesterId];

        if (!schedule) {
            return {
                semesterId: semesterId,
                courses: [],
                conflicts: [],
                totalCredits: 0
            };
        }

        return schedule;
    },

    /**
     * Add course to semester schedule
     * @param {string} semesterId
     * @param {number} courseId
     * @returns {Object} Result with success status and any conflicts
     */
    addCourseToSchedule: (semesterId, courseId) => {
        const course = StateGetters.getCourses().find(c => c.id === courseId);
        if (!course) {
            return { success: false, error: 'Course not found' };
        }

        // Check if course is offered in this semester
        const semester = SchedulingModule.getAvailableSemesters().find(s => s.id === semesterId);
        if (!semester) {
            return { success: false, error: 'Invalid semester' };
        }

        const semesterOffered = course.semesterOffered || 'BOTH';
        const isOffered = semesterOffered === 'BOTH' ||
                         semesterOffered === semester.term ||
                         (semesterOffered === 'FALL_SPRING' && (semester.term === 'FALL' || semester.term === 'SPRING'));

        if (!isOffered) {
            return {
                success: false,
                error: `${course.code} is not typically offered in ${semester.name}`,
                warning: true
            };
        }

        // Add to state (simplified - no meeting patterns)
        StateSetters.addCourseToSchedule(semesterId, {
            courseId: courseId,
            addedDate: new Date().toISOString().split('T')[0]
        });

        // Detect conflicts
        const conflicts = SchedulingModule.detectConflicts(semesterId);

        return {
            success: true,
            conflicts: conflicts
        };
    },

    /**
     * Remove course from semester schedule
     * @param {string} semesterId
     * @param {number} courseId
     */
    removeCourseFromSchedule: (semesterId, courseId) => {
        StateSetters.removeCourseFromSchedule(semesterId, courseId);

        // Re-detect conflicts after removal
        const conflicts = SchedulingModule.detectConflicts(semesterId);
        return { success: true, conflicts: conflicts };
    },

    /**
     * Detect scheduling conflicts for a semester (prerequisite and credit validation only)
     * @param {string} semesterId
     * @returns {Array} Array of conflict objects
     */
    detectConflicts: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const conflicts = [];
        const courses = StateGetters.getCourses();

        // Prerequisite checking
        const completedCourses = StateGetters.getCompletedCourses();
        schedule.courses.forEach(scheduledCourse => {
            const course = courses.find(c => c.id === scheduledCourse.courseId);
            if (course && course.prerequisites) {
                const prereqCheck = SchedulingModule.checkPrerequisites(
                    course,
                    completedCourses,
                    schedule.courses
                );

                if (!prereqCheck.satisfied) {
                    conflicts.push({
                        type: 'PREREQUISITE',
                        severity: 'error',
                        courseIds: [scheduledCourse.courseId],
                        message: `Missing prerequisites for ${course.code}`,
                        details: {
                            course: course.code,
                            missing: prereqCheck.missing
                        }
                    });
                }
            }
        });

        // Credit hour warning (typical full-time is 12-18 credits)
        const totalCredits = schedule.courses.reduce((sum, sc) => {
            const course = courses.find(c => c.id === sc.courseId);
            return sum + (parseInt(course.creditHours) || 3);
        }, 0);

        if (totalCredits > 18) {
            conflicts.push({
                type: 'CREDIT_OVERLOAD',
                severity: 'warning',
                courseIds: [],
                message: `Credit overload: ${totalCredits} credits (maximum recommended: 18)`,
                details: { totalCredits: totalCredits }
            });
        } else if (totalCredits < 12 && schedule.courses.length > 0) {
            conflicts.push({
                type: 'CREDIT_UNDERLOAD',
                severity: 'info',
                courseIds: [],
                message: `Part-time enrollment: ${totalCredits} credits (full-time minimum: 12)`,
                details: { totalCredits: totalCredits }
            });
        }

        // Update conflicts in state
        StateSetters.updateScheduleConflicts(semesterId, conflicts);

        return conflicts;
    },

    /**
     * Check prerequisites for a course
     * @param {Object} course
     * @param {Array} completedCourses
     * @param {Array} scheduledCourses
     * @returns {Object} Result with satisfied flag and missing prerequisites
     */
    checkPrerequisites: (course, completedCourses = [], scheduledCourses = []) => {
        if (!course.prerequisites || course.prerequisites.trim() === '') {
            return { satisfied: true, missing: [] };
        }

        // Parse prerequisites (simple comma-separated list)
        const required = course.prerequisites.split(',').map(p => p.trim());
        const missing = [];

        required.forEach(prereq => {
            const isCompleted = completedCourses.some(code => code.trim() === prereq);
            const isScheduled = scheduledCourses.some(sc => {
                const c = StateGetters.getCourses().find(course => course.id === sc.courseId);
                return c && c.code === prereq;
            });

            if (!isCompleted && !isScheduled) {
                missing.push(prereq);
            }
        });

        return {
            satisfied: missing.length === 0,
            missing: missing
        };
    },

    /**
     * Get schedule summary statistics
     * @param {string} semesterId
     * @returns {Object} Summary stats
     */
    getScheduleSummary: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const courses = StateGetters.getCourses();

        const totalCredits = schedule.courses.reduce((sum, sc) => {
            const course = courses.find(c => c.id === sc.courseId);
            return sum + (parseInt(course.creditHours) || 3);
        }, 0);

        const conflicts = schedule.conflicts || [];
        const errors = conflicts.filter(c => c.severity === 'error').length;
        const warnings = conflicts.filter(c => c.severity === 'warning').length;

        return {
            totalCourses: schedule.courses.length,
            totalCredits: totalCredits,
            conflictCount: conflicts.length,
            errorCount: errors,
            warningCount: warnings,
            isFullTime: totalCredits >= 12 && totalCredits <= 18
        };
    },

    /**
     * Export schedule to printable format
     * @param {string} semesterId
     * @returns {string} HTML table of schedule
     */
    exportSchedule: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const courses = StateGetters.getCourses();
        const semester = SchedulingModule.getAvailableSemesters().find(s => s.id === semesterId);

        // Generate simple course list
        let html = `<h2>${semester ? semester.name : semesterId} - Course Schedule</h2>`;
        html += '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ccc;">';
        html += '<thead><tr style="background-color: #003C5F; color: white;">';
        html += '<th style="padding: 10px; border: 1px solid #ccc;">Course Code</th>';
        html += '<th style="padding: 10px; border: 1px solid #ccc;">Course Title</th>';
        html += '<th style="padding: 10px; border: 1px solid #ccc;">Credits</th>';
        html += '</tr></thead>';
        html += '<tbody>';

        schedule.courses.forEach(sc => {
            const course = courses.find(c => c.id === sc.courseId);
            if (course) {
                html += '<tr>';
                html += `<td style="padding: 10px; border: 1px solid #ccc;">${course.code}</td>`;
                html += `<td style="padding: 10px; border: 1px solid #ccc;">${course.title}</td>`;
                html += `<td style="padding: 10px; border: 1px solid #ccc; text-align: center;">${course.creditHours || 3}</td>`;
                html += '</tr>';
            }
        });

        const summary = SchedulingModule.getScheduleSummary(semesterId);
        html += '<tr style="font-weight: bold; background-color: #f5f5f5;">';
        html += '<td colspan="2" style="padding: 10px; border: 1px solid #ccc;">Total</td>';
        html += `<td style="padding: 10px; border: 1px solid #ccc; text-align: center;">${summary.totalCredits}</td>`;
        html += '</tr>';

        html += '</tbody></table>';
        return html;
    }
};

// Export module
window.SchedulingModule = SchedulingModule;
