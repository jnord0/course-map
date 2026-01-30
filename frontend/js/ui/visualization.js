// Enhanced Visualization Module with D3.js - Fixed for object competencies

const VisualizationModule = {
    svg: null,
    width: 0,
    height: 0,
    viewMode: 'bipartite',
    hoveredNode: null,
    tooltip: null,
    
    /**
     * Helper: Get competency IDs from course (handles both array and object format)
     */
    getCourseCompetencyIds: (course) => {
        if (!course.competencies) return [];
        
        // If it's an array, return as-is
        if (Array.isArray(course.competencies)) {
            return course.competencies;
        }
        
        // If it's an object, return keys where weight > 0
        return Object.keys(course.competencies).filter(key => course.competencies[key] > 0);
    },
    
    /**
     * Helper: Get competency weight (handles both array and object format)
     */
    getCompetencyWeight: (course, compId) => {
        if (!course.competencies) return 0;
        
        // If it's an array, return 1 if present
        if (Array.isArray(course.competencies)) {
            return course.competencies.includes(compId) ? 1 : 0;
        }
        
        // If it's an object, return the weight
        return course.competencies[compId] || 0;
    },
    
    /**
     * Initialize the visualization
     */
    init: () => {
        const svgElement = document.getElementById('networkGraph');
        if (!svgElement) {
            console.error('Network graph SVG not found');
            return;
        }
        
        VisualizationModule.createViewModeToggle();
        VisualizationModule.setupViewToggle();
        VisualizationModule.createTooltip();
        
        // Get actual available height - better calculation
        const graphWrapper = svgElement.parentElement;
        const rect = graphWrapper.getBoundingClientRect();
        
        // Use the parent container's height minus padding
        VisualizationModule.width = rect.width - 60; // Account for padding
        VisualizationModule.height = rect.height - 60; // Account for padding
        
        VisualizationModule.svg = d3.select('#networkGraph');
        VisualizationModule.svg
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${VisualizationModule.width} ${VisualizationModule.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('background', '#fafbfc');
        
        window.addEventListener('resize', VisualizationModule.handleResize);
        
        VisualizationModule.updateGraph();
        
        console.log('Visualization initialized with dimensions:', VisualizationModule.width, 'x', VisualizationModule.height);
    },
    
    createViewModeToggle: () => {
        const networkView = document.getElementById('networkView');
    if (!networkView || document.getElementById('viewModeToggle')) return;
    
    const toggleDiv = document.createElement('div');
    toggleDiv.id = 'viewModeToggle';
    toggleDiv.style.cssText = `
        position: absolute;
        top: 10px;
        left: 20px;
        z-index: 1000;
        display: flex;
        gap: 8px;
        background: #f5f7fa;
        padding: 6px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        flex-wrap: wrap;
        max-width: 600px;
    `;
    
    const views = [
        { id: 'bipartite', label: 'Bipartite', icon: '⟷' },
        { id: 'radial', label: 'Radial', icon: '⭕' },
        { id: 'chord', label: 'Chord', icon: '🎵' }
    ];
    
    views.forEach((view, index) => {
        const btn = document.createElement('button');
        btn.textContent = `${view.icon} ${view.label}`;
        btn.className = `viz-mode-btn ${index === 0 ? 'active' : ''}`;
        btn.onclick = () => {
            VisualizationModule.viewMode = view.id;
            document.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            VisualizationModule.updateGraph();
        };
        toggleDiv.appendChild(btn);
    });
    
    networkView.style.position = 'relative';
    networkView.insertBefore(toggleDiv, networkView.firstChild);
        
        if (!document.getElementById('vizModeStyles')) {
            const style = document.createElement('style');
            style.id = 'vizModeStyles';
            style.textContent = `
                .viz-mode-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: #666;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .viz-mode-btn:hover {
                    background: rgba(0,51,102,0.1);
                }
                .viz-mode-btn.active {
                    background: var(--champlain-navy);
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    createTooltip: () => {
        if (document.getElementById('vizTooltip')) return;
        
        VisualizationModule.tooltip = document.createElement('div');
        VisualizationModule.tooltip.id = 'vizTooltip';
        VisualizationModule.tooltip.style.cssText = `
            position: fixed;
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: 2px solid var(--champlain-navy);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10000;
            max-width: 300px;
            font-size: 13px;
        `;
        document.body.appendChild(VisualizationModule.tooltip);
    },
    
    showTooltip: (content, event) => {
        if (!VisualizationModule.tooltip) return;
        
        VisualizationModule.tooltip.innerHTML = content;
        VisualizationModule.tooltip.style.opacity = '1';
        VisualizationModule.tooltip.style.left = (event.pageX + 15) + 'px';
        VisualizationModule.tooltip.style.top = (event.pageY + 15) + 'px';
    },
    
    hideTooltip: () => {
        if (!VisualizationModule.tooltip) return;
        VisualizationModule.tooltip.style.opacity = '0';
    },
    
    handleResize: () => {
        const svgElement = document.getElementById('networkGraph');
        if (svgElement) {
            const graphWrapper = svgElement.parentElement;
            const rect = graphWrapper.getBoundingClientRect();
            VisualizationModule.width = rect.width;
            VisualizationModule.height = rect.height || 600;
            VisualizationModule.updateGraph();
        }
    },
    
    getCompetencyColor: (compId) => {
        const colors = {
            // 12 Core Competencies - Official Champlain Colors (from wedge icons)
            'ANL': '#E52019',  // Analysis - Red
            'COL': '#F7931E',  // Collaboration - Orange
            'COM': '#FFDD00',  // Communication - Yellow
            'CRE': '#C4D82D',  // Creativity - Lime
            'DEI': '#5CB85C',  // Diversity, Equity & Inclusion - Green
            'GCU': '#7CC9B5',  // Global & Cultural Understanding - Light Teal
            'INL': '#00B5AD',  // Information Literacy - Teal
            'INQ': '#3C8DAD',  // Inquiry - Steel Blue
            'INT': '#7B4FD0',  // Integration - Purple
            'QNT': '#D640A8',  // Quantitative Literacy - Magenta
            'SCI': '#F799C0',  // Scientific Literacy - Pink
            'TEC': '#A61C3C',  // Technology Literacy - Burgundy
            // Legacy competency IDs (for backward compatibility)
            'communication': '#FFDD00',
            'thinking': '#3C8DAD',
            'learning': '#7B4FD0',
            'collaboration': '#F7931E',
            'global': '#7CC9B5',
            'ethics': '#5CB85C',
            'information': '#00B5AD',
            'ETH': '#5CB85C'  // Ethical Reasoning (legacy, mapped to DEI color)
        };
        return colors[compId] || '#999';
    },
    
    updateGraph: () => {
        if (!VisualizationModule.svg) return;
        
        switch(VisualizationModule.viewMode) {
            case 'bipartite':
                VisualizationModule.renderBipartiteGraph();
                break;
            case 'radial':
                VisualizationModule.renderRadialGraph();
                break;
            case 'heatmap':
                VisualizationModule.renderHeatmapView();
                break;
            case 'sunburst':
                VisualizationModule.renderSunburstView();
                break;
            case 'force':
                VisualizationModule.renderForceDirectedView();
                break;
            case 'chord':
                VisualizationModule.renderChordView();
                break;
            default:
                VisualizationModule.renderBipartiteGraph();
        }
    },
    
    showEmptyState: () => {
        const svg = VisualizationModule.svg;
        svg.selectAll('*').remove();
        
        const g = svg.append('g')
            .attr('transform', `translate(${VisualizationModule.width/2},${VisualizationModule.height/2})`);
        
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', '#999')
            .style('font-size', '18px')
            .style('font-weight', '600')
            .text('Select courses to visualize competency coverage');
        
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 30)
            .attr('fill', '#bbb')
            .style('font-size', '14px')
            .text('Use the course selection panel on the left to get started');
    },
    
    renderBipartiteGraph: () => {
        const svg = VisualizationModule.svg;
        svg.selectAll('*').remove();
        
        const selectedCourses = StateGetters.getSelectedCourses();
        const competencies = StateGetters.getCompetencies();
        
        if (selectedCourses.length === 0) {
            VisualizationModule.showEmptyState();
            return;
        }
        
        const margin = { top: 80, right: 180, bottom: 60, left: 180 }; // Increased margins
        const width = VisualizationModule.width - margin.left - margin.right;
        const height = VisualizationModule.height - margin.top - margin.bottom;
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // ... gradient code stays the same ...
        
       

        
        const defs = svg.append('defs');
        competencies.forEach(comp => {
            const gradient = defs.append('linearGradient')
                .attr('id', `gradient-${comp.id}`)
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%');
            
            gradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', VisualizationModule.getCompetencyColor(comp.id))
                .attr('stop-opacity', 0.3);
            
            gradient.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', VisualizationModule.getCompetencyColor(comp.id))
                .attr('stop-opacity', 0.8);
        });
        
        const courseX = width * 0.2;  // Changed from 0.25 to 0.2 (move left)
        const compX = width * 0.8;    // Changed from 0.75 to 0.8 (move right)
        
        // Increase vertical spacing
        const courseSpacing = height / (selectedCourses.length + 1.5); // Added more space
        const compSpacing = height / (competencies.length + 1.5);      // Added more space
        
        
        // Create links - only for weight of 3
        const links = [];
        selectedCourses.forEach((course, i) => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    const compIndex = competencies.findIndex(c => c.id === compId);
                    if (compIndex >= 0) {
                        links.push({
                            source: { x: courseX, y: (i + 1) * courseSpacing },
                            target: { x: compX, y: (compIndex + 1) * compSpacing },
                            course: course,
                            compId: compId
                        });
                    }
                }
            });
        });
        
        const linkGroup = g.append('g').attr('class', 'links');
        
        links.forEach(link => {
            const path = d3.path();
            const midX = (link.source.x + link.target.x) / 2;
            path.moveTo(link.source.x, link.source.y);
            path.bezierCurveTo(
                midX, link.source.y,
                midX, link.target.y,
                link.target.x, link.target.y
            );
            
            linkGroup.append('path')
                .attr('d', path.toString())
                .attr('fill', 'none')
                .attr('stroke', `url(#gradient-${link.compId})`)
                .attr('stroke-width', 1.5)
                .attr('opacity', 0.6)
                .attr('class', `link link-course-${link.course.id} link-comp-${link.compId}`)
                .style('transition', 'all 0.3s ease');
        });
        
        // Draw course nodes
        const courseNodes = g.append('g').attr('class', 'course-nodes');
        
        selectedCourses.forEach((course, i) => {
            const y = (i + 1) * courseSpacing;
            
            const nodeGroup = courseNodes.append('g')
                .attr('transform', `translate(${courseX},${y})`)
                .style('cursor', 'pointer')
                .on('mouseenter', function(event) {
                    VisualizationModule.hoveredNode = { id: course.id, type: 'course', data: course };
                    VisualizationModule.highlightConnections(course.id, 'course');
                    
                    const compIds = VisualizationModule.getCourseCompetencyIds(course);
                    const tooltipContent = `
                        <div style="font-weight: bold; color: var(--champlain-navy); font-size: 16px; margin-bottom: 8px;">
                            ${course.code}
                        </div>
                        <div style="color: #666; font-size: 13px; margin-bottom: 12px;">
                            ${course.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Addresses:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${compIds.map(compId => {
                                const comp = competencies.find(c => c.id === compId);
                                const weight = VisualizationModule.getCompetencyWeight(course, compId);
                                return `
                                    <span style="
                                        padding: 4px 8px;
                                        border-radius: 12px;
                                        font-size: 11px;
                                        font-weight: 600;
                                        background: ${VisualizationModule.getCompetencyColor(compId)};
                                        color: white;
                                    ">${comp?.name || compId} (${weight})</span>
                                `;
                            }).join('')}
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 8px; font-style: italic;">Click for details</div>
                    `;
                    VisualizationModule.showTooltip(tooltipContent, event);
                })
                .on('mouseleave', function() {
                    VisualizationModule.hoveredNode = null;
                    VisualizationModule.clearHighlights();
                    VisualizationModule.hideTooltip();
                })
                .on('click', function(event) {
                    event.stopPropagation();
                    VisualizationModule.showCourseDetailsModal(course);
                });
            
            nodeGroup.append('circle')
                .attr('r', 10)
                .attr('fill', '#003366')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .attr('class', `node-course-${course.id}`)
                .style('transition', 'all 0.3s ease');
            
            nodeGroup.append('text')
                .attr('x', -15)
                .attr('y', 5)
                .attr('text-anchor', 'end')
                .attr('fill', '#003366')
                .style('font-weight', '600')
                .style('font-size', '13px')
                .style('transition', 'all 0.3s ease')
                .attr('class', `text-course-${course.id}`)
                .text(course.code);
        });
        
        // Calculate which competencies are met (weight of 3)
        const metCompetencies = new Set();
        selectedCourses.forEach(course => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    metCompetencies.add(compId);
                }
            });
        });
        
        // Draw competency nodes
        const compNodes = g.append('g').attr('class', 'competency-nodes');
        
        competencies.forEach((comp, i) => {
            const y = (i + 1) * compSpacing;
            const isMet = metCompetencies.has(comp.id);
            
            const nodeGroup = compNodes.append('g')
                .attr('transform', `translate(${compX},${y})`)
                .style('cursor', 'pointer')
                .on('mouseenter', function(event) {
                    VisualizationModule.hoveredNode = { id: comp.id, type: 'competency', data: comp };
                    VisualizationModule.highlightConnections(comp.id, 'competency');
                    
                    const relatedCourses = selectedCourses.filter(c => {
                        return VisualizationModule.getCompetencyWeight(c, comp.id) === 3;
                    });
                    
                    const tooltipContent = `
                        <div style="font-weight: bold; color: ${VisualizationModule.getCompetencyColor(comp.id)}; font-size: 16px; margin-bottom: 8px;">
                            ${comp.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                            Emphasized by ${relatedCourses.length} selected course(s)
                        </div>
                        <div style="margin-top: 8px;">
                            ${relatedCourses.map(course => `
                                <div style="font-size: 11px; color: #666; padding: 2px 0;">
                                    • ${course.code}
                                </div>
                            `).join('')}
                        </div>
                    `;
                    VisualizationModule.showTooltip(tooltipContent, event);
                })
                .on('mouseleave', function() {
                    VisualizationModule.hoveredNode = null;
                    VisualizationModule.clearHighlights();
                    VisualizationModule.hideTooltip();
                });
            
            nodeGroup.append('circle')
                .attr('r', 10)
                .attr('fill', isMet ? VisualizationModule.getCompetencyColor(comp.id) : '#ccc')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .attr('class', `node-comp-${comp.id}`)
                .style('transition', 'all 0.3s ease');
            
            if (isMet) {
                nodeGroup.append('text')
                    .attr('x', 0)
                    .attr('y', 4)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#fff')
                    .style('font-size', '10px')
                    .style('font-weight', 'bold')
                    .text('✓');
            }
            
            nodeGroup.append('text')
                .attr('x', 15)
                .attr('y', 5)
                .attr('text-anchor', 'start')
                .attr('fill', isMet ? VisualizationModule.getCompetencyColor(comp.id) : '#999')
                .style('font-weight', '600')
                .style('font-size', '13px')
                .style('transition', 'all 0.3s ease')
                .attr('class', `text-comp-${comp.id}`)
                .text(comp.name);
        });
        
        // Add labels
        g.append('text')
            .attr('x', courseX)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#003366')
            .style('font-weight', 'bold')
            .style('font-size', '16px')
            .text('Selected Courses');
        
        g.append('text')
            .attr('x', compX)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#003366')
            .style('font-weight', 'bold')
            .style('font-size', '16px')
            .text('College Competencies');
    },
    
    renderRadialGraph: () => {
        const svg = VisualizationModule.svg;
        svg.selectAll('*').remove();
        
        const selectedCourses = StateGetters.getSelectedCourses();
        const competencies = StateGetters.getCompetencies();
        
        if (selectedCourses.length === 0) {
            VisualizationModule.showEmptyState();
            return;
        }
        
        const centerX = VisualizationModule.width / 2;
        const centerY = VisualizationModule.height / 2;
        const radius = Math.min(VisualizationModule.width, VisualizationModule.height) / 2 - 80; // Reduced from 120 to 80 for more space
        
        const g = svg.append('g');
        
        const angleStep = (2 * Math.PI) / competencies.length;
        const compPositions = competencies.map((comp, i) => ({
            ...comp,
            x: centerX + radius * Math.cos(i * angleStep - Math.PI / 2),
            y: centerY + radius * Math.sin(i * angleStep - Math.PI / 2),
            angle: i * angleStep
        }));
        
        const courseRadius = radius * 0.35; // Reduced from 0.4 to 0.35 for more separation
        const coursePositions = selectedCourses.map((course, i) => {
            const angle = (2 * Math.PI * i) / selectedCourses.length - Math.PI / 2;
            return {
                ...course,
                x: centerX + courseRadius * Math.cos(angle),
                y: centerY + courseRadius * Math.sin(angle)
            };
        });
        
        const metCompetencies = new Set();
        selectedCourses.forEach(course => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    metCompetencies.add(compId);
                }
            });
        });
        
        const linkGroup = g.append('g').attr('class', 'links');
        
        coursePositions.forEach(course => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    const comp = compPositions.find(c => c.id === compId);
                    if (comp) {
                        linkGroup.append('line')
                            .attr('x1', course.x)
                            .attr('y1', course.y)
                            .attr('x2', comp.x)
                            .attr('y2', comp.y)
                            .attr('stroke', VisualizationModule.getCompetencyColor(compId))
                            .attr('stroke-width', 1.5)
                            .attr('opacity', 0.4)
                            .attr('class', `link link-course-${course.id} link-comp-${compId}`)
                            .style('transition', 'all 0.3s ease');
                    }
                }
            });
        });
        
        const compNodes = g.append('g').attr('class', 'competency-nodes');
        
        compPositions.forEach(comp => {
            const isMet = metCompetencies.has(comp.id);
            
            const nodeGroup = compNodes.append('g')
                .attr('transform', `translate(${comp.x},${comp.y})`)
                .style('cursor', 'pointer')
                .on('mouseenter', function(event) {
                    VisualizationModule.hoveredNode = { id: comp.id, type: 'competency', data: comp };
                    VisualizationModule.highlightConnections(comp.id, 'competency');
                    
                    const relatedCourses = selectedCourses.filter(c => {
                        return VisualizationModule.getCompetencyWeight(c, comp.id) === 3;
                    });
                    
                    const tooltipContent = `
                        <div style="font-weight: bold; color: ${VisualizationModule.getCompetencyColor(comp.id)}; font-size: 16px; margin-bottom: 8px;">
                            ${comp.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                            Emphasized by ${relatedCourses.length} selected course(s)
                        </div>
                        <div style="margin-top: 8px;">
                            ${relatedCourses.map(course => `
                                <div style="font-size: 11px; color: #666; padding: 2px 0;">
                                    • ${course.code}
                                </div>
                            `).join('')}
                        </div>
                    `;
                    VisualizationModule.showTooltip(tooltipContent, event);
                })
                .on('mouseleave', function() {
                    VisualizationModule.hoveredNode = null;
                    VisualizationModule.clearHighlights();
                    VisualizationModule.hideTooltip();
                });
            
            nodeGroup.append('circle')
                .attr('r', 14)
                .attr('fill', isMet ? VisualizationModule.getCompetencyColor(comp.id) : '#ccc')
                .attr('stroke', '#fff')
                .attr('stroke-width', 3)
                .attr('class', `node-comp-${comp.id}`)
                .style('transition', 'all 0.3s ease');
            
            if (isMet) {
                nodeGroup.append('text')
                    .attr('x', 0)
                    .attr('y', 5)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#fff')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text('✓');
            }
            
            const labelDistance = 25;
            const labelAngle = comp.angle - Math.PI / 2;
            nodeGroup.append('text')
                .attr('x', labelDistance * Math.cos(labelAngle))
                .attr('y', labelDistance * Math.sin(labelAngle) + 5)
                .attr('text-anchor', 'middle')
                .attr('fill', isMet ? VisualizationModule.getCompetencyColor(comp.id) : '#999')
                .style('font-weight', '600')
                .style('font-size', '12px')
                .attr('class', `text-comp-${comp.id}`)
                .text(comp.name);
        });
        
        const courseNodes = g.append('g').attr('class', 'course-nodes');
        
        coursePositions.forEach(course => {
            const compIds = VisualizationModule.getCourseCompetencyIds(course);
            
            const nodeGroup = courseNodes.append('g')
                .attr('transform', `translate(${course.x},${course.y})`)
                .style('cursor', 'pointer')
                .on('mouseenter', function(event) {
                    VisualizationModule.hoveredNode = { id: course.id, type: 'course', data: course };
                    VisualizationModule.highlightConnections(course.id, 'course');
                    
                    const tooltipContent = `
                        <div style="font-weight: bold; color: var(--champlain-navy); font-size: 16px; margin-bottom: 8px;">
                            ${course.code}
                        </div>
                        <div style="color: #666; font-size: 13px; margin-bottom: 12px;">
                            ${course.name}
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Addresses:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${compIds.map(compId => {
                                const comp = competencies.find(c => c.id === compId);
                                const weight = VisualizationModule.getCompetencyWeight(course, compId);
                                return `
                                    <span style="
                                        padding: 4px 8px;
                                        border-radius: 12px;
                                        font-size: 11px;
                                        font-weight: 600;
                                        background: ${VisualizationModule.getCompetencyColor(compId)};
                                        color: white;
                                    ">${comp?.name || compId} (${weight})</span>
                                `;
                            }).join('')}
                        </div>
                        <div style="font-size: 11px; color: #999; margin-top: 8px; font-style: italic;">Click for details</div>
                    `;
                    VisualizationModule.showTooltip(tooltipContent, event);
                })
                .on('mouseleave', function() {
                    VisualizationModule.hoveredNode = null;
                    VisualizationModule.clearHighlights();
                    VisualizationModule.hideTooltip();
                })
                .on('click', function(event) {
                    event.stopPropagation();
                    VisualizationModule.showCourseDetailsModal(course);
                });
            
            nodeGroup.append('circle')
                .attr('r', 12)
                .attr('fill', '#003366')
                .attr('stroke', '#fff')
                .attr('stroke-width', 3)
                .attr('class', `node-course-${course.id}`)
                .style('transition', 'all 0.3s ease');
            
            nodeGroup.append('text')
                .attr('y', -18)
                .attr('text-anchor', 'middle')
                .attr('fill', '#003366')
                .style('font-weight', 'bold')
                .style('font-size', '11px')
                .attr('class', `text-course-${course.id}`)
                .text(course.code);
        });
    },
    
    
    /**
     * Render chord diagram view
     */
    renderChordView: () => {
        const svg = VisualizationModule.svg;
        svg.selectAll('*').remove();
        
        const selectedCourses = StateGetters.getSelectedCourses();
        const competencies = StateGetters.getCompetencies();
        
        if (selectedCourses.length === 0) {
            VisualizationModule.showEmptyState();
            return;
        }
        
        const width = VisualizationModule.width;
        const height = VisualizationModule.height;
        const outerRadius = Math.min(width, height) * 0.4;
        const innerRadius = outerRadius - 30;
        
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);
        
        // Create matrix
        const allItems = [...competencies.map(c => ({ ...c, type: 'comp' })), 
                          ...selectedCourses.map(c => ({ ...c, type: 'course' }))];
        
        const matrix = Array(allItems.length).fill(0).map(() => Array(allItems.length).fill(0));
        
        selectedCourses.forEach((course, courseIdx) => {
            const courseIndex = competencies.length + courseIdx;
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                const compIndex = competencies.findIndex(c => c.id === compId);
                if (compIndex >= 0) {
                    matrix[courseIndex][compIndex] = weight;
                    matrix[compIndex][courseIndex] = weight;
                }
            });
        });
        
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);
        
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);
        
        const ribbon = d3.ribbon()
            .radius(innerRadius);
        
        const chords = chord(matrix);
        
        // Draw groups (arcs)
        const group = g.append('g')
            .selectAll('g')
            .data(chords.groups)
            .enter()
            .append('g');
        
        group.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => {
                const item = allItems[i];
                return item.type === 'comp' 
                    ? VisualizationModule.getCompetencyColor(item.id)
                    : '#003366';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                const item = allItems[d.index];
                const name = item.type === 'comp' ? item.name : item.code;
                VisualizationModule.showTooltip(`<div style="font-weight: bold;">${name}</div>`, event);
            })
            .on('mouseleave', function() {
                d3.select(this).attr('opacity', 1);
                VisualizationModule.hideTooltip();
            });
        
        // Draw ribbons (connections)
        g.append('g')
            .attr('fill-opacity', 0.5)
            .selectAll('path')
            .data(chords)
            .enter()
            .append('path')
            .attr('d', ribbon)
            .attr('fill', d => {
                const sourceItem = allItems[d.source.index];
                return sourceItem.type === 'comp'
                    ? VisualizationModule.getCompetencyColor(sourceItem.id)
                    : '#003366';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                d3.select(this).attr('fill-opacity', 0.9);
                const source = allItems[d.source.index];
                const target = allItems[d.target.index];
                const sourceName = source.type === 'comp' ? source.name : source.code;
                const targetName = target.type === 'comp' ? target.name : target.code;
                VisualizationModule.showTooltip(
                    `<div style="font-weight: bold;">${sourceName} ↔ ${targetName}</div>`,
                    event
                );
            })
            .on('mouseleave', function() {
                d3.select(this).attr('fill-opacity', 0.5);
                VisualizationModule.hideTooltip();
            });
        
        // Labels
        group.append('text')
            .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr('dy', '0.35em')
            .attr('transform', d => `
                rotate(${(d.angle * 180 / Math.PI - 90)})
                translate(${outerRadius + 10})
                ${d.angle > Math.PI ? 'rotate(180)' : ''}
            `)
            .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .attr('fill', (d, i) => {
                const item = allItems[i];
                return item.type === 'comp' 
                    ? VisualizationModule.getCompetencyColor(item.id)
                    : '#003366';
            })
            .text((d, i) => {
                const item = allItems[i];
                return item.type === 'comp' ? item.name : item.code;
            });
    },
    
    highlightConnections: (nodeId, nodeType) => {
        d3.selectAll('.link')
            .attr('opacity', 0.15)
            .attr('stroke-width', 1.5);
        
        d3.selectAll('circle')
            .style('filter', 'none')
            .attr('r', function() {
                const currentR = d3.select(this).attr('r');
                return currentR;
            });
        
        d3.selectAll('text')
            .style('font-weight', '600')
            .style('font-size', function() {
                const classList = this.getAttribute('class') || '';
                return classList.includes('text-') ? '13px' : this.style.fontSize;
            });
        
        if (nodeType === 'course') {
            d3.selectAll(`.link-course-${nodeId}`)
                .attr('opacity', 0.9)
                .attr('stroke-width', 3);
            
            d3.select(`.node-course-${nodeId}`)
                .style('filter', 'drop-shadow(0 0 8px rgba(0,51,102,0.6))')
                .attr('r', 12);
            
            d3.select(`.text-course-${nodeId}`)
                .style('font-weight', 'bold')
                .style('font-size', '15px');
            
            const course = StateGetters.getSelectedCourses().find(c => c.id === nodeId);
            if (course) {
                Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                    if (weight === 3) {
                        d3.select(`.node-comp-${compId}`)
                            .style('filter', `drop-shadow(0 0 8px ${VisualizationModule.getCompetencyColor(compId)})`)
                            .attr('r', 12);
                        
                        d3.select(`.text-comp-${compId}`)
                            .style('font-weight', 'bold')
                            .style('font-size', '15px');
                    }
                });
            }
        } else if (nodeType === 'competency') {
            d3.selectAll(`.link-comp-${nodeId}`)
                .attr('opacity', 0.9)
                .attr('stroke-width', 3);
            
            d3.select(`.node-comp-${nodeId}`)
                .style('filter', `drop-shadow(0 0 8px ${VisualizationModule.getCompetencyColor(nodeId)})`)
                .attr('r', 12);
            
            d3.select(`.text-comp-${nodeId}`)
                .style('font-weight', 'bold')
                .style('font-size', '15px');
            
            const selectedCourses = StateGetters.getSelectedCourses();
            selectedCourses.forEach(course => {
                const weight = VisualizationModule.getCompetencyWeight(course, nodeId);
                if (weight === 3) {
                    d3.select(`.node-course-${course.id}`)
                        .style('filter', 'drop-shadow(0 0 8px rgba(0,51,102,0.6))')
                        .attr('r', 12);
                    
                    d3.select(`.text-course-${course.id}`)
                        .style('font-weight', 'bold')
                        .style('font-size', '15px');
                }
            });
        }
    },
    
    clearHighlights: () => {
        d3.selectAll('.link')
            .attr('opacity', 0.6)
            .attr('stroke-width', 1.5);
        
        d3.selectAll('circle')
            .style('filter', 'none')
            .attr('r', function() {
                const classList = this.getAttribute('class') || '';
                if (classList.includes('node-comp-')) {
                    return 10;
                } else if (classList.includes('node-course-')) {
                    return 10;
                }
                return this.getAttribute('r');
            });
        
        if (VisualizationModule.viewMode === 'radial') {
            d3.selectAll('.competency-nodes circle').attr('r', 14);
            d3.selectAll('.course-nodes circle').attr('r', 12);
        }
        
        d3.selectAll('text')
            .style('font-weight', '600')
            .style('font-size', function() {
                const classList = this.getAttribute('class') || '';
                if (classList.includes('text-')) {
                    return VisualizationModule.viewMode === 'radial' ? '12px' : '13px';
                }
                return this.style.fontSize;
            });
    },
    
    setupViewToggle: () => {
        const networkViewBtn = document.getElementById('networkViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        const prerequisiteViewBtn = document.getElementById('prerequisiteViewBtn');
        const pathwayViewBtn = document.getElementById('pathwayViewBtn');
        const graphsViewBtn = document.getElementById('graphsViewBtn');
        const semesterPlannerBtn = document.getElementById('semesterPlannerBtn');

        const allViews = ['networkView', 'tableView', 'prerequisiteView', 'pathwayView', 'graphsView', 'semesterPlannerView'];
        const allBtns = [networkViewBtn, tableViewBtn, prerequisiteViewBtn, pathwayViewBtn, graphsViewBtn, semesterPlannerBtn];

        // Helper to switch views
        const switchView = (viewId, activeBtn) => {
            // Update title and description
            const title = document.getElementById('vizTitle');
            const description = document.getElementById('vizDescription');

            if (viewId === 'networkView') {
                title.textContent = 'Competency Visualization';
                description.textContent = 'Interactive network showing relationships between courses and college competencies';
            } else if (viewId === 'tableView') {
                title.textContent = 'Competency Table';
                description.textContent = 'Detailed table view of competency coverage across selected courses';
            } else if (viewId === 'prerequisiteView') {
                title.textContent = 'Prerequisite Chain';
                description.textContent = 'Hierarchical view of course prerequisites and dependencies';
            } else if (viewId === 'pathwayView') {
                title.textContent = 'Course Pathway';
                description.textContent = 'Visualize available courses based on completed prerequisites and plan your academic pathway';
            } else if (viewId === 'graphsView') {
                title.textContent = 'Competency Graphs';
                description.textContent = 'Visual analytics showing competency weight distribution across selected courses';
            } else if (viewId === 'semesterPlannerView') {
                title.textContent = 'Semester Planner';
                description.textContent = 'Plan your course schedule across semesters and track competency progression';
            }

            // Hide all views
            allViews.forEach(v => {
                const elem = document.getElementById(v);
                if (elem) elem.classList.add('hidden');
            });

            // Show selected view
            const elem = document.getElementById(viewId);
            if (elem) elem.classList.remove('hidden');

            // Update button states
            allBtns.forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
            if (activeBtn) activeBtn.classList.add('active');
        };

        if (networkViewBtn) {
            networkViewBtn.addEventListener('click', () => {
                switchView('networkView', networkViewBtn);
            });
        }

        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => {
                switchView('tableView', tableViewBtn);
                VisualizationModule.renderTableView();
            });
        }

        if (prerequisiteViewBtn) {
            prerequisiteViewBtn.addEventListener('click', () => {
                switchView('prerequisiteView', prerequisiteViewBtn);
                const selectedCourses = StateGetters.getSelectedCourses();
                const selectedCodes = selectedCourses.map(c => c.code);
                PrerequisiteVisualization.render(selectedCodes, 'chain');
            });
        }

        if (pathwayViewBtn) {
            pathwayViewBtn.addEventListener('click', () => {
                switchView('pathwayView', pathwayViewBtn);
                VisualizationModule.renderPathwaySelector();
            });
        }

        if (graphsViewBtn) {
            graphsViewBtn.addEventListener('click', () => {
                switchView('graphsView', graphsViewBtn);
                if (typeof GraphsModule !== 'undefined') {
                    GraphsModule.init();
                }
            });
        }

        if (semesterPlannerBtn) {
            semesterPlannerBtn.addEventListener('click', () => {
                switchView('semesterPlannerView', semesterPlannerBtn);
                // Initialize semester planner
                if (typeof SemesterPlannerUI !== 'undefined' && typeof SemesterPlannerUI.initView === 'function') {
                    SemesterPlannerUI.initView();
                }
            });
        }
    },
    
    renderTableView: () => {
        const tableDiv = document.getElementById('competencyTable');
        const selectedCourses = StateGetters.getSelectedCourses();
        const competencies = StateGetters.getCompetencies();
        
        if (selectedCourses.length === 0) {
            tableDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">Select courses to view competency coverage table</p>';
            return;
        }
        
        const columnTotals = selectedCourses.map(course => {
            return Object.values(course.competencies || {}).reduce((sum, weight) => sum + weight, 0);
        });
        
        const rowTotals = competencies.map(comp => {
            return selectedCourses.reduce((sum, course) => {
                return sum + (VisualizationModule.getCompetencyWeight(course, comp.id));
            }, 0);
        });
        
        const grandTotal = columnTotals.reduce((sum, val) => sum + val, 0);
        
        const exportBtn = `
            <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <h3 style="margin: 0; color: var(--champlain-navy); font-size: 20px; font-weight: 700;">Competency Coverage Matrix</h3>
                <button 
                    onclick="VisualizationModule.exportTableToCSV()"
                    style="
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #28a745 0%, #20a03d 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(40, 167, 69, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'"
                >
                    <span style="font-size: 16px;">📊</span> Export to CSV
                </button>
            </div>
        `;
        
        let html = exportBtn;
        html += '<div class="table-container" style="flex: 1; overflow: auto; border-radius: 12px; border: 1px solid #e8eaf0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">';
        html += '<table class="competency-table">';
        html += '<thead><tr>';
        html += '<th style="min-width: 200px;">Competency</th>';
        
        selectedCourses.forEach(course => {
            html += `<th style="min-width: 120px; text-align: center;">${course.code}<br><span style="font-size: 10px; font-weight: 400; opacity: 0.8; text-transform: none;">${course.name.substring(0, 20)}...</span></th>`;
        });
        
        html += '<th style="min-width: 100px; text-align: center; background: #003C71;">Total</th>';
        html += '</tr></thead><tbody>';
        
        competencies.forEach((comp, index) => {
            html += '<tr>';
            html += `<td style="font-weight: 700; color: ${VisualizationModule.getCompetencyColor(comp.id)}; font-size: 13px;">${comp.name}</td>`;
            
            selectedCourses.forEach(course => {
                const weight = VisualizationModule.getCompetencyWeight(course, comp.id);
                const baseColor = VisualizationModule.getCompetencyColor(comp.id);
                
                const opacity = weight === 0 ? 0 : (weight / 3) * 0.7 + 0.1;
                const bgColor = weight === 0 ? '#fafbfc' : baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0');
                
                const symbol = weight === 0 ? '—' : 
                               weight === 1 ? '◉' : 
                               weight === 2 ? '◆' : 
                               '★';
                
                html += `<td style="padding: 14px 12px; border: 1px solid #e8eaf0; text-align: center; background: ${bgColor}; transition: all 0.2s ease;">`;
                html += `<span style="color: ${weight === 0 ? '#ccc' : baseColor}; font-weight: bold; font-size: 18px;" title="Weight: ${weight}">${symbol}</span>`;
                html += `<div style="font-size: 10px; color: ${weight === 0 ? '#ccc' : baseColor}; margin-top: 2px; font-weight: 600;">${weight === 0 ? 'None' : weight === 1 ? 'Address' : weight === 2 ? 'Reinforce' : 'Emphasize'}</div>`;
                html += '</td>';
            });
            
            html += `<td style="padding: 14px 12px; text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); font-weight: 700; font-size: 15px; color: var(--champlain-navy);">${rowTotals[index]}</td>`;
            html += '</tr>';
        });
        
        html += '<tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); font-weight: 700; border-top: 3px solid var(--champlain-navy);">';
        html += '<td style="padding: 16px 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--champlain-navy);">Total</td>';
        columnTotals.forEach(total => {
            html += `<td style="padding: 16px 12px; text-align: center; font-size: 16px; color: var(--champlain-blue);">${total}</td>`;
        });
        html += `<td style="padding: 16px 12px; text-align: center; background: linear-gradient(135deg, #003C5F 0%, #236192 100%); color: white; font-size: 18px; font-weight: 800;">${grandTotal}</td>`;
        html += '</tr>';
        
        html += '</tbody></table>';
        html += '</div>';
        
        html += `
            <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; border: 1px solid #e8eaf0; flex-shrink: 0;">
                <div style="font-weight: 700; margin-bottom: 12px; color: var(--champlain-navy); font-size: 15px;">Legend:</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; font-size: 13px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px; color: #ccc;">—</span> 
                        <span><strong>None (0)</strong> - Not addressed</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">◉</span> 
                        <span><strong>Addressed (1)</strong> - Introduced</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">◆</span> 
                        <span><strong>Reinforced (2)</strong> - Practiced</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">★</span> 
                        <span><strong>Emphasized (3)</strong> - Mastered</span>
                    </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8eaf0; font-size: 12px; color: #6c757d;">
                    <strong>Note:</strong> Darker cell shading indicates stronger competency emphasis. Network visualization displays only Level 3 (★) connections for clarity.
                </div>
            </div>
        `;
        
        tableDiv.innerHTML = html;
    },
    
    exportTableToCSV: () => {
        const selectedCourses = StateGetters.getSelectedCourses();
        const competencies = StateGetters.getCompetencies();
        
        if (selectedCourses.length === 0) {
            alert('No courses selected to export');
            return;
        }
        
        let csv = 'Competency Coverage Matrix\n\n';
        
        csv += 'Competency';
        selectedCourses.forEach(course => {
            csv += ',' + course.code;
        });
        csv += '\n';
        
        competencies.forEach(comp => {
            csv += '"' + comp.name + '"';
            selectedCourses.forEach(course => {
                const weight = VisualizationModule.getCompetencyWeight(course, comp.id);
                csv += ',' + weight;
            });
            csv += '\n';
        });
        
        csv += '\n\nSummary\n';
        csv += 'Total Courses,' + selectedCourses.length + '\n';
        csv += 'Total Competencies,' + competencies.length + '\n';
        
        const metCompetencies = new Set();
        selectedCourses.forEach(course => {
            Object.entries(course.competencies || {}).forEach(([compId, weight]) => {
                if (weight === 3) {
                    metCompetencies.add(compId);
                }
            });
        });
        csv += 'Competencies Emphasized (Level 3),' + metCompetencies.size + '\n';
        csv += 'Coverage Percentage,' + Math.round((metCompetencies.size / competencies.length) * 100) + '%\n';
        
        csv += '\n\nCourse Details\n';
        csv += 'Code,Name,Credit Hours,Prerequisites,Competencies\n';
        selectedCourses.forEach(course => {
            const compIds = VisualizationModule.getCourseCompetencyIds(course);
            const compNames = compIds.map(c => {
                const comp = competencies.find(comp => comp.id === c);
                const weight = VisualizationModule.getCompetencyWeight(course, c);
                return comp ? `${comp.name} (${weight})` : c;
            }).join('; ');
            
            csv += `"${course.code}","${course.name}","${course.creditHours || 'N/A'}","${course.prerequisites || 'None'}","${compNames}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `competency-coverage-${date}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    showCourseDetailsModal: (course) => {
        const competencies = StateGetters.getCompetencies();
        
        let modal = document.getElementById('courseDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'courseDetailsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 id="courseDetailsTitle">Course Details</h2>
                        <button class="close-btn" id="closeCourseDetailsBtn">&times;</button>
                    </div>
                    <div class="modal-body" id="courseDetailsBody" style="max-height: 70vh; overflow-y: auto;"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('closeCourseDetailsBtn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        const compEntries = Object.entries(course.competencies || {}).filter(([id, weight]) => weight > 0);
        
        const ploNames = course.plos ? course.plos.join(', ') : 'Not specified';
        const closNames = course.clos ? course.clos.join(', ') : 'Not specified';
        
        document.getElementById('courseDetailsBody').innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="color: var(--champlain-navy); margin-bottom: 4px; font-size: 26px; font-weight: bold;">
                    ${course.code}
                </h3>
                <h4 style="color: #666; margin: 0; font-size: 18px; font-weight: 600;">
                    ${course.name}
                </h4>
            </div>
            
            ${course.description ? `
                <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-left: 4px solid var(--champlain-navy); border-radius: 4px;">
                    <h4 style="color: var(--champlain-navy); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                        📝 Course Description
                    </h4>
                    <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0;">
                        ${course.description}
                    </p>
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                ${course.creditHours ? `
                    <div style="padding: 12px; background: #e8f5e9; border-radius: 8px;">
                        <div style="font-size: 12px; color: #2e7d32; font-weight: 600; margin-bottom: 4px;">CREDIT HOURS</div>
                        <div style="font-size: 20px; color: #1b5e20; font-weight: bold;">${course.creditHours}</div>
                    </div>
                ` : ''}
                
                ${course.prerequisites ? `
                    <div style="padding: 12px; background: #fff3e0; border-radius: 8px;">
                        <div style="font-size: 12px; color: #e65100; font-weight: 600; margin-bottom: 4px;">PREREQUISITES</div>
                        <div style="font-size: 14px; color: #bf360c; font-weight: 600;">${course.prerequisites}</div>
                    </div>
                ` : ''}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--champlain-navy); margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">📚</span> College Competencies
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${compEntries.map(([compId, weight]) => {
                        const comp = competencies.find(c => c.id === compId);
                        const weightLabel = weight === 3 ? 'Emphasized' : weight === 2 ? 'Reinforced' : 'Addressed';
                        const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
                        return `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 10px 14px;
                                border-radius: 20px;
                                background: ${VisualizationModule.getCompetencyColor(compId)}15;
                                border: 2px solid ${VisualizationModule.getCompetencyColor(compId)};
                            ">
                                <span style="font-size: 13px; font-weight: 600; color: ${VisualizationModule.getCompetencyColor(compId)};">
                                    ${comp?.name || compId}
                                </span>
                                <span style="font-size: 14px; font-weight: bold; color: ${VisualizationModule.getCompetencyColor(compId)};">
                                    ${symbol} ${weightLabel} (${weight})
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${course.justification ? `
                <div style="margin-bottom: 20px; padding: 16px; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                    <h4 style="color: #1565c0; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                        💡 Course Justification
                    </h4>
                    <p style="color: #0d47a1; font-size: 14px; line-height: 1.6; margin: 0;">
                        ${course.justification}
                    </p>
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <h4 style="color: var(--champlain-navy); margin-bottom: 10px; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 16px;">🎯</span> Program Learning Objectives
                    </h4>
                    <div style="background: #f5f5f5; padding: 12px; border-radius: 6px;">
                        <p style="color: #666; font-size: 13px; margin: 0; font-family: monospace;">
                            ${ploNames}
                        </p>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--champlain-navy); margin-bottom: 10px; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 16px;">✓</span> Course Learning Objectives
                    </h4>
                    <div style="background: #f5f5f5; padding: 12px; border-radius: 6px;">
                        <p style="color: #666; font-size: 13px; margin: 0; font-family: monospace;">
                            ${closNames}
                        </p>
                    </div>
                </div>
            </div>
            
            ${course.submittedBy ? `
                <div style="padding: 12px; background: #fafafa; border-radius: 6px; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #999; display: flex; justify-content: space-between;">
                        <span>Submitted by: <strong style="color: #666;">${course.submittedBy}</strong></span>
                        ${course.submittedDate ? `<span>Date: <strong style="color: #666;">${course.submittedDate}</strong></span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: var(--champlain-navy); margin-bottom: 12px; font-size: 14px;">
                    Quick Actions
                </h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button 
                        onclick="VisualizationModule.exportCourseProposal(${course.id})"
                        style="
                            padding: 10px 18px;
                            background: #17a2b8;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.background='#138496'"
                        onmouseout="this.style.background='#17a2b8'"
                    >
                        📄 Export Proposal
                    </button>
                    <button 
                        onclick="CoursesModule.removeCourseSelection(${course.id}); document.getElementById('courseDetailsModal').style.display='none';"
                        style="
                            padding: 10px 18px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.background='#c82333'"
                        onmouseout="this.style.background='#dc3545'"
                    >
                        ✕ Remove from Selection
                    </button>
                    ${Auth.isAdmin() ? `
                        <button 
                            onclick="CoursesModule.editCourse(${course.id}); document.getElementById('courseDetailsModal').style.display='none';"
                            style="
                                padding: 10px 18px;
                                background: var(--champlain-navy);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: 600;
                                transition: background 0.2s;
                            "
                            onmouseover="this.style.background='#00509e'"
                            onmouseout="this.style.background='var(--champlain-navy)'"
                        >
                            ✏️ Edit Course
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    },
    
    exportCourseProposal: (courseId) => {
        const courses = StateGetters.getCourses();
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            alert('Course not found');
            return;
        }
        
        const competencies = StateGetters.getCompetencies();
        const compIds = VisualizationModule.getCourseCompetencyIds(course);
        const compNames = compIds.map(c => {
            const comp = competencies.find(comp => comp.id === c);
            const weight = VisualizationModule.getCompetencyWeight(course, c);
            return comp ? `${comp.name} (Weight: ${weight})` : c;
        }).join(', ');
        
        let content = `CHAMPLAIN COLLEGE
ACADEMIC AFFAIRS
Course Proposal Form

================================================================================

COURSE INFORMATION
================================================================================

Course Code:        ${course.code}
Course Title:       ${course.name}
Credit Hours:       ${course.creditHours || 'Not specified'}
Prerequisites:      ${course.prerequisites || 'None'}

================================================================================

COURSE DESCRIPTION
================================================================================

${course.description || 'No description provided'}

================================================================================

COLLEGE COMPETENCIES ADDRESSED
================================================================================

${compNames}

Individual Competencies:
`;
        
        compIds.forEach(compId => {
            const comp = competencies.find(c => c.id === compId);
            const weight = VisualizationModule.getCompetencyWeight(course, compId);
            const symbol = weight === 3 ? '★' : weight === 2 ? '◆' : '◉';
            if (comp) {
                content += `  ${symbol} ${comp.name} - Weight: ${weight}\n`;
            }
        });
        
        content += `
================================================================================

PROGRAM LEARNING OBJECTIVES (PLOs)
================================================================================

${course.plos ? course.plos.join(', ') : 'Not specified'}

================================================================================

COURSE LEARNING OBJECTIVES (CLOs)
================================================================================

${course.clos ? course.clos.join(', ') : 'Not specified'}

================================================================================

JUSTIFICATION
================================================================================

${course.justification || 'No justification provided'}

================================================================================

SUBMISSION INFORMATION
================================================================================

Submitted By:       ${course.submittedBy || 'N/A'}
Submission Date:    ${course.submittedDate || 'N/A'}
Status:             ${course.status || 'Active'}

================================================================================

COMPETENCY ANALYSIS
================================================================================

Total Competencies Addressed: ${compIds.length} of ${competencies.length}
Coverage Percentage: ${Math.round((compIds.length / competencies.length) * 100)}%

Competency Breakdown:
`;
        
        competencies.forEach(comp => {
            const weight = VisualizationModule.getCompetencyWeight(course, comp.id);
            const addressed = weight > 0 ? `[X] Weight: ${weight}` : '[ ]';
            content += `${addressed} ${comp.name}\n`;
        });
        
        content += `
================================================================================

Generated: ${new Date().toLocaleString()}
System: Champlain Academic Affairs Management System
`;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `${course.code.replace(/[^a-zA-Z0-9]/g, '-')}-proposal-${date}.txt`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Course proposal for ${course.code} exported successfully!`);
    },

    /**
     * Render course selector for pathway view with search
     */
    renderPathwaySelector: () => {
        const searchInput = document.getElementById('completedCoursesSearch');
        const dropdown = document.getElementById('completedCoursesDropdown');
        const selectedContainer = document.getElementById('completedCoursesSelected');
        const courses = StateGetters.getCourses();

        if (!searchInput || !dropdown || !selectedContainer) return;

        // Track completed courses
        let completedCourses = [];

        // Update selected courses display
        const updateSelectedDisplay = () => {
            selectedContainer.innerHTML = completedCourses.map(code => {
                const course = courses.find(c => c.code === code);
                return `
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        padding: 6px 12px;
                        background: #4CAF50;
                        color: white;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                    ">
                        <span>${course ? course.code : code}</span>
                        <button onclick="VisualizationModule.removeCompletedCourse('${code}')"
                                style="
                                    background: none;
                                    border: none;
                                    color: white;
                                    cursor: pointer;
                                    padding: 0;
                                    font-size: 16px;
                                    line-height: 1;
                                ">&times;</button>
                    </div>
                `;
            }).join('');
        };

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            if (searchTerm === '') {
                dropdown.classList.add('hidden');
                return;
            }

            // Filter courses by search term
            const filteredCourses = courses.filter(course => {
                const searchString = `${course.code} ${course.name}`.toLowerCase();
                return searchString.includes(searchTerm) && !completedCourses.includes(course.code);
            });

            if (filteredCourses.length === 0) {
                dropdown.innerHTML = '<div style="padding: 12px; color: #999; text-align: center;">No courses found</div>';
                dropdown.classList.remove('hidden');
                return;
            }

            // Render dropdown results
            dropdown.innerHTML = filteredCourses.slice(0, 10).map(course => {
                return `
                    <div class="course-search-result"
                         data-code="${course.code}"
                         style="
                            padding: 10px 12px;
                            cursor: pointer;
                            border-bottom: 1px solid #eee;
                            transition: background 0.2s;
                         "
                         onmouseover="this.style.background='#f0f8ff'"
                         onmouseout="this.style.background='white'">
                        <div style="font-weight: 600; color: var(--champlain-navy); margin-bottom: 2px;">
                            ${course.code}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            ${course.name || 'No title'}
                        </div>
                    </div>
                `;
            }).join('');

            dropdown.classList.remove('hidden');

            // Add click handlers
            dropdown.querySelectorAll('.course-search-result').forEach(result => {
                result.addEventListener('click', () => {
                    const code = result.getAttribute('data-code');
                    if (!completedCourses.includes(code)) {
                        completedCourses.push(code);
                        updateSelectedDisplay();
                        VisualizationModule.updatePathwayView();
                    }
                    searchInput.value = '';
                    dropdown.classList.add('hidden');
                });
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Store reference to update function
        VisualizationModule._completedCourses = completedCourses;
        VisualizationModule._updateSelectedDisplay = updateSelectedDisplay;

        // Initial render
        VisualizationModule.updatePathwayView();
    },

    /**
     * Remove a completed course
     */
    removeCompletedCourse: (code) => {
        if (!VisualizationModule._completedCourses) return;

        const index = VisualizationModule._completedCourses.indexOf(code);
        if (index > -1) {
            VisualizationModule._completedCourses.splice(index, 1);
            VisualizationModule._updateSelectedDisplay();
            VisualizationModule.updatePathwayView();
        }
    },

    /**
     * Update pathway view based on selected completed courses
     */
    updatePathwayView: () => {
        const completedCourses = VisualizationModule._completedCourses || [];

        // Get pathway data
        const pathway = PrerequisitesModule.getStudentPathway(completedCourses);

        // Update counts
        document.getElementById('completedCount').textContent = `(${completedCourses.length})`;
        document.getElementById('availableCount').textContent = `(${pathway.available.length})`;
        document.getElementById('lockedCount').textContent = `(${pathway.locked.length})`;

        // Render completed courses
        const completedBox = document.getElementById('completedCoursesBox');
        if (completedBox) {
            const courses = StateGetters.getCourses();
            completedBox.innerHTML = completedCourses.length === 0
                ? '<p style="color: #999; text-align: center; padding: 20px;">No completed courses selected</p>'
                : completedCourses.map(code => {
                    const course = courses.find(c => c.code === code);
                    return VisualizationModule.renderCourseCard(course || { code, name: code }, '#4CAF50');
                }).join('');
        }

        // Render available courses
        const availableBox = document.getElementById('availableCoursesBox');
        if (availableBox) {
            availableBox.innerHTML = pathway.available.length === 0
                ? '<p style="color: #999; text-align: center; padding: 20px;">No available courses</p>'
                : pathway.available.map(course => {
                    return VisualizationModule.renderCourseCard(course, '#00A9E0');
                }).join('');
        }

        // Render locked courses
        const lockedBox = document.getElementById('lockedCoursesBox');
        if (lockedBox) {
            lockedBox.innerHTML = pathway.locked.length === 0
                ? '<p style="color: #999; text-align: center; padding: 20px;">No locked courses</p>'
                : pathway.locked.map(course => {
                    return VisualizationModule.renderCourseCard(course, '#999', true);
                }).join('');
        }
    },

    /**
     * Render a course card for pathway view
     */
    renderCourseCard: (course, borderColor, showMissingPrereqs = false) => {
        const missingPrereqs = showMissingPrereqs && course.missingPrerequisites
            ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #eee;">
                 <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Missing prerequisites:</div>
                 <div style="font-size: 11px; color: #d32f2f;">${course.missingPrerequisites.join(', ')}</div>
               </div>`
            : '';

        return `
            <div style="
                background: white;
                border: 1px solid ${borderColor};
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
            "
            onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)'"
            onclick="PrerequisitesModule.showCourseDetails('${course.code}')">
                <div style="font-weight: bold; color: var(--champlain-navy); margin-bottom: 4px; font-size: 13px;">
                    ${course.code}
                </div>
                <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                    ${course.name || 'No title'}
                </div>
                <div style="font-size: 11px; color: #999;">
                    ${course.credits || 3} credits
                </div>
                ${missingPrereqs}
            </div>
        `;
    }
};