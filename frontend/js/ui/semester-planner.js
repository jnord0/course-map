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

        // Render scheduled courses list
        SemesterPlannerUI.renderScheduledCourses(semesterId);

        // Render conflicts
        SemesterPlannerUI.renderConflicts(schedule.conflicts);

        // Render timeline and competency analysis
        SemesterPlannerUI.renderTimelineAndCompetencies();
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
                    ${course.prerequisites ? `<div style="margin-top: 8px; font-size: 11px; color: #666;">📋 Prereq: ${course.prerequisites}</div>` : ''}
                    <button style="width: 100%; margin-top: 8px; padding: 6px; background: var(--champlain-bright-blue); color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        + Add to Schedule
                    </button>
                </div>
            `;
        }).join('');
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

            return `
                <div style="background: white; border: 2px solid var(--champlain-blue); border-radius: 6px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--champlain-navy); font-size: 14px;">${course.code} - ${course.name}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            ${course.creditHours || 3} credits
                            ${course.prerequisites ? ` • Prereq: ${course.prerequisites}` : ''}
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
                StateSetters.addCourseToSchedule(SemesterPlannerUI.currentSemesterId, {
                    courseId: courseId,
                    addedDate: new Date().toISOString().split('T')[0]
                });
                SchedulingModule.detectConflicts(SemesterPlannerUI.currentSemesterId);
            } else {
                alert(result.error);
                return;
            }
        }

        // Refresh view
        const semesters = SchedulingModule.getAvailableSemesters();
        SemesterPlannerUI.renderSemesterTabs(semesters);
        SemesterPlannerUI.renderSemesterView(SemesterPlannerUI.currentSemesterId);
        SemesterPlannerUI.updateQuickView();
    },

    /**
     * Remove course from current semester schedule
     * @param {number} courseId
     */
    removeCourseFromSchedule: (courseId) => {
        SchedulingModule.removeCourseFromSchedule(SemesterPlannerUI.currentSemesterId, courseId);
        const semesters = SchedulingModule.getAvailableSemesters();
        SemesterPlannerUI.renderSemesterTabs(semesters);
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
     * Update quick view in sidebar (if it exists)
     */
    updateQuickView: () => {
        const quickViewDiv = document.getElementById('scheduleQuickView');
        if (!quickViewDiv) return; // Element doesn't exist, skip update

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
    },

    /**
     * Render timeline chart and competency analysis for all semesters
     */
    renderTimelineAndCompetencies: () => {
        const semesters = SchedulingModule.getAvailableSemesters();
        const allCompetencies = StateGetters.getCompetencies();
        const courses = StateGetters.getCourses();

        // Get all scheduled courses organized by semester
        const semesterData = semesters.map(semester => {
            const schedule = SchedulingModule.getSemesterSchedule(semester.id);
            const semesterCourses = schedule.courses
                .map(sc => courses.find(c => c.id === sc.courseId))
                .filter(c => c);
            return {
                semester,
                courses: semesterCourses
            };
        }).filter(sd => sd.courses.length > 0); // Only include semesters with courses

        if (semesterData.length === 0) {
            // No courses scheduled, show empty state
            document.getElementById('overallCompetencyGrid').innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No courses scheduled yet. Add courses to see competency analysis.</p>';
            document.getElementById('semesterTimelineChart').innerHTML = '';
            document.getElementById('semesterCompetencyBreakdown').innerHTML = '<p style="text-align: center; color: #666;">No data available</p>';
            return;
        }

        // Calculate overall competency achievement
        SemesterPlannerUI.renderOverallCompetencies(semesterData, allCompetencies);

        // Render timeline chart
        SemesterPlannerUI.renderSemesterTimeline(semesterData, allCompetencies);

        // Render per-semester breakdown
        SemesterPlannerUI.renderPerSemesterBreakdown(semesterData, allCompetencies);
    },

    /**
     * Render overall competency achievement summary
     */
    renderOverallCompetencies: (semesterData, allCompetencies) => {
        const overallGrid = document.getElementById('overallCompetencyGrid');

        // Calculate total competency weights across all courses
        const overallTotals = {};
        allCompetencies.forEach(comp => {
            overallTotals[comp.id] = 0;
        });

        semesterData.forEach(sd => {
            sd.courses.forEach(course => {
                if (course.competencies) {
                    Object.entries(course.competencies).forEach(([compId, weight]) => {
                        overallTotals[compId] += weight;
                    });
                }
            });
        });

        // Render overall competencies
        let html = allCompetencies.map(comp => {
            const total = overallTotals[comp.id] || 0;
            let statusColor = '#999';

            if (total >= 9) {
                statusColor = 'var(--champlain-green)';
            } else if (total >= 6) {
                statusColor = 'var(--champlain-bright-blue)';
            } else if (total >= 3) {
                statusColor = 'var(--champlain-teal)';
            }

            return `
                <div style="background: var(--card-bg); border-left: 4px solid ${statusColor}; border-radius: 6px; padding: 12px; transition: background-color 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${comp.name}</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${statusColor};">${total}</div>
                    </div>
                    <div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">
                        Total weight across all courses
                    </div>
                </div>
            `;
        }).join('');

        overallGrid.innerHTML = html;
    },

    /**
     * Render semester-based timeline chart
     */
    renderSemesterTimeline: (semesterData, allCompetencies) => {
        const svg = d3.select('#semesterTimelineChart');
        svg.selectAll('*').remove();

        // Get parent container width, fallback to computed width or default
        const container = document.getElementById('semesterTimelineChart').parentElement;
        const width = container ? container.offsetWidth : 900;
        const height = 500;
        const margin = { top: 40, right: 150, bottom: 80, left: 80 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // Set SVG viewBox for responsiveness
        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate cumulative competency totals per semester
        const timelineData = [];
        const cumulativeTotals = {};
        allCompetencies.forEach(comp => {
            cumulativeTotals[comp.id] = 0;
        });

        semesterData.forEach((sd, idx) => {
            // Add weights from all courses in this semester
            sd.courses.forEach(course => {
                if (course.competencies) {
                    Object.entries(course.competencies).forEach(([compId, weight]) => {
                        cumulativeTotals[compId] += weight;
                    });
                }
            });

            // Take snapshot
            timelineData.push({
                semesterIndex: idx,
                semesterName: sd.semester.name,
                totals: { ...cumulativeTotals }
            });
        });

        // Find maximum total for y-axis scaling
        let maxTotal = 0;
        timelineData.forEach(td => {
            Object.values(td.totals).forEach(total => {
                if (total > maxTotal) maxTotal = total;
            });
        });

        // Add some padding to the max (round up to nearest 5)
        maxTotal = Math.ceil(maxTotal / 5) * 5;
        if (maxTotal < 5) maxTotal = 5; // Minimum scale

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, timelineData.length - 1])
            .range([0, plotWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, maxTotal])
            .range([plotHeight, 0]);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveMonotoneX);

        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(allCompetencies.map(c => c.id))
            .range(['#003C5F', '#236192', '#00A9E0', '#3DC4B2', '#74AA50', '#FF9800', '#E91E63', '#9C27B0', '#607D8B', '#795548']);

        // Get theme-aware colors
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const textColor = currentTheme === 'dark' ? '#b8bbc3' : '#2c3e50';

        // Draw axes
        const xAxis = g.append('g')
            .attr('transform', `translate(0,${plotHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(timelineData.length)
                .tickFormat((d, i) => timelineData[i] ? timelineData[i].semesterName : ''));

        xAxis.selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '12px')
            .style('fill', textColor);

        xAxis.selectAll('path, line')
            .style('stroke', textColor);

        const yAxis = g.append('g')
            .call(d3.axisLeft(yScale).ticks(5));

        yAxis.selectAll('text')
            .style('font-size', '12px')
            .style('fill', textColor);

        yAxis.selectAll('path, line')
            .style('stroke', textColor);

        // Y-axis label
        const labelColor = currentTheme === 'dark' ? '#e4e6eb' : '#003C5F';

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -plotHeight / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '13px')
            .style('font-weight', 'bold')
            .style('fill', labelColor)
            .text('Cumulative Competency Total');

        // Draw lines for each competency
        allCompetencies.forEach(comp => {
            const lineData = timelineData.map(td => ({
                x: td.semesterIndex,
                y: td.totals[comp.id] || 0
            }));

            const path = g.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', colorScale(comp.id))
                .attr('stroke-width', 3)
                .attr('d', line)
                .style('opacity', 0.8);

            // Animate line drawing
            const totalLength = path.node().getTotalLength();
            path
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);

            // Add dots at each semester
            g.selectAll(`.dot-${comp.id}`)
                .data(lineData)
                .enter()
                .append('circle')
                .attr('class', `dot-${comp.id}`)
                .attr('cx', d => xScale(d.x))
                .attr('cy', d => yScale(d.y))
                .attr('r', 5)
                .attr('fill', colorScale(comp.id))
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('opacity', 0)
                .on('mouseover', function(event, d) {
                    d3.select(this).attr('r', 8);
                    const semester = timelineData[d.x];
                    // Show tooltip
                    g.append('text')
                        .attr('class', 'tooltip-text')
                        .attr('x', xScale(d.x))
                        .attr('y', yScale(d.y) - 15)
                        .attr('text-anchor', 'middle')
                        .style('font-size', '12px')
                        .style('font-weight', 'bold')
                        .style('fill', colorScale(comp.id))
                        .text(`${comp.name}: Total ${d.y}`);
                })
                .on('mouseout', function() {
                    d3.select(this).attr('r', 5);
                    g.selectAll('.tooltip-text').remove();
                })
                .transition()
                .delay(1500)
                .duration(300)
                .style('opacity', 1);
        });

        // Add legend
        const legend = g.append('g')
            .attr('transform', `translate(${plotWidth + 20}, 0)`);

        allCompetencies.forEach((comp, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);

            legendRow.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 10)
                .attr('y2', 10)
                .attr('stroke', colorScale(comp.id))
                .attr('stroke-width', 3);

            legendRow.append('text')
                .attr('x', 25)
                .attr('y', 14)
                .style('font-size', '11px')
                .style('fill', textColor)
                .text(comp.name);
        });
    },

    /**
     * Render per-semester competency breakdown
     */
    renderPerSemesterBreakdown: (semesterData, allCompetencies) => {
        const breakdownDiv = document.getElementById('semesterCompetencyBreakdown');

        let html = semesterData.map(sd => {
            // Calculate competency levels for this semester
            const semesterLevels = {};
            allCompetencies.forEach(comp => {
                semesterLevels[comp.id] = 0;
            });

            sd.courses.forEach(course => {
                if (course.competencies) {
                    Object.entries(course.competencies).forEach(([compId, weight]) => {
                        if (weight > semesterLevels[compId]) {
                            semesterLevels[compId] = weight;
                        }
                    });
                }
            });

            // Count competencies by level
            const emphasized = Object.values(semesterLevels).filter(l => l === 3).length;
            const reinforced = Object.values(semesterLevels).filter(l => l === 2).length;
            const addressed = Object.values(semesterLevels).filter(l => l === 1).length;
            const notAddressed = Object.values(semesterLevels).filter(l => l === 0).length;

            return `
                <div style="background: var(--card-bg); border-radius: 8px; padding: 15px; border: 2px solid var(--border-color); transition: background-color 0.3s ease, border-color 0.3s ease;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 12px; font-size: 15px;">
                        ${sd.semester.name} (${sd.courses.length} courses)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: #e8f5e9; border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: bold; color: var(--champlain-green);">${emphasized}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">Emphasized (3)</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: bold; color: var(--champlain-bright-blue);">${reinforced}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">Reinforced (2)</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #e0f2f1; border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: bold; color: var(--champlain-teal);">${addressed}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">Addressed (1)</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
                            <div style="font-size: 20px; font-weight: bold; color: var(--text-tertiary);">${notAddressed}</div>
                            <div style="font-size: 11px; color: var(--text-secondary);">Not Addressed (0)</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary);">
                        Courses: ${sd.courses.map(c => c.code).join(', ')}
                    </div>
                </div>
            `;
        }).join('');

        breakdownDiv.innerHTML = html;
    }
};

// Export module
window.SemesterPlannerUI = SemesterPlannerUI;
