/**
 * Course Comparison Tool
 * Allows comparing 2-3 courses side-by-side
 */

const ComparisonTool = {
    /**
     * Update the compare button state based on selected courses
     */
    updateButtonState: () => {
        const selectedCourses = StateGetters.getSelectedCourses();
        const btn = document.getElementById('compareCoursesBtn');
        const hint = document.getElementById('compareHint');

        if (!btn) return;

        const count = selectedCourses.length;

        if (count >= 2 && count <= 3) {
            btn.disabled = false;
            hint.textContent = `Compare ${count} selected courses`;
            hint.style.color = 'var(--champlain-green)';
        } else if (count > 3) {
            btn.disabled = true;
            hint.textContent = 'Select 2-3 courses to compare (max 3)';
            hint.style.color = '#e65100';
        } else {
            btn.disabled = true;
            hint.textContent = 'Select 2-3 courses to compare';
            hint.style.color = '#666';
        }
    },

    /**
     * Open the comparison modal
     */
    openModal: () => {
        const selectedCourses = StateGetters.getSelectedCourses();

        if (selectedCourses.length < 2 || selectedCourses.length > 3) {
            alert('Please select 2-3 courses to compare');
            return;
        }

        const modal = document.getElementById('comparisonModal');
        const body = document.getElementById('comparisonBody');

        if (!modal || !body) return;

        // Generate comparison content
        body.innerHTML = ComparisonTool.generateComparisonHTML(selectedCourses);

        // Show modal
        modal.classList.add('active');
    },

    /**
     * Close the comparison modal
     */
    closeModal: () => {
        const modal = document.getElementById('comparisonModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Generate HTML for course comparison
     * Uses a row-based layout where each competency is a row with
     * all courses side-by-side for easy comparison
     */
    generateComparisonHTML: (courses) => {
        // Collect all unique competency names across all courses
        const allCompetencyNames = new Set();
        courses.forEach(course => {
            if (course.competencies) {
                Object.keys(course.competencies).forEach(name => {
                    if (course.competencies[name] > 0) {
                        allCompetencyNames.add(name);
                    }
                });
            }
        });

        // Sort competencies alphabetically for consistent ordering
        const sortedCompetencies = [...allCompetencyNames].sort();

        // Weight label and color helpers
        const weightLabel = (w) => w === 1 ? 'Addressed' : w === 2 ? 'Reinforced' : w === 3 ? 'Emphasized' : '';
        const weightBarColor = (w) => w === 1 ? '#1565c0' : w === 2 ? '#e65100' : w === 3 ? '#2e7d32' : '#ccc';

        // Course header columns
        const courseColCount = courses.length;
        const courseHeaders = courses.map(course => `
            <div class="comparison-col-header">
                <div class="comparison-course-code">${course.code}</div>
                <div class="comparison-course-name">${course.name}</div>
                ${course.creditHours ? `<div class="comparison-course-credits">${course.creditHours} credits</div>` : ''}
            </div>
        `).join('');

        // Build competency rows — each row shows the same competency across all courses
        const competencyRows = sortedCompetencies.map(compName => {
            const isShared = courses.every(c => c.competencies && c.competencies[compName] > 0);

            const cells = courses.map(course => {
                const weight = (course.competencies && course.competencies[compName]) || 0;
                const barWidthPct = weight > 0 ? Math.round((weight / 3) * 100) : 0;

                if (weight === 0) {
                    return `
                        <div class="comparison-cell comparison-cell-empty">
                            <span class="comparison-cell-dash">--</span>
                        </div>
                    `;
                }

                return `
                    <div class="comparison-cell">
                        <span class="comparison-competency-weight weight-${weight}">
                            ${weightLabel(weight)}
                        </span>
                        <div class="comparison-weight-bar-track">
                            <div class="comparison-weight-bar" style="width: ${barWidthPct}%; background: ${weightBarColor(weight)};"></div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="comparison-row ${isShared ? 'comparison-row-shared' : ''}">
                    <div class="comparison-row-label">${compName}</div>
                    <div class="comparison-row-cells" style="grid-template-columns: repeat(${courseColCount}, 1fr);">
                        ${cells}
                    </div>
                </div>
            `;
        }).join('');

        // Per-course stats at the bottom
        const statsRow = courses.map(course => {
            const totalWeight = Object.values(course.competencies || {}).reduce((sum, w) => sum + (w || 0), 0);
            const emphasized = Object.values(course.competencies || {}).filter(w => w === 3).length;
            const mapped = Object.values(course.competencies || {}).filter(w => w > 0).length;
            return `
                <div class="comparison-stat-col">
                    <div class="comparison-stat">
                        <div class="comparison-stat-value">${totalWeight}</div>
                        <div class="comparison-stat-label">Total Weight</div>
                    </div>
                    <div class="comparison-stat">
                        <div class="comparison-stat-value">${emphasized}</div>
                        <div class="comparison-stat-label">Emphasized</div>
                    </div>
                    <div class="comparison-stat">
                        <div class="comparison-stat-value">${mapped}</div>
                        <div class="comparison-stat-label">Mapped</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="comparison-table">
                <!-- Course header row -->
                <div class="comparison-header-row">
                    <div class="comparison-row-label comparison-corner-label">Competency</div>
                    <div class="comparison-row-cells" style="grid-template-columns: repeat(${courseColCount}, 1fr);">
                        ${courseHeaders}
                    </div>
                </div>

                <!-- Competency rows -->
                <div class="comparison-rows">
                    ${competencyRows}
                </div>

                <!-- Stats row -->
                <div class="comparison-stats-row">
                    <div class="comparison-row-label comparison-corner-label">Summary</div>
                    <div class="comparison-row-cells" style="grid-template-columns: repeat(${courseColCount}, 1fr);">
                        ${statsRow}
                    </div>
                </div>
            </div>
        `;
    }
};

/**
 * Export Tool
 * Handles exporting visualizations as PNG and PDF
 */

const ExportTool = {
    /**
     * Toggle export menu visibility
     */
    toggleMenu: () => {
        const menu = document.getElementById('exportMenu');
        if (menu) {
            menu.classList.toggle('active');
        }

        // Close menu when clicking outside
        const closeHandler = (e) => {
            const dropdown = document.getElementById('exportDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                menu.classList.remove('active');
                document.removeEventListener('click', closeHandler);
            }
        };

        // Delay to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 10);
    },

    /**
     * Export current visualization as PNG
     */
    exportPNG: () => {
        ExportTool.closeMenu();

        const activeView = ExportTool.getActiveView();

        if (activeView === 'network') {
            ExportTool.exportSVGAsPNG('networkGraph', 'course-competency-network.png');
        } else if (activeView === 'table') {
            ExportTool.exportElementAsPNG('competencyTable', 'competency-table.png');
        } else if (activeView === 'graphs') {
            ExportTool.exportElementAsPNG('graphsView', 'competency-graphs.png');
        } else if (activeView === 'semester') {
            ExportTool.exportElementAsPNG('semesterPlannerView', 'semester-planner.png');
        } else {
            ExportTool.exportElementAsPNG('networkView', 'visualization.png');
        }
    },

    /**
     * Export current visualization as PDF
     */
    exportPDF: () => {
        ExportTool.closeMenu();

        const activeView = ExportTool.getActiveView();
        let title = 'Course Competency Visualization';

        if (activeView === 'table') {
            title = 'Competency Table';
        } else if (activeView === 'graphs') {
            title = 'Competency Analytics';
        } else if (activeView === 'semester') {
            title = 'Semester Planner';
        }

        // Create a print-friendly version
        ExportTool.printToPDF(title);
    },

    /**
     * Get the currently active view
     */
    getActiveView: () => {
        const networkView = document.getElementById('networkView');
        const tableView = document.getElementById('tableView');
        const graphsView = document.getElementById('graphsView');
        const semesterView = document.getElementById('semesterPlannerView');

        if (tableView && !tableView.classList.contains('hidden')) return 'table';
        if (graphsView && !graphsView.classList.contains('hidden')) return 'graphs';
        if (semesterView && !semesterView.classList.contains('hidden')) return 'semester';
        return 'network';
    },

    /**
     * Export SVG element as PNG
     */
    exportSVGAsPNG: (svgId, filename) => {
        const svg = document.getElementById(svgId);
        if (!svg) {
            alert('Visualization not found');
            return;
        }

        // Clone and prepare SVG
        const svgClone = svg.cloneNode(true);
        const svgData = new XMLSerializer().serializeToString(svgClone);

        // Get dimensions
        const bbox = svg.getBoundingClientRect();
        const width = bbox.width || 1200;
        const height = bbox.height || 800;

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2; // For higher resolution

        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Convert SVG to image
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Download
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.onerror = () => {
            alert('Error exporting visualization. Please try again.');
            URL.revokeObjectURL(url);
        };

        img.src = url;
    },

    /**
     * Export HTML element as PNG using html2canvas approach
     */
    exportElementAsPNG: (elementId, filename) => {
        const element = document.getElementById(elementId);
        if (!element) {
            alert('Content not found');
            return;
        }

        // For non-SVG elements, we'll use the print approach or create a simplified export
        // Since we don't have html2canvas, use a simplified approach

        // Try to find any SVG inside
        const svg = element.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const bbox = svg.getBoundingClientRect();

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 2;

            canvas.width = (bbox.width || 1200) * scale;
            canvas.height = (bbox.height || 800) * scale;
            ctx.scale(scale, scale);

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, bbox.width || 1200, bbox.height || 800);

            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);

                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };

            img.src = url;
        } else {
            // Fallback: open print dialog
            alert('For best results, use Export as PDF for this view.');
        }
    },

    /**
     * Print to PDF using browser print dialog
     */
    printToPDF: (title) => {
        const activeView = ExportTool.getActiveView();
        let contentElement;

        if (activeView === 'table') {
            contentElement = document.getElementById('competencyTable');
        } else if (activeView === 'graphs') {
            contentElement = document.getElementById('graphsView');
        } else if (activeView === 'semester') {
            contentElement = document.getElementById('semesterPlannerView');
        } else {
            contentElement = document.getElementById('networkView');
        }

        if (!contentElement) {
            alert('Content not found');
            return;
        }

        // Create print window
        const printWindow = window.open('', '_blank');

        // Get selected courses info
        const selectedCourses = StateGetters.getSelectedCourses();
        const courseList = selectedCourses.map(c => `${c.code}: ${c.name}`).join(', ') || 'None selected';

        // Clone content
        const content = contentElement.cloneNode(true);
        content.classList.remove('hidden');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - Champlain College</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 40px;
                        color: #333;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #003C5F;
                    }
                    .print-header h1 {
                        color: #003C5F;
                        margin: 0 0 10px 0;
                    }
                    .print-header p {
                        color: #666;
                        margin: 5px 0;
                    }
                    .print-content {
                        margin-top: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px 12px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }
                    th {
                        background: #f5f5f5;
                    }
                    svg {
                        max-width: 100%;
                        height: auto;
                    }
                    @media print {
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>${title}</h1>
                    <p>Champlain College Academic Affairs</p>
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                    <p style="font-size: 12px;">Selected Courses: ${courseList}</p>
                </div>
                <div class="print-content">
                    ${content.innerHTML}
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    },

    /**
     * Close the export menu
     */
    closeMenu: () => {
        const menu = document.getElementById('exportMenu');
        if (menu) {
            menu.classList.remove('active');
        }
    }
};

// Make tools available globally
window.ComparisonTool = ComparisonTool;
window.ExportTool = ExportTool;
