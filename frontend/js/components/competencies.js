// Competencies Tracker Component - Fixed for object competencies

const CompetenciesModule = {
    /**
     * Update the competency tracker display
     */
    updateTracker: () => {
        const trackerDiv = document.getElementById('competencyTracker');
        const statusDiv = document.getElementById('competencyStatus');
        const selectedCourses = StateGetters.getSelectedCourses();
        const allCompetencies = StateGetters.getCompetencies();

        // Calculate which competencies are met (weight of 3)
        const metCompetencies = new Set();
        const competencyCourses = {};

        selectedCourses.forEach(course => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    metCompetencies.add(compId);
                }
                if (!competencyCourses[compId]) {
                    competencyCourses[compId] = [];
                }
                if (weight > 0) {
                    competencyCourses[compId].push({ course, weight });
                }
            });
        });

        const missingCompetencies = allCompetencies.filter(c => !metCompetencies.has(c.id));

        // --- Competency Tracker (summary + selected courses) ---
        let trackerHTML = `
            <div class="summary-stats">
                <div class="summary-stat stat-met">
                    <span class="stat-number">${metCompetencies.size}</span>
                    <span>Emphasized (3)</span>
                </div>
                <div class="summary-stat stat-missing">
                    <span class="stat-number">${missingCompetencies.length}</span>
                    <span>Not Emphasized</span>
                </div>
            </div>
        `;

        if (selectedCourses.length > 0) {
            trackerHTML += `
                <div class="competency-tracker">
                    <div class="competency-header">Selected Courses</div>
                    <div class="course-list">
            `;

            selectedCourses.forEach(course => {
                trackerHTML += `<div class="course-item"><span class="course-code">${course.code}</span> - ${course.name}</div>`;
            });

            trackerHTML += `
                    </div>
                </div>
            `;
        }

        // Missing competencies alert goes in the tracker section
        if (missingCompetencies.length > 0) {
            trackerHTML += `
                <div class="missing-alert">
                    <div class="missing-alert-title">⚠ Competencies Not Emphasized (Level 3)</div>
                    <ul class="missing-list">
            `;

            missingCompetencies.forEach(comp => {
                const courses = competencyCourses[comp.id] || [];
                const maxWeight = courses.length > 0 ? Math.max(...courses.map(c => c.weight)) : 0;
                let note = '';
                if (maxWeight === 2) note = ' (Reinforced at Level 2)';
                else if (maxWeight === 1) note = ' (Addressed at Level 1)';
                trackerHTML += `<li>${comp.name}${note}</li>`;
            });

            trackerHTML += `
                    </ul>
                    <p style="margin-top: 10px; font-size: 12px; color: #856404;">
                        Select courses that emphasize these competencies at Level 3.
                    </p>
                </div>
            `;
        } else if (selectedCourses.length > 0) {
            trackerHTML += `
                <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin-top: 15px; text-align: center;">
                    <div style="color: #2e7d32; font-weight: bold; font-size: 14px;">✓ All Competencies Emphasized!</div>
                    <p style="margin-top: 5px; font-size: 12px; color: #2e7d32;">Your selected courses emphasize all college competencies at Level 3.</p>
                </div>
            `;
        }

        trackerDiv.innerHTML = trackerHTML;

        // --- Competency Status (separate section) ---
        let statusHTML = `<div class="competency-tracker">`;

        allCompetencies.forEach(comp => {
            const courses = competencyCourses[comp.id] || [];
            const maxWeight = courses.length > 0 ? Math.max(...courses.map(c => c.weight)) : 0;

            // Determine status icon and color
            let statusIcon = '✗';
            let statusClass = 'status-not-met';
            let statusText = 'Not Addressed';

            if (maxWeight === 3) {
                statusIcon = '★';
                statusClass = 'status-met';
                statusText = 'Emphasized';
            } else if (maxWeight === 2) {
                statusIcon = '◆';
                statusClass = 'status-partial';
                statusText = 'Reinforced';
            } else if (maxWeight === 1) {
                statusIcon = '◉';
                statusClass = 'status-minimal';
                statusText = 'Addressed';
            }

            statusHTML += `
                <div class="competency-item">
                    <div class="competency-name">
                        ${comp.name}
                        ${courses.length > 0 ? `<span style="font-size: 11px; color: #666; margin-left: 8px;">(${statusText})</span>` : ''}
                    </div>
                    <div class="competency-status">
                        <div class="status-icon ${statusClass}">
                            ${statusIcon}
                        </div>
                    </div>
                </div>
            `;
        });

        statusHTML += `</div>`;
        statusDiv.innerHTML = statusHTML;

        // Update the visualization
        VisualizationModule.updateGraph();

        // Update graphs if the module is loaded
        if (typeof GraphsModule !== 'undefined' && typeof GraphsModule.renderCurrentGraph === 'function') {
            GraphsModule.renderCurrentGraph();
        }
    }
};
