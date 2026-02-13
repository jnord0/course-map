// Prerequisite Chain Visualization Module
// Handles D3.js visualization of course prerequisite relationships

const PrerequisiteVisualization = {
    svg: null,
    width: 0,
    height: 0,
    currentMode: 'chain', // 'chain' or 'pathway'
    simulation: null,

    // Node dimensions for pill-shaped nodes
    NODE_WIDTH: 100,
    NODE_HEIGHT: 32,
    FOCUS_NODE_WIDTH: 110,
    FOCUS_NODE_HEIGHT: 36,

    /**
     * Initialize prerequisite visualization
     */
    init: () => {
        const container = document.getElementById('prerequisiteGraphContainer');
        if (!container) {
            console.error('Prerequisite graph container not found');
            return;
        }

        const rect = container.getBoundingClientRect();
        PrerequisiteVisualization.width = rect.width - 40;
        PrerequisiteVisualization.height = rect.height - 40;

        PrerequisiteVisualization.svg = d3.select('#prerequisiteGraph');
        PrerequisiteVisualization.svg
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${PrerequisiteVisualization.width} ${PrerequisiteVisualization.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('background', '#fafbfc');
    },

    /**
     * Open the course details modal (same as the main visualization)
     */
    _openCourseModal: (courseCode) => {
        if (!courseCode) return;
        const courses = StateGetters.getCourses();
        const course = courses.find(c => c.code === courseCode);
        if (course && typeof VisualizationModule !== 'undefined' && VisualizationModule.showCourseDetailsModal) {
            VisualizationModule.showCourseDetailsModal(course);
        } else if (typeof PrerequisitesModule !== 'undefined') {
            PrerequisitesModule.showCourseDetails(courseCode);
        }
    },

    /**
     * Render prerequisite chain for selected courses
     */
    render: (selectedCourseCodes = [], mode = 'chain') => {
        if (!PrerequisiteVisualization.svg) {
            PrerequisiteVisualization.init();
        }

        if (!selectedCourseCodes || selectedCourseCodes.length === 0) {
            PrerequisiteVisualization.renderEmptyState();
            return;
        }

        PrerequisiteVisualization.currentMode = mode;
        const graphData = PrerequisitesModule.buildPrerequisiteGraph(selectedCourseCodes);

        if (graphData.nodes.length === 0) {
            PrerequisiteVisualization.renderEmptyState('No prerequisite relationships found');
            return;
        }

        if (mode === 'chain') {
            PrerequisiteVisualization.renderHierarchicalLayout(graphData);
        } else {
            PrerequisiteVisualization.renderForceLayout(graphData);
        }
    },

    /**
     * Render empty state message
     */
    renderEmptyState: (message = 'Select courses to view prerequisite chains') => {
        PrerequisiteVisualization.svg.selectAll('*').remove();

        PrerequisiteVisualization.svg.append('text')
            .attr('x', PrerequisiteVisualization.width / 2)
            .attr('y', PrerequisiteVisualization.height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#999')
            .attr('font-size', '16px')
            .text(message);
    },

    /**
     * Render hierarchical (tree) layout for prerequisite chain
     */
    renderHierarchicalLayout: (graphData) => {
        const PV = PrerequisiteVisualization;
        PV.svg.selectAll('*').remove();

        const hierarchy = PV.buildHierarchy(graphData);
        if (!hierarchy) {
            PV.renderEmptyState('Unable to build hierarchy');
            return;
        }

        // Wider separation to prevent node overlap
        const treeLayout = d3.tree()
            .size([PV.width - 240, PV.height - 240])
            .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));

        const root = d3.hierarchy(hierarchy);
        treeLayout(root);

        // Defs for arrow markers
        const defs = PV.svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L10,0L0,4')
            .attr('fill', '#003C5F');

        // Drop shadow filter
        const filter = defs.append('filter')
            .attr('id', 'nodeShadow')
            .attr('x', '-20%').attr('y', '-20%')
            .attr('width', '140%').attr('height', '140%');
        filter.append('feDropShadow')
            .attr('dx', 0).attr('dy', 1)
            .attr('stdDeviation', 2)
            .attr('flood-color', 'rgba(0,0,0,0.15)');

        const g = PV.svg.append('g')
            .attr('transform', `translate(120, 120)`);

        // Draw links: vertical curves that stop at pill edges
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'prereq-link')
            .attr('d', d => {
                const sh = d.source.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT;
                const th = d.target.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT;
                const sy = d.source.y + sh / 2;       // bottom edge of source pill
                const ty = d.target.y - th / 2 - 6;   // top edge of target pill (with arrow gap)
                const mid = (sy + ty) / 2;
                return `M${d.source.x},${sy} C${d.source.x},${mid} ${d.target.x},${mid} ${d.target.x},${ty}`;
            })
            .attr('fill', 'none')
            .attr('stroke', '#90a4ae')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)');

        // Draw nodes (on top of links)
        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'prereq-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                d3.select(this).select('rect')
                    .attr('filter', 'url(#nodeShadow)')
                    .transition().duration(150)
                    .attr('y', d => -(d.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2 - 1);
            })
            .on('mouseleave', function(event, d) {
                d3.select(this).select('rect')
                    .attr('filter', null)
                    .transition().duration(150)
                    .attr('y', d => -(d.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2);
            })
            .on('click', (event, d) => {
                if (d.data.code) {
                    PV._openCourseModal(d.data.code);
                }
            });

        // Pill-shaped background
        nodes.append('rect')
            .attr('x', d => -(d.data.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH) / 2)
            .attr('y', d => -(d.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2)
            .attr('width', d => d.data.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH)
            .attr('height', d => d.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT)
            .attr('rx', d => (d.data.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2)
            .attr('fill', d => d.data.isFocus ? '#00A9E0' : '#236192')
            .attr('stroke', d => d.data.isFocus ? '#0088b8' : '#1a4a70')
            .attr('stroke-width', 1);

        // Course code label inside pill
        nodes.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', d => d.data.isFocus ? '13px' : '12px')
            .attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .text(d => d.data.code || d.data.name);

        // Zoom/pan
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        PV.svg.call(zoom);
    },

    /**
     * Build hierarchy structure from graph data
     */
    buildHierarchy: (graphData) => {
        const { nodes, links } = graphData;

        const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));
        const hasIncoming = new Set();

        links.forEach(link => {
            hasIncoming.add(link.target);
        });

        const rootNodes = nodes.filter(n => !hasIncoming.has(n.id));

        if (rootNodes.length === 0) {
            const focusNode = nodes.find(n => n.isFocus) || nodes[0];
            return nodeMap.get(focusNode.id);
        }

        // Build children relationships
        links.forEach(link => {
            const parent = nodeMap.get(link.source);
            const child = nodeMap.get(link.target);
            if (parent && child && !parent.children.includes(child)) {
                parent.children.push(child);
            }
        });

        if (rootNodes.length > 1) {
            return {
                name: 'Courses',
                code: '',
                children: rootNodes.map(n => nodeMap.get(n.id))
            };
        }

        return nodeMap.get(rootNodes[0].id);
    },

    /**
     * Render force-directed layout for prerequisite network
     */
    renderForceLayout: (graphData) => {
        const PV = PrerequisiteVisualization;
        PV.svg.selectAll('*').remove();

        const { nodes, links } = graphData;

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(180))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(PV.width / 2, PV.height / 2))
            .force('collision', d3.forceCollide().radius(70));

        PV.simulation = simulation;

        // Defs
        const defs = PV.svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L10,0L0,4')
            .attr('fill', '#003C5F');

        const filter = defs.append('filter')
            .attr('id', 'forceShadow')
            .attr('x', '-20%').attr('y', '-20%')
            .attr('width', '140%').attr('height', '140%');
        filter.append('feDropShadow')
            .attr('dx', 0).attr('dy', 1)
            .attr('stdDeviation', 2)
            .attr('flood-color', 'rgba(0,0,0,0.15)');

        const g = PV.svg.append('g');

        // Draw links
        const link = g.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'prereq-link')
            .attr('stroke', '#90a4ae')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrow)');

        // Draw nodes (on top of links)
        const node = g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'prereq-node')
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', PV.dragStarted)
                .on('drag', PV.dragged)
                .on('end', PV.dragEnded))
            .on('mouseenter', function() {
                d3.select(this).select('rect').attr('filter', 'url(#forceShadow)');
            })
            .on('mouseleave', function() {
                d3.select(this).select('rect').attr('filter', null);
            })
            .on('click', (event, d) => {
                PV._openCourseModal(d.code);
            });

        // Pill-shaped background
        node.append('rect')
            .attr('x', d => -(d.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH) / 2)
            .attr('y', d => -(d.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2)
            .attr('width', d => d.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH)
            .attr('height', d => d.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT)
            .attr('rx', d => (d.isFocus ? PV.FOCUS_NODE_HEIGHT : PV.NODE_HEIGHT) / 2)
            .attr('fill', d => d.isFocus ? '#00A9E0' : '#236192')
            .attr('stroke', d => d.isFocus ? '#0088b8' : '#1a4a70')
            .attr('stroke-width', 1);

        // Course code inside pill
        node.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', d => d.isFocus ? '13px' : '12px')
            .attr('font-weight', '600')
            .attr('pointer-events', 'none')
            .text(d => d.code);

        // Shorten links so they stop at pill edges, not center
        simulation.on('tick', () => {
            link.each(function(d) {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const sW = (d.source.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH) / 2 + 4;
                const tW = (d.target.isFocus ? PV.FOCUS_NODE_WIDTH : PV.NODE_WIDTH) / 2 + 8;
                d3.select(this)
                    .attr('x1', d.source.x + (dx / dist) * sW)
                    .attr('y1', d.source.y + (dy / dist) * sW)
                    .attr('x2', d.target.x - (dx / dist) * tW)
                    .attr('y2', d.target.y - (dy / dist) * tW);
            });

            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Zoom/pan
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        PV.svg.call(zoom);
    },

    /**
     * Drag event handlers for force layout
     */
    dragStarted: (event, d) => {
        if (!event.active && PrerequisiteVisualization.simulation) {
            PrerequisiteVisualization.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    },

    dragged: (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    },

    dragEnded: (event, d) => {
        if (!event.active && PrerequisiteVisualization.simulation) {
            PrerequisiteVisualization.simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    },

    /**
     * Render student pathway view
     */
    renderPathwayView: (completedCourses = []) => {
        const PV = PrerequisiteVisualization;
        const pathway = PrerequisitesModule.getStudentPathway(completedCourses);

        if (!PV.svg) {
            PV.init();
        }

        PV.svg.selectAll('*').remove();

        const sectionWidth = PV.width / 3;
        const sectionHeight = PV.height - 100;

        const sections = [
            { x: 0, title: 'Completed', color: '#4CAF50', courses: pathway.completed },
            { x: sectionWidth, title: 'Available', color: '#00A9E0', courses: pathway.available },
            { x: sectionWidth * 2, title: 'Locked', color: '#999', courses: pathway.locked }
        ];

        sections.forEach((section, index) => {
            // Section background
            PV.svg.append('rect')
                .attr('x', section.x + 10)
                .attr('y', 50)
                .attr('width', sectionWidth - 20)
                .attr('height', sectionHeight)
                .attr('fill', '#f5f7fa')
                .attr('stroke', section.color)
                .attr('stroke-width', 2)
                .attr('rx', 10);

            // Section title
            PV.svg.append('text')
                .attr('x', section.x + sectionWidth / 2)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .attr('fill', section.color)
                .attr('font-size', '18px')
                .attr('font-weight', 'bold')
                .text(`${section.title} (${section.courses.length})`);

            // Normalize course data format
            const courseData = index === 0
                ? section.courses.map(code => {
                    const course = StateGetters.getCourses().find(c => c.code === code);
                    return { code, name: course?.name || code };
                })
                : section.courses;

            courseData.forEach((course, i) => {
                const y = 80 + (i * 60);
                if (y > sectionHeight) return;

                const cardGroup = PV.svg.append('g')
                    .style('cursor', 'pointer')
                    .on('click', () => {
                        if (course.code) {
                            PV._openCourseModal(course.code);
                        }
                    })
                    .on('mouseenter', function() {
                        d3.select(this).select('rect').attr('stroke-width', 2);
                    })
                    .on('mouseleave', function() {
                        d3.select(this).select('rect').attr('stroke-width', 1);
                    });

                cardGroup.append('rect')
                    .attr('x', section.x + 20)
                    .attr('y', y)
                    .attr('width', sectionWidth - 40)
                    .attr('height', 50)
                    .attr('fill', 'white')
                    .attr('stroke', section.color)
                    .attr('stroke-width', 1)
                    .attr('rx', 6);

                cardGroup.append('text')
                    .attr('x', section.x + 30)
                    .attr('y', y + 20)
                    .attr('fill', '#003C5F')
                    .attr('font-size', '13px')
                    .attr('font-weight', 'bold')
                    .text(course.code);

                cardGroup.append('text')
                    .attr('x', section.x + 30)
                    .attr('y', y + 38)
                    .attr('fill', '#666')
                    .attr('font-size', '11px')
                    .text(() => {
                        const name = course.name || '';
                        return name.length > 25 ? name.substring(0, 25) + '...' : name;
                    });
            });
        });
    }
};

// Export module
window.PrerequisiteVisualization = PrerequisiteVisualization;
