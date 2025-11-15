// Semester Planner UI Module

const SemesterPlannerUI = {
    currentSemesterId: null,

    /**
     * Open the semester planner modal
     */
    openPlanner: () => {
        const semesters = SchedulingModule.getAvailableSemesters();
        if (semesters.length === 0) return;

        // Set first semester as current
        SemesterPlannerUI.currentSemesterId = semesters[0].id;

        // Render semester tabs
        SemesterPlannerUI.renderSemesterTabs(semesters);

        // Render current semester view
        SemesterPlannerUI.renderSemesterView(SemesterPlannerUI.currentSemesterId);

        // Show modal
        document.getElementById('semesterPlannerModal').style.display = 'block';
    },

    /**
     * Close the semester planner modal
     */
    closePlanner: () => {
        document.getElementById('semesterPlannerModal').style.display = 'none';
    },

    /**
     * Render semester tabs
     * @param {Array} semesters
     */
    renderSemesterTabs: (semesters) => {
        const tabsDiv = document.getElementById('semesterTabs');

        tabsDiv.innerHTML = semesters.map(semester => {
            const schedule = SchedulingModule.getSemesterSchedule(semester.id);
            const courseCount = schedule.courses.length;
            const isActive = semester.id === SemesterPlannerUI.currentSemesterId;

            return `
                <button
                    class="semester-tab ${isActive ? 'active' : ''}"
                    onclick="SemesterPlannerUI.switchSemester('${semester.id}')"
                    style="
                        padding: 12px 20px;
                        background: ${isActive ? 'var(--champlain-bright-blue)' : '#f8f9fa'};
                        color: ${isActive ? 'white' : 'var(--champlain-navy)'};
                        border: 2px solid ${isActive ? 'var(--champlain-bright-blue)' : '#ddd'};
                        border-radius: 8px 8px 0 0;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.2s;
                        white-space: nowrap;
                    ">
                    ${semester.name}
                    ${courseCount > 0 ? `<span style="background: ${isActive ? 'white' : 'var(--champlain-green)'}; color: ${isActive ? 'var(--champlain-bright-blue)' : 'white'}; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-size: 11px; font-weight: bold;">${courseCount}</span>` : ''}
                </button>
            `;
        }).join('');
    },

    /**
     * Switch to a different semester
     * @param {string} semesterId
     */
    switchSemester: (semesterId) => {
        SemesterPlannerUI.currentSemesterId = semesterId;
        const semesters = SchedulingModule.getAvailableSemesters();
        SemesterPlannerUI.renderSemesterTabs(semesters);
        SemesterPlannerUI.renderSemesterView(semesterId);
    },

    /**
     * Render the current semester view
     * @param {string} semesterId
     */
    renderSemesterView: (semesterId) => {
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const summary = SchedulingModule.getScheduleSummary(semesterId);

        // Update summary stats
        document.getElementById('totalCoursesCount').textContent = summary.totalCourses;
        document.getElementById('totalCreditsCount').textContent = summary.totalCredits;
        document.getElementById('conflictsCount').textContent = summary.conflictCount;

        // Render available courses
        SemesterPlannerUI.renderAvailableCourses(semesterId);

        // Render weekly schedule grid
        SemesterPlannerUI.renderWeeklyGrid(semesterId);

        // Render scheduled courses list
        SemesterPlannerUI.renderScheduledCourses(semesterId);

        // Render conflicts
        SemesterPlannerUI.renderConflicts(schedule.conflicts);
    },

    /**
     * Render available courses for scheduling
     * @param {string} semesterId
     */
    renderAvailableCourses: (semesterId) => {
        const coursesDiv = document.getElementById('availableCoursesForSchedule');
        const courses = StateGetters.getCourses();
        const semester = SchedulingModule.getAvailableSemesters().find(s => s.id === semesterId);
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const scheduledIds = schedule.courses.map(c => c.courseId);

        // Filter courses by semester offered
        const availableCourses = courses.filter(course => {
            if (scheduledIds.includes(course.id)) return false;

            const semesterOffered = course.semesterOffered || 'BOTH';
            return semesterOffered === 'BOTH' ||
                   semesterOffered === semester.term ||
                   (semesterOffered === 'FALL_SPRING' && (semester.term === 'FALL' || semester.term === 'SPRING'));
        });

        if (availableCourses.length === 0) {
            coursesDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No courses available for this semester</p>';
            return;
        }

        coursesDiv.innerHTML = availableCourses.map(course => {
            const defaultSchedule = SchedulingModule.generateDefaultSchedule(course);
            const section = defaultSchedule.sections[0];
            const timeSlot = SchedulingModule.formatTimeSlot(section.meetingPattern);

            return `
                <div class="available-course-card" style="background: white; border: 2px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='var(--champlain-bright-blue)'; this.style.boxShadow='0 2px 8px rgba(0,169,224,0.2)'"
                     onmouseout="this.style.borderColor='#ddd'; this.style.boxShadow='none'"
                     onclick="SemesterPlannerUI.addCourseToSchedule(${course.id})">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--champlain-navy); font-size: 14px;">${course.code}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">${course.name}</div>
                        </div>
                        <div style="background: var(--champlain-green); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                            ${course.creditHours || 3} cr
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #666;">
                        <div>🕒 ${section.meetingPattern.days.join(', ')} ${timeSlot}</div>
                        ${course.prerequisites ? `<div style="margin-top: 4px;">📋 Prereq: ${course.prerequisites}</div>` : ''}
                    </div>
                    <button style="width: 100%; margin-top: 8px; padding: 6px; background: var(--champlain-bright-blue); color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        + Add to Schedule
                    </button>
                </div>
            `;
        }).join('');
    },

    /**
     * Render weekly schedule grid
     * @param {string} semesterId
     */
    renderWeeklyGrid: (semesterId) => {
        const gridDiv = document.getElementById('weeklyScheduleGrid');
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const courses = StateGetters.getCourses();

        // Time slots from 8:00 AM to 5:00 PM
        const timeSlots = [];
        for (let hour = 8; hour <= 17; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }

        const days = ['M', 'T', 'W', 'TH', 'F'];
        const dayNames = {' M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'TH': 'Thursday', 'F': 'Friday'};

        // Create grid
        let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
        html += '<thead><tr style="background: var(--champlain-navy); color: white;">';
        html += '<th style="padding: 10px; border: 1px solid #ddd; width: 80px;">Time</th>';
        days.forEach(day => {
            html += `<th style="padding: 10px; border: 1px solid #ddd;">${dayNames[day]}</th>`;
        });
        html += '</tr></thead><tbody>';

        timeSlots.forEach(time => {
            const hour = parseInt(time.split(':')[0]);
            const displayTime = hour > 12 ? `${hour - 12}:00 PM` : (hour === 12 ? '12:00 PM' : `${hour}:00 AM`);

            html += '<tr>';
            html += `<td style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa; font-weight: 600; text-align: center;">${displayTime}</td>`;

            days.forEach(day => {
                // Find courses scheduled for this day and time
                const coursesAtTime = schedule.courses.filter(sc => {
                    if (!sc.meetingPattern) return false;
                    const startHour = parseInt(sc.meetingPattern.startTime.split(':')[0]);
                    const endHour = parseInt(sc.meetingPattern.endTime.split(':')[0]);
                    const endMinutes = parseInt(sc.meetingPattern.endTime.split(':')[1]);
                    const endTime = endHour + (endMinutes > 0 ? 1 : 0);

                    return sc.meetingPattern.days.includes(day) && hour >= startHour && hour < endTime;
                });

                if (coursesAtTime.length > 0) {
                    const sc = coursesAtTime[0];
                    const course = courses.find(c => c.id === sc.courseId);
                    const isConflict = coursesAtTime.length > 1;

                    html += `<td style="padding: 4px; border: 1px solid #ddd; background: ${isConflict ? '#ffebee' : '#e3f2fd'}; vertical-align: top;">`;
                    html += `<div style="font-weight: 600; color: var(--champlain-navy); font-size: 11px;">${course.code}</div>`;
                    html += `<div style="font-size: 10px; color: #666;">${SchedulingModule.formatTimeSlot(sc.meetingPattern)}</div>`;
                    if (isConflict) {
                        html += `<div style="color: #d32f2f; font-size: 10px; font-weight: 600;">⚠️ CONFLICT</div>`;
                    }
                    html += '</td>';
                } else {
                    html += '<td style="padding: 8px; border: 1px solid #ddd; background: white;"></td>';
                }
            });

            html += '</tr>';
        });

        html += '</tbody></table>';
        gridDiv.innerHTML = html;
    },

    /**
     * Render list of scheduled courses
     * @param {string} semesterId
     */
    renderScheduledCourses: (semesterId) => {
        const listDiv = document.getElementById('scheduledCoursesList');
        const schedule = SchedulingModule.getSemesterSchedule(semesterId);
        const courses = StateGetters.getCourses();

        if (schedule.courses.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 6px;">No courses scheduled yet. Add courses from the left panel.</p>';
            return;
        }

        listDiv.innerHTML = schedule.courses.map(sc => {
            const course = courses.find(c => c.id === sc.courseId);
            if (!course) return '';

            const timeSlot = SchedulingModule.formatTimeSlot(sc.meetingPattern);

            return `
                <div style="background: white; border: 2px solid var(--champlain-blue); border-radius: 6px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--champlain-navy); font-size: 14px;">${course.code} - ${course.name}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            🕒 ${sc.meetingPattern.days.join(', ')} ${timeSlot} • ${course.creditHours || 3} credits
                        </div>
                    </div>
                    <button onclick="SemesterPlannerUI.removeCourseFromSchedule(${course.id})" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Remove
                    </button>
                </div>
            `;
        }).join('');
    },

    /**
     * Render conflicts display
     * @param {Array} conflicts
     */
    renderConflicts: (conflicts) => {
        const conflictsDiv = document.getElementById('conflictsDisplay');

        if (!conflicts || conflicts.length === 0) {
            conflictsDiv.innerHTML = '';
            return;
        }

        const errorConflicts = conflicts.filter(c => c.severity === 'error');
        const warningConflicts = conflicts.filter(c => c.severity === 'warning');
        const infoConflicts = conflicts.filter(c => c.severity === 'info');

        let html = '<div>';

        if (errorConflicts.length > 0) {
            html += '<div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; border-radius: 6px; margin-bottom: 10px;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #d32f2f; font-size: 14px;">⚠️ Errors</h4>';
            errorConflicts.forEach(conflict => {
                html += `<div style="margin-bottom: 8px; font-size: 13px; color: #c62828;">${conflict.message}</div>`;
            });
            html += '</div>';
        }

        if (warningConflicts.length > 0) {
            html += '<div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 6px; margin-bottom: 10px;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #f57c00; font-size: 14px;">⚠️ Warnings</h4>';
            warningConflicts.forEach(conflict => {
                html += `<div style="margin-bottom: 8px; font-size: 13px; color: #e65100;">${conflict.message}</div>`;
            });
            html += '</div>';
        }

        if (infoConflicts.length > 0) {
            html += '<div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 6px;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #1976d2; font-size: 14px;">ℹ️ Information</h4>';
            infoConflicts.forEach(conflict => {
                html += `<div style="margin-bottom: 8px; font-size: 13px; color: #1565c0;">${conflict.message}</div>`;
            });
            html += '</div>';
        }

        html += '</div>';
        conflictsDiv.innerHTML = html;
    },

    /**
     * Add course to current semester schedule
     * @param {number} courseId
     */
    addCourseToSchedule: (courseId) => {
        const result = SchedulingModule.addCourseToSchedule(SemesterPlannerUI.currentSemesterId, courseId);

        if (!result.success) {
            if (result.warning) {
                const proceed = confirm(result.error + '\n\nDo you want to add it anyway?');
                if (!proceed) return;
                // Override and add anyway
                const course = StateGetters.getCourses().find(c => c.id === courseId);
                const scheduleInfo = SchedulingModule.generateDefaultSchedule(course);
                StateSetters.addCourseToSchedule(SemesterPlannerUI.currentSemesterId, {
                    courseId: courseId,
                    sectionNumber: '01',
                    meetingPattern: scheduleInfo.sections[0].meetingPattern,
                    addedDate: new Date().toISOString().split('T')[0]
                });
                SchedulingModule.detectConflicts(SemesterPlannerUI.currentSemesterId);
            } else {
                alert(result.error);
                return;
            }
        }

        // Refresh view
        SemesterPlannerUI.renderSemesterView(SemesterPlannerUI.currentSemesterId);
        SemesterPlannerUI.updateQuickView();
    },

    /**
     * Remove course from current semester schedule
     * @param {number} courseId
     */
    removeCourseFromSchedule: (courseId) => {
        SchedulingModule.removeCourseFromSchedule(SemesterPlannerUI.currentSemesterId, courseId);
        SemesterPlannerUI.renderSemesterView(SemesterPlannerUI.currentSemesterId);
        SemesterPlannerUI.updateQuickView();
    },

    /**
     * Clear all courses from current semester
     */
    clearSchedule: () => {
        if (!confirm('Are you sure you want to clear all courses from this semester?')) return;

        const schedule = SchedulingModule.getSemesterSchedule(SemesterPlannerUI.currentSemesterId);
        const courseIds = [...schedule.courses.map(c => c.courseId)];

        courseIds.forEach(id => {
            StateSetters.removeCourseFromSchedule(SemesterPlannerUI.currentSemesterId, id);
        });

        SemesterPlannerUI.renderSemesterView(SemesterPlannerUI.currentSemesterId);
        SemesterPlannerUI.updateQuickView();
    },

    /**
     * Export schedule to printable format
     */
    exportSchedule: () => {
        const semesterName = SchedulingModule.getAvailableSemesters()
            .find(s => s.id === SemesterPlannerUI.currentSemesterId).name;
        const schedule = SchedulingModule.getSemesterSchedule(SemesterPlannerUI.currentSemesterId);
        const courses = StateGetters.getCourses();
        const summary = SchedulingModule.getScheduleSummary(SemesterPlannerUI.currentSemesterId);

        let html = `
            <html>
            <head>
                <title>${semesterName} Schedule</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #003C5F; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #003C5F; color: white; }
                    .summary { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>${semesterName} Course Schedule</h1>
                <div class="summary">
                    <strong>Total Courses:</strong> ${summary.totalCourses} |
                    <strong>Total Credits:</strong> ${summary.totalCredits} |
                    <strong>Conflicts:</strong> ${summary.conflictCount}
                </div>
                <h2>Scheduled Courses</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Credits</th>
                            <th>Days</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        schedule.courses.forEach(sc => {
            const course = courses.find(c => c.id === sc.courseId);
            if (!course) return;

            const timeSlot = SchedulingModule.formatTimeSlot(sc.meetingPattern);

            html += `
                <tr>
                    <td>${course.code}</td>
                    <td>${course.name}</td>
                    <td>${course.creditHours || 3}</td>
                    <td>${sc.meetingPattern.days.join(', ')}</td>
                    <td>${timeSlot}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                ${SchedulingModule.exportSchedule(SemesterPlannerUI.currentSemesterId)}
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    },

    /**
     * Update quick view in sidebar
     */
    updateQuickView: () => {
        const quickViewDiv = document.getElementById('scheduleQuickView');
        const semesters = SchedulingModule.getAvailableSemesters();

        const upcoming = semesters.slice(0, 2);
        let html = '';

        upcoming.forEach(semester => {
            const schedule = SchedulingModule.getSemesterSchedule(semester.id);
            if (schedule.courses.length > 0) {
                html += `<div style="margin-bottom: 8px;"><strong>${semester.name}:</strong> ${schedule.courses.length} courses, ${schedule.totalCredits} credits</div>`;
            }
        });

        if (html === '') {
            quickViewDiv.innerHTML = '<div style="font-style: italic;">No courses planned yet</div>';
        } else {
            quickViewDiv.innerHTML = html;
        }
    },

    /**
     * Search courses in scheduler
     */
    searchSchedulerCourses: (searchTerm) => {
        // Filter courses by search term and re-render
        SemesterPlannerUI.renderAvailableCourses(SemesterPlannerUI.currentSemesterId);
    }
};

// Export module
window.SemesterPlannerUI = SemesterPlannerUI;
