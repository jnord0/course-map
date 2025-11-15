// Competency Graphs Module - Bar, Pie, and Radar Charts

const GraphsModule = {
    currentGraphType: 'bar',
    colors: ['#003C5F', '#236192', '#00A9E0', '#3DC4B2', '#74AA50', '#8BC34A', '#FFC107', '#FF9800', '#FF5722', '#E91E63'],

    /**
     * Initialize the graphs module
     */
    init: () => {
        GraphsModule.setupGraphTypeToggle();
        GraphsModule.renderCurrentGraph();
    },

    /**
     * Setup graph type toggle buttons
     */
    setupGraphTypeToggle: () => {
        const buttons = document.querySelectorAll('.graph-type-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const graphType = btn.getAttribute('data-graph');
                GraphsModule.switchGraphType(graphType);
            });
        });
    },

    /**
     * Switch between graph types
     */
    switchGraphType: (graphType) => {
        // Update button states
        document.querySelectorAll('.graph-type-btn').forEach(btn => {
            if (btn.getAttribute('data-graph') === graphType) {
                btn.classList.add('active');
                btn.style.background = 'var(--champlain-bright-blue)';
                btn.style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'white';
                btn.style.color = 'var(--champlain-navy)';
            }
        });

        // Hide all chart containers
        document.querySelectorAll('.graph-chart-container').forEach(container => {
            container.classList.add('hidden');
        });

        // Show selected chart container
        const containers = {
            'bar': 'barChartContainer',
            'pie': 'pieChartContainer',
            'radar': 'radarChartContainer'
        };
        document.getElementById(containers[graphType]).classList.remove('hidden');

        GraphsModule.currentGraphType = graphType;
        GraphsModule.renderCurrentGraph();
    },

    /**
     * Render the current graph based on selected type
     */
    renderCurrentGraph: () => {
        const selectedCourses = StateGetters.getSelectedCourses();
        const allCompetencies = StateGetters.getCompetencies();

        // Update course summary
        GraphsModule.updateCourseSummary(selectedCourses);

        // Calculate competency weights
        const competencyData = GraphsModule.calculateCompetencyWeights(selectedCourses, allCompetencies);

        // Render appropriate chart
        switch (GraphsModule.currentGraphType) {
            case 'bar':
                GraphsModule.renderBarChart(competencyData);
                break;
            case 'pie':
                GraphsModule.renderPieChart(competencyData);
                break;
            case 'radar':
                GraphsModule.renderRadarChart(competencyData);
                break;
        }
    },

    /**
     * Update course summary section
     */
    updateCourseSummary: (courses) => {
        const summaryDiv = document.querySelector('#graphsCourseSummary > div:first-child');
        summaryDiv.textContent = `Selected Courses (${courses.length})`;

        const listDiv = document.getElementById('graphsCourseList');
        if (courses.length === 0) {
            listDiv.innerHTML = '<div style="color: #666; font-style: italic;">No courses selected. Use the search above to select courses.</div>';
        } else {
            listDiv.innerHTML = courses.map(course =>
                `<div style="background: white; padding: 6px 12px; border-radius: 4px; border-left: 3px solid var(--champlain-bright-blue);">
                    <strong>${course.code}</strong> - ${course.name}
                </div>`
            ).join('');
        }
    },

    /**
     * Calculate total and average competency weights from selected courses
     */
    calculateCompetencyWeights: (courses, competencies) => {
        const weightData = {};

        // Initialize all competencies
        competencies.forEach(comp => {
            weightData[comp.id] = {
                id: comp.id,
                name: comp.name,
                color: comp.color || GraphsModule.colors[Object.keys(weightData).length % GraphsModule.colors.length],
                totalWeight: 0,
                averageWeight: 0,
                maxWeight: 0,
                courseCount: 0
            };
        });

        // Sum up weights from all selected courses
        courses.forEach(course => {
            if (course.competencies) {
                Object.entries(course.competencies).forEach(([compId, weight]) => {
                    if (weightData[compId] && weight > 0) {
                        weightData[compId].totalWeight += weight;
                        weightData[compId].maxWeight = Math.max(weightData[compId].maxWeight, weight);
                        weightData[compId].courseCount++;
                    }
                });
            }
        });

        // Calculate averages
        Object.values(weightData).forEach(comp => {
            if (comp.courseCount > 0) {
                comp.averageWeight = comp.totalWeight / comp.courseCount;
            }
        });

        return Object.values(weightData);
    },

    /**
     * Render Bar Chart
     */
    renderBarChart: (data) => {
        const svg = d3.select('#barChart');
        svg.selectAll('*').remove();

        const margin = { top: 40, right: 40, bottom: 120, left: 80 };
        const width = 900 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Sort data by total weight descending
        const sortedData = data.sort((a, b) => b.totalWeight - a.totalWeight);

        // X scale
        const x = d3.scaleBand()
            .domain(sortedData.map(d => d.name))
            .range([0, width])
            .padding(0.2);

        // Y scale
        const maxWeight = d3.max(sortedData, d => d.totalWeight) || 10;
        const y = d3.scaleLinear()
            .domain([0, maxWeight])
            .nice()
            .range([height, 0]);

        // Add X axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#003C5F');

        // Add Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(10))
            .selectAll('text')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#003C5F');

        // Y axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Total Competency Weight');

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('padding', '10px 15px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');

        // Add bars
        g.selectAll('.bar')
            .data(sortedData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.name))
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d.color)
            .attr('rx', 4)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.7);

                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${d.name}</div>
                        <div>Total Weight: <strong>${d.totalWeight.toFixed(1)}</strong></div>
                        <div>Avg Weight: <strong>${d.averageWeight.toFixed(2)}</strong></div>
                        <div>Max Weight: <strong>${d.maxWeight}</strong></div>
                        <div>Courses: <strong>${d.courseCount}</strong></div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1);

                tooltip.style('visibility', 'hidden');
            })
            .transition()
            .duration(800)
            .attr('y', d => y(d.totalWeight))
            .attr('height', d => height - y(d.totalWeight));

        // Add value labels on bars
        g.selectAll('.label')
            .data(sortedData)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => x(d.name) + x.bandwidth() / 2)
            .attr('y', d => y(d.totalWeight) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .style('opacity', 0)
            .text(d => d.totalWeight > 0 ? d.totalWeight.toFixed(1) : '')
            .transition()
            .delay(800)
            .duration(400)
            .style('opacity', 1);

        // Add title
        svg.append('text')
            .attr('x', margin.left + width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Competency Weight Distribution');
    },

    /**
     * Render Pie Chart
     */
    renderPieChart: (data) => {
        const svg = d3.select('#pieChart');
        svg.selectAll('*').remove();

        const width = 900;
        const height = 600;
        const radius = Math.min(width, height) / 2 - 80;

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Filter out zero weights
        const filteredData = data.filter(d => d.totalWeight > 0);

        if (filteredData.length === 0) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('No competency data to display. Select courses to view distribution.');
            return;
        }

        // Pie generator
        const pie = d3.pie()
            .value(d => d.totalWeight)
            .sort((a, b) => b.totalWeight - a.totalWeight);

        // Arc generator
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const arcHover = d3.arc()
            .innerRadius(0)
            .outerRadius(radius + 10);

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('padding', '10px 15px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');

        // Draw pie slices
        const slices = g.selectAll('.arc')
            .data(pie(filteredData))
            .enter()
            .append('g')
            .attr('class', 'arc');

        slices.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer')
            .style('opacity', 0)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arcHover)
                    .style('opacity', 0.85);

                const percentage = ((d.data.totalWeight / d3.sum(filteredData, d => d.totalWeight)) * 100).toFixed(1);

                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${d.data.name}</div>
                        <div>Total Weight: <strong>${d.data.totalWeight.toFixed(1)}</strong></div>
                        <div>Percentage: <strong>${percentage}%</strong></div>
                        <div>Avg Weight: <strong>${d.data.averageWeight.toFixed(2)}</strong></div>
                        <div>Courses: <strong>${d.data.courseCount}</strong></div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc)
                    .style('opacity', 1);

                tooltip.style('visibility', 'hidden');
            })
            .transition()
            .duration(800)
            .style('opacity', 1)
            .attrTween('d', function(d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) {
                    return arc(interpolate(t));
                };
            });

        // Add labels
        slices.append('text')
            .attr('transform', d => {
                const pos = arc.centroid(d);
                return `translate(${pos})`;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
            .style('opacity', 0)
            .text(d => {
                const percentage = ((d.data.totalWeight / d3.sum(filteredData, d => d.totalWeight)) * 100);
                return percentage > 5 ? `${percentage.toFixed(0)}%` : '';
            })
            .transition()
            .delay(800)
            .duration(400)
            .style('opacity', 1);

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 200}, 50)`);

        const legendItems = legend.selectAll('.legend-item')
            .data(filteredData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('rx', 3)
            .attr('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .style('font-size', '12px')
            .style('fill', '#003C5F')
            .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name);

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Competency Weight Distribution');
    },

    /**
     * Render Radar Chart
     */
    renderRadarChart: (data) => {
        const svg = d3.select('#radarChart');
        svg.selectAll('*').remove();

        const width = 900;
        const height = 600;
        const margin = 100;
        const radius = Math.min(width, height) / 2 - margin;

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Filter and sort data
        const chartData = data.filter(d => d.totalWeight > 0 || d.courseCount === 0);
        const numAxes = chartData.length;

        if (numAxes === 0) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('No competency data to display. Select courses to view radar chart.');
            return;
        }

        // Calculate max value for scaling
        const maxValue = 3; // Max weight is always 3

        // Create angle scale
        const angleSlice = (Math.PI * 2) / numAxes;

        // Draw circular grid
        const levels = 3;
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;

            // Draw circle
            g.append('circle')
                .attr('r', levelRadius)
                .attr('fill', 'none')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);

            // Add level label
            g.append('text')
                .attr('x', 5)
                .attr('y', -levelRadius)
                .style('font-size', '10px')
                .style('fill', '#999')
                .text((maxValue / levels * level).toFixed(0));
        }

        // Draw axes
        chartData.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Draw axis line
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#ccc')
                .attr('stroke-width', 1);

            // Add axis label
            const labelRadius = radius + 40;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;

            g.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#003C5F')
                .text(d.name);
        });

        // Create tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graph-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('padding', '10px 15px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '10000')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');

        // Calculate points for average weight
        const avgPoints = chartData.map((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const value = d.averageWeight / maxValue;
            return {
                x: Math.cos(angle) * radius * value,
                y: Math.sin(angle) * radius * value,
                data: d
            };
        });

        // Draw average weight polygon
        const lineGenerator = d3.line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(d3.curveLinearClosed);

        g.append('path')
            .datum(avgPoints)
            .attr('d', lineGenerator)
            .attr('fill', 'rgba(0, 169, 224, 0.3)')
            .attr('stroke', '#00A9E0')
            .attr('stroke-width', 3)
            .style('opacity', 0)
            .transition()
            .duration(800)
            .style('opacity', 1);

        // Calculate points for max weight
        const maxPoints = chartData.map((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const value = d.maxWeight / maxValue;
            return {
                x: Math.cos(angle) * radius * value,
                y: Math.sin(angle) * radius * value,
                data: d
            };
        });

        // Draw max weight polygon
        g.append('path')
            .datum(maxPoints)
            .attr('d', lineGenerator)
            .attr('fill', 'rgba(116, 170, 80, 0.2)')
            .attr('stroke', '#74AA50')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .style('opacity', 0)
            .transition()
            .duration(800)
            .style('opacity', 1);

        // Add dots for average values
        g.selectAll('.avg-dot')
            .data(avgPoints)
            .enter()
            .append('circle')
            .attr('class', 'avg-dot')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', '#00A9E0')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8);

                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${d.data.name}</div>
                        <div>Avg Weight: <strong>${d.data.averageWeight.toFixed(2)}</strong></div>
                        <div>Max Weight: <strong>${d.data.maxWeight}</strong></div>
                        <div>Total: <strong>${d.data.totalWeight.toFixed(1)}</strong></div>
                        <div>Courses: <strong>${d.data.courseCount}</strong></div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 5);

                tooltip.style('visibility', 'hidden');
            })
            .transition()
            .delay(800)
            .duration(400)
            .attr('r', 5);

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(50, ${height - 80})`);

        legend.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 30)
            .attr('y2', 0)
            .attr('stroke', '#00A9E0')
            .attr('stroke-width', 3);

        legend.append('text')
            .attr('x', 40)
            .attr('y', 5)
            .style('font-size', '13px')
            .style('fill', '#003C5F')
            .text('Average Weight');

        legend.append('line')
            .attr('x1', 0)
            .attr('y1', 25)
            .attr('x2', 30)
            .attr('y2', 25)
            .attr('stroke', '#74AA50')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');

        legend.append('text')
            .attr('x', 40)
            .attr('y', 30)
            .style('font-size', '13px')
            .style('fill', '#003C5F')
            .text('Maximum Weight');

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Competency Coverage Radar');
    }
};
