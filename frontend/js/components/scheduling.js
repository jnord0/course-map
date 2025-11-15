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
     * @param {string} sectionNumber
     * @returns {Object} Result with success status and any conflicts
     */
    addCourseToSchedule: (semesterId, courseId, sectionNumber = '01') => {
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

        // Generate placeholder schedule info for planning
        const scheduleInfo = SchedulingModule.generateDefaultSchedule(course);
        const section = scheduleInfo.sections.find(s => s.sectionNumber === sectionNumber) || scheduleInfo.sections[0];

        // Add to state
        StateSetters.addCourseToSchedule(semesterId, {
            courseId: courseId,
            sectionNumber: section.sectionNumber,
            meetingPattern: section.meetingPattern,
            addedDate: new Date().toISOString().split('T')[0]
        });

        // Detect conflicts
        const conflicts = SchedulingModule.detectConflicts(semesterId);

        return {
            success: true,
            conflicts: conflicts,
            section: section
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
     * Detect scheduling conflicts for a semester
     * @param {string} semesterId
     * @returns {Array} Array of conflict objects
     */
    detectConflicts: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const conflicts = [];
        const courses = StateGetters.getCourses();

        // Time conflict detection
        for (let i = 0; i < schedule.courses.length; i++) {
            for (let j = i + 1; j < schedule.courses.length; j++) {
                const course1 = schedule.courses[i];
                const course2 = schedule.courses[j];

                // Check for time conflicts
                const timeConflict = SchedulingModule.checkTimeConflict(
                    course1.meetingPattern,
                    course2.meetingPattern
                );

                if (timeConflict) {
                    const c1 = courses.find(c => c.id === course1.courseId);
                    const c2 = courses.find(c => c.id === course2.courseId);

                    conflicts.push({
                        type: 'TIME_CONFLICT',
                        severity: 'error',
                        courseIds: [course1.courseId, course2.courseId],
                        message: `Time conflict: ${c1.code} and ${c2.code} meet at the same time`,
                        details: {
                            course1: {
                                code: c1.code,
                                time: SchedulingModule.formatTimeSlot(course1.meetingPattern),
                                days: course1.meetingPattern.days.join(', ')
                            },
                            course2: {
                                code: c2.code,
                                time: SchedulingModule.formatTimeSlot(course2.meetingPattern),
                                days: course2.meetingPattern.days.join(', ')
                            }
                        }
                    });
                }
            }
        }

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
     * Check if two time slots conflict
     * @param {Object} pattern1
     * @param {Object} pattern2
     * @returns {boolean} True if there's a conflict
     */
    checkTimeConflict: (pattern1, pattern2) => {
        if (!pattern1 || !pattern2) return false;

        // Check if any days overlap
        const daysOverlap = pattern1.days.some(day => pattern2.days.includes(day));
        if (!daysOverlap) return false;

        // Check if times overlap
        const start1 = SchedulingModule.timeToMinutes(pattern1.startTime);
        const end1 = SchedulingModule.timeToMinutes(pattern1.endTime);
        const start2 = SchedulingModule.timeToMinutes(pattern2.startTime);
        const end2 = SchedulingModule.timeToMinutes(pattern2.endTime);

        // Times conflict if one starts before the other ends
        return (start1 < end2 && end1 > start2);
    },

    /**
     * Convert time string to minutes since midnight
     * @param {string} timeStr - Format "HH:MM"
     * @returns {number} Minutes since midnight
     */
    timeToMinutes: (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    /**
     * Format time slot for display
     * @param {Object} pattern
     * @returns {string} Formatted time
     */
    formatTimeSlot: (pattern) => {
        if (!pattern || !pattern.startTime) return 'TBA';

        const formatTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };

        return `${formatTime(pattern.startTime)} - ${formatTime(pattern.endTime)}`;
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
     * Generate placeholder scheduling info for planning purposes
     * Uses course code hash to create consistent but varied time slots
     * @param {Object} course
     * @returns {Object} Placeholder scheduling info
     */
    generateDefaultSchedule: (course) => {
        // Generate reasonable defaults based on credit hours and course code
        const credits = parseInt(course.creditHours) || 3;

        // Create a simple hash from course code for consistency
        const hash = course.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Time slot patterns for 3-credit courses
        const timeSlots = [
            { days: ['M', 'W', 'F'], startTime: '08:00', endTime: '08:50' },
            { days: ['M', 'W', 'F'], startTime: '09:00', endTime: '09:50' },
            { days: ['M', 'W', 'F'], startTime: '10:00', endTime: '10:50' },
            { days: ['M', 'W', 'F'], startTime: '11:00', endTime: '11:50' },
            { days: ['M', 'W', 'F'], startTime: '13:00', endTime: '13:50' },
            { days: ['M', 'W', 'F'], startTime: '14:00', endTime: '14:50' },
            { days: ['T', 'TH'], startTime: '09:30', endTime: '10:45' },
            { days: ['T', 'TH'], startTime: '11:00', endTime: '12:15' },
            { days: ['T', 'TH'], startTime: '14:00', endTime: '15:15' },
            { days: ['T', 'TH'], startTime: '15:30', endTime: '16:45' }
        ];

        // 4-credit courses get extra time
        if (credits === 4) {
            timeSlots.push(
                { days: ['M', 'W', 'F'], startTime: '09:00', endTime: '10:15' },
                { days: ['T', 'TH'], startTime: '09:00', endTime: '10:50' }
            );
        }

        // 1-credit courses are shorter
        if (credits === 1) {
            timeSlots.push(
                { days: ['M'], startTime: '15:00', endTime: '15:50' },
                { days: ['TH'], startTime: '16:00', endTime: '16:50' }
            );
        }

        // Use hash to consistently select a time slot for this course
        const pattern = timeSlots[hash % timeSlots.length];

        return {
            sections: [
                {
                    sectionNumber: '01',
                    meetingPattern: {
                        ...pattern,
                        location: 'TBA'
                    },
                    instructor: 'Staff',
                    availableSeats: parseInt(course.capacity) || 24,
                    totalSeats: parseInt(course.capacity) || 24
                }
            ],
            typicalSemesters: [course.semesterOffered || 'BOTH']
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

        // Calculate time distribution
        const timeBlocks = SchedulingModule.calculateTimeDistribution(schedule.courses);

        return {
            totalCourses: schedule.courses.length,
            totalCredits: totalCredits,
            conflictCount: conflicts.length,
            errorCount: errors,
            warningCount: warnings,
            timeDistribution: timeBlocks,
            isFullTime: totalCredits >= 12 && totalCredits <= 18
        };
    },

    /**
     * Calculate time distribution across week
     * @param {Array} scheduledCourses
     * @returns {Object} Time blocks by day
     */
    calculateTimeDistribution: (scheduledCourses) => {
        const distribution = {
            'M': [], 'T': [], 'W': [], 'TH': [], 'F': []
        };

        scheduledCourses.forEach(sc => {
            if (sc.meetingPattern && sc.meetingPattern.days) {
                sc.meetingPattern.days.forEach(day => {
                    if (distribution[day]) {
                        distribution[day].push({
                            courseId: sc.courseId,
                            start: sc.meetingPattern.startTime,
                            end: sc.meetingPattern.endTime
                        });
                    }
                });
            }
        });

        return distribution;
    },

    /**
     * Export schedule to printable format
     * @param {string} semesterId
     * @returns {string} HTML table of schedule
     */
    exportSchedule: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const courses = StateGetters.getCourses();
        const distribution = SchedulingModule.calculateTimeDistribution(schedule.courses);

        // Generate weekly grid view
        let html = '<table style="border-collapse: collapse; width: 100%;">';
        html += '<thead><tr><th>Time</th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr></thead>';
        html += '<tbody>';

        // Time slots from 8:00 AM to 5:00 PM
        for (let hour = 8; hour <= 17; hour++) {
            html += `<tr><td>${hour}:00</td>`;

            ['M', 'T', 'W', 'TH', 'F'].forEach(day => {
                const blocks = distribution[day];
                let cellContent = '';

                blocks.forEach(block => {
                    const startHour = parseInt(block.start.split(':')[0]);
                    if (startHour === hour) {
                        const course = courses.find(c => c.id === block.courseId);
                        cellContent += `${course.code}<br>`;
                    }
                });

                html += `<td>${cellContent}</td>`;
            });

            html += '</tr>';
        }

        html += '</tbody></table>';
        return html;
    }
};

// Export module
window.SchedulingModule = SchedulingModule;
