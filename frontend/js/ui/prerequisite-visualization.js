// Prerequisite Chain Visualization Module
// Handles D3.js visualization of course prerequisite relationships

const PrerequisiteVisualization = {
    svg: null,
    width: 0,
    height: 0,
    currentMode: 'chain', // 'chain' or 'pathway'
    simulation: null,

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

        console.log('Prerequisite visualization initialized');
    },

    /**
     * Render prerequisite chain for selected courses
     * @param {Array<string>} selectedCourseCodes - Courses to visualize
     * @param {string} mode - 'chain' or 'pathway'
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

        console.log('Rendering prerequisite graph:', graphData);

        // Choose layout based on mode
        if (mode === 'chain') {
            PrerequisiteVisualization.renderHierarchicalLayout(graphData);
        } else {
            PrerequisiteVisualization.renderForceLayout(graphData);
        }
    },

    /**
     * Render empty state message
     * @param {string} message - Message to display
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
     * @param {Object} graphData - { nodes, links }
     */
    renderHierarchicalLayout: (graphData) => {
        PrerequisiteVisualization.svg.selectAll('*').remove();

        // Build hierarchy data structure
        const hierarchy = PrerequisiteVisualization.buildHierarchy(graphData);

        if (!hierarchy) {
            PrerequisiteVisualization.renderEmptyState('Unable to build hierarchy');
            return;
        }

        // Create tree layout
        const treeLayout = d3.tree()
            .size([PrerequisiteVisualization.width - 200, PrerequisiteVisualization.height - 200])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

        const root = d3.hierarchy(hierarchy);
        treeLayout(root);

        // Add group for zoom/pan
        const g = PrerequisiteVisualization.svg.append('g')
            .attr('transform', `translate(100, 100)`);

        // Draw links (prerequisite arrows)
        const links = g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'prereq-link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y))
            .attr('fill', 'none')
            .attr('stroke', '#003C5F')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrowhead)');

        // Add arrowhead marker
        PrerequisiteVisualization.svg.append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#003C5F');

        // Draw nodes (courses)
        const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'prereq-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                if (d.data.code) {
                    PrerequisitesModule.showCourseDetails(d.data.code);
                }
            });

        // Add circles for nodes
        nodes.append('circle')
            .attr('r', d => d.data.isFocus ? 30 : 20)
            .attr('fill', d => d.data.isFocus ? '#00A9E0' : '#236192')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Add course code labels
        nodes.append('text')
            .attr('dy', -30)
            .attr('text-anchor', 'middle')
            .attr('fill', '#003C5F')
            .attr('font-size', '13px')
            .attr('font-weight', 'bold')
            .text(d => d.data.code || d.data.name);

        // Add course name labels
        nodes.append('text')
            .attr('dy', 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#666')
            .attr('font-size', '11px')
            .text(d => {
                const name = d.data.name || '';
                return name.length > 30 ? name.substring(0, 30) + '...' : name;
            });

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        PrerequisiteVisualization.svg.call(zoom);
    },

    /**
     * Build hierarchy structure from graph data
     * @param {Object} graphData - { nodes, links }
     * @returns {Object} - Hierarchical data structure
     */
    buildHierarchy: (graphData) => {
        const { nodes, links } = graphData;

        // Find root nodes (nodes with no prerequisites)
        const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));
        const hasIncoming = new Set();

        links.forEach(link => {
            hasIncoming.add(link.target);
        });

        const rootNodes = nodes.filter(n => !hasIncoming.has(n.id));

        if (rootNodes.length === 0) {
            // No clear root, pick focus node or first node
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

        // If multiple roots, create virtual root
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
     * @param {Object} graphData - { nodes, links }
     */
    renderForceLayout: (graphData) => {
        PrerequisiteVisualization.svg.selectAll('*').remove();

        const { nodes, links } = graphData;

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(PrerequisiteVisualization.width / 2, PrerequisiteVisualization.height / 2))
            .force('collision', d3.forceCollide().radius(50));

        PrerequisiteVisualization.simulation = simulation;

        // Add group for zoom/pan
        const g = PrerequisiteVisualization.svg.append('g');

        // Add arrowhead marker
        PrerequisiteVisualization.svg.append('defs')
            .append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#003C5F');

        // Draw links
        const link = g.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'prereq-link')
            .attr('stroke', '#003C5F')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrow)');

        // Draw nodes
        const node = g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'prereq-node')
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', PrerequisiteVisualization.dragStarted)
                .on('drag', PrerequisiteVisualization.dragged)
                .on('end', PrerequisiteVisualization.dragEnded))
            .on('click', (event, d) => {
                PrerequisitesModule.showCourseDetails(d.code);
            });

        // Add circles
        node.append('circle')
            .attr('r', d => d.isFocus ? 30 : 20)
            .attr('fill', d => d.isFocus ? '#00A9E0' : '#236192')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Add course code labels
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -30)
            .attr('fill', '#003C5F')
            .attr('font-size', '13px')
            .attr('font-weight', 'bold')
            .text(d => d.code);

        // Add course name labels
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 40)
            .attr('fill', '#666')
            .attr('font-size', '10px')
            .text(d => {
                const name = d.name || '';
                return name.length > 25 ? name.substring(0, 25) + '...' : name;
            });

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        PrerequisiteVisualization.svg.call(zoom);
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
     * @param {Array<string>} completedCourses - Completed course codes
     */
    renderPathwayView: (completedCourses = []) => {
        const pathway = PrerequisitesModule.getStudentPathway(completedCourses);

        if (!PrerequisiteVisualization.svg) {
            PrerequisiteVisualization.init();
        }

        PrerequisiteVisualization.svg.selectAll('*').remove();

        // Create three sections: Completed, Available, Locked
        const sectionWidth = PrerequisiteVisualization.width / 3;
        const sectionHeight = PrerequisiteVisualization.height - 100;

        // Draw section backgrounds
        const sections = [
            { x: 0, title: 'Completed', color: '#4CAF50', courses: pathway.completed },
            { x: sectionWidth, title: 'Available', color: '#00A9E0', courses: pathway.available },
            { x: sectionWidth * 2, title: 'Locked', color: '#999', courses: pathway.locked }
        ];

        sections.forEach((section, index) => {
            // Section background
            PrerequisiteVisualization.svg.append('rect')
                .attr('x', section.x + 10)
                .attr('y', 50)
                .attr('width', sectionWidth - 20)
                .attr('height', sectionHeight)
                .attr('fill', '#f5f7fa')
                .attr('stroke', section.color)
                .attr('stroke-width', 2)
                .attr('rx', 10);

            // Section title
            PrerequisiteVisualization.svg.append('text')
                .attr('x', section.x + sectionWidth / 2)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .attr('fill', section.color)
                .attr('font-size', '18px')
                .attr('font-weight', 'bold')
                .text(`${section.title} (${section.courses.length})`);

            // Course cards
            const courseData = index === 0
                ? section.courses.map(code => {
                    const course = StateGetters.getCourses().find(c => c.code === code);
                    return { code, name: course?.name || code };
                })
                : section.courses;

            courseData.forEach((course, i) => {
                const y = 80 + (i * 60);

                if (y > sectionHeight) return; // Don't overflow

                // Course card background
                PrerequisiteVisualization.svg.append('rect')
                    .attr('x', section.x + 20)
                    .attr('y', y)
                    .attr('width', sectionWidth - 40)
                    .attr('height', 50)
                    .attr('fill', 'white')
                    .attr('stroke', section.color)
                    .attr('stroke-width', 1)
                    .attr('rx', 6)
                    .style('cursor', 'pointer')
                    .on('click', () => {
                        if (course.code) {
                            PrerequisitesModule.showCourseDetails(course.code);
                        }
                    });

                // Course code
                PrerequisiteVisualization.svg.append('text')
                    .attr('x', section.x + 30)
                    .attr('y', y + 20)
                    .attr('fill', '#003C5F')
                    .attr('font-size', '13px')
                    .attr('font-weight', 'bold')
                    .text(course.code);

                // Course name
                PrerequisiteVisualization.svg.append('text')
                    .attr('x', section.x + 30)
                    .attr('y', y + 38)
                    .attr('fill', '#666')
                    .attr('font-size', '11px')
                    .text((course.name || '').substring(0, 25) + '...');
            });
        });
    }
};

// Export module
window.PrerequisiteVisualization = PrerequisiteVisualization;
