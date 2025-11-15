// Competency Graphs Module - Bar, Pie, and Radar Charts

const GraphsModule = {
    currentGraphType: 'bar',
    colors: ['#003C5F', '#236192', '#00A9E0', '#3DC4B2', '#74AA50', '#8BC34A', '#FFC107', '#FF9800', '#FF5722', '#E91E63'],
    isPlaying: false,
    playInterval: null,
    currentPlayIndex: 0,

    /**
     * Initialize the graphs module
     */
    init: () => {
        GraphsModule.setupGraphTypeToggle();
        GraphsModule.setupPlayButton();
        GraphsModule.setupCourseHoverHighlighting();
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
            'radar': 'radarChartContainer',
            'timeline': 'timelineChartContainer'
        };
        document.getElementById(containers[graphType]).classList.remove('hidden');

        // Show/hide play button for timeline view
        const playBtn = document.getElementById('playProgressionBtn');
        if (graphType === 'timeline') {
            playBtn.classList.remove('hidden');
        } else {
            playBtn.classList.add('hidden');
        }

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
            case 'timeline':
                GraphsModule.renderTimelineChart(selectedCourses, allCompetencies);
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
            listDiv.innerHTML = courses.map((course, idx) => {
                const compIds = course.competencies ? Object.keys(course.competencies).filter(k => course.competencies[k] > 0).join(',') : '';
                return `<div class="graph-course-item" data-course-code="${course.code}" data-competencies="${compIds}" style="background: white; padding: 6px 12px; border-radius: 4px; border-left: 3px solid var(--champlain-bright-blue); cursor: pointer; transition: all 0.2s;">
                    <strong>${course.code}</strong> - ${course.name}
                </div>`;
            }).join('');
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
    },

    /**
     * Render Timeline Chart - Shows competency progression over courses
     */
    renderTimelineChart: (courses, competencies) => {
        const svg = d3.select('#timelineChart');
        svg.selectAll('*').remove();

        if (courses.length === 0) {
            svg.append('text')
                .attr('x', 450)
                .attr('y', 300)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('No courses selected. Select courses to view progression timeline.');
            return;
        }

        const width = 900;
        const height = 600;
        const margin = { top: 60, right: 120, bottom: 100, left: 80 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Order courses by prerequisites (simplified - by course number)
        const orderedCourses = [...courses].sort((a, b) => {
            const numA = parseInt(a.code.match(/\d+/)[0]);
            const numB = parseInt(b.code.match(/\d+/)[0]);
            return numA - numB;
        });

        // Calculate cumulative competency weights
        const progressionData = [];
        const cumulativeWeights = {};

        competencies.forEach(comp => {
            cumulativeWeights[comp.id] = 0;
        });

        orderedCourses.forEach((course, idx) => {
            const snapshot = { courseIndex: idx, courseName: course.code };

            // Add weights from this course
            if (course.competencies) {
                Object.entries(course.competencies).forEach(([compId, weight]) => {
                    if (weight > 0) {
                        cumulativeWeights[compId] = Math.max(cumulativeWeights[compId], weight);
                    }
                });
            }

            // Record snapshot
            competencies.forEach(comp => {
                progressionData.push({
                    courseIndex: idx,
                    courseName: course.code,
                    competency: comp.name,
                    competencyId: comp.id,
                    weight: cumulativeWeights[comp.id],
                    color: comp.color || GraphsModule.colors[competencies.indexOf(comp) % GraphsModule.colors.length]
                });
            });
        });

        // Create scales
        const x = d3.scaleLinear()
            .domain([0, orderedCourses.length - 1])
            .range([0, chartWidth]);

        const y = d3.scaleLinear()
            .domain([0, 3])
            .range([chartHeight, 0]);

        // Group data by competency
        const competencyGroups = d3.group(progressionData, d => d.competency);

        // Line generator
        const line = d3.line()
            .x(d => x(d.courseIndex))
            .y(d => y(d.weight))
            .curve(d3.curveMonotoneX);

        // Draw grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y)
                .ticks(3)
                .tickSize(-chartWidth)
                .tickFormat('')
            )
            .style('stroke', '#e0e0e0')
            .style('stroke-dasharray', '3,3');

        // Draw axes
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x)
                .ticks(orderedCourses.length)
                .tickFormat((d, i) => orderedCourses[i] ? orderedCourses[i].code : '')
            )
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', '#003C5F');

        g.append('g')
            .call(d3.axisLeft(y).ticks(3))
            .selectAll('text')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#003C5F');

        // Y axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -chartHeight / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Competency Level (Max)');

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
            .style('z-index', '10000');

        // Draw lines for each competency
        competencyGroups.forEach((values, competency) => {
            const compData = values.sort((a, b) => a.courseIndex - b.courseIndex);
            const color = compData[0].color;

            // Draw line with animation
            const path = g.append('path')
                .datum(compData)
                .attr('class', `timeline-line comp-${compData[0].competencyId}`)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 3)
                .attr('d', line)
                .style('opacity', 0.7);

            // Animate line drawing
            const totalLength = path.node().getTotalLength();
            path
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);

            // Draw dots
            g.selectAll(`.dot-${compData[0].competencyId}`)
                .data(compData)
                .enter()
                .append('circle')
                .attr('class', `timeline-dot comp-${compData[0].competencyId}`)
                .attr('cx', d => x(d.courseIndex))
                .attr('cy', d => y(d.weight))
                .attr('r', 0)
                .attr('fill', color)
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
                            <div style="font-weight: bold; margin-bottom: 5px;">${d.competency}</div>
                            <div>Course: <strong>${d.courseName}</strong></div>
                            <div>Level: <strong>${d.weight}</strong></div>
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
                        .attr('r', 4);

                    tooltip.style('visibility', 'hidden');
                })
                .transition()
                .delay((d, i) => i * 100 + 1500)
                .duration(300)
                .attr('r', 4);
        });

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 110}, 80)`);

        competencies.slice(0, 10).forEach((comp, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 22})`)
                .style('cursor', 'pointer')
                .on('mouseover', function() {
                    d3.selectAll('.timeline-line').style('opacity', 0.1);
                    d3.selectAll('.timeline-dot').style('opacity', 0.1);
                    d3.selectAll(`.comp-${comp.id}`).style('opacity', 1);
                })
                .on('mouseout', function() {
                    d3.selectAll('.timeline-line').style('opacity', 0.7);
                    d3.selectAll('.timeline-dot').style('opacity', 1);
                });

            legendItem.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 20)
                .attr('y2', 0)
                .attr('stroke', comp.color || GraphsModule.colors[i % GraphsModule.colors.length])
                .attr('stroke-width', 3);

            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 5)
                .style('font-size', '11px')
                .style('fill', '#003C5F')
                .text(comp.name.length > 12 ? comp.name.substring(0, 12) + '...' : comp.name);
        });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#003C5F')
            .text('Competency Progression Timeline');
    },

    /**
     * Setup hover highlighting for course items
     */
    setupCourseHoverHighlighting: () => {
        // Use event delegation since course list is dynamically generated
        document.getElementById('graphsCourseList').addEventListener('mouseover', (e) => {
            const courseItem = e.target.closest('.graph-course-item');
            if (!courseItem) return;

            const competencies = courseItem.dataset.competencies.split(',').filter(Boolean);

            // Highlight relevant elements based on current graph type
            if (GraphsModule.currentGraphType === 'bar') {
                d3.selectAll('#barChart .bar')
                    .transition()
                    .duration(200)
                    .attr('opacity', function() {
                        const compName = d3.select(this).datum().name;
                        const compId = StateGetters.getCompetencies().find(c => c.name === compName)?.id;
                        return competencies.includes(compId) ? 1 : 0.2;
                    });
            } else if (GraphsModule.currentGraphType === 'timeline') {
                d3.selectAll('.timeline-line')
                    .transition()
                    .duration(200)
                    .style('opacity', function() {
                        const classes = this.getAttribute('class');
                        return competencies.some(id => classes.includes(`comp-${id}`)) ? 1 : 0.1;
                    });
                d3.selectAll('.timeline-dot')
                    .transition()
                    .duration(200)
                    .style('opacity', function() {
                        const classes = this.getAttribute('class');
                        return competencies.some(id => classes.includes(`comp-${id}`)) ? 1 : 0.1;
                    });
            }

            // Highlight the course item itself
            courseItem.style.transform = 'translateX(5px)';
            courseItem.style.boxShadow = '0 2px 8px rgba(0, 169, 224, 0.3)';
        });

        document.getElementById('graphsCourseList').addEventListener('mouseout', (e) => {
            const courseItem = e.target.closest('.graph-course-item');
            if (!courseItem) return;

            // Reset highlighting
            if (GraphsModule.currentGraphType === 'bar') {
                d3.selectAll('#barChart .bar')
                    .transition()
                    .duration(200)
                    .attr('opacity', 1);
            } else if (GraphsModule.currentGraphType === 'timeline') {
                d3.selectAll('.timeline-line')
                    .transition()
                    .duration(200)
                    .style('opacity', 0.7);
                d3.selectAll('.timeline-dot')
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            }

            courseItem.style.transform = '';
            courseItem.style.boxShadow = '';
        });
    },

    /**
     * Setup play button for animated progression
     */
    setupPlayButton: () => {
        const playBtn = document.getElementById('playProgressionBtn');
        if (!playBtn) return;

        playBtn.addEventListener('click', () => {
            if (GraphsModule.isPlaying) {
                GraphsModule.stopProgression();
            } else {
                GraphsModule.startProgression();
            }
        });
    },

    /**
     * Start animated progression through courses
     */
    startProgression: () => {
        const selectedCourses = StateGetters.getSelectedCourses();
        if (selectedCourses.length === 0) return;

        // Order courses
        const orderedCourses = [...selectedCourses].sort((a, b) => {
            const numA = parseInt(a.code.match(/\d+/)[0]);
            const numB = parseInt(b.code.match(/\d+/)[0]);
            return numA - numB;
        });

        GraphsModule.isPlaying = true;
        GraphsModule.currentPlayIndex = 0;

        const playBtn = document.getElementById('playProgressionBtn');
        playBtn.textContent = '⏸️ Pause';
        playBtn.style.background = 'var(--champlain-navy)';

        // Highlight courses progressively
        GraphsModule.playInterval = setInterval(() => {
            if (GraphsModule.currentPlayIndex >= orderedCourses.length) {
                GraphsModule.stopProgression();
                return;
            }

            const courseItems = document.querySelectorAll('.graph-course-item');
            const currentCourse = orderedCourses[GraphsModule.currentPlayIndex];

            courseItems.forEach(item => {
                if (item.dataset.courseCode === currentCourse.code) {
                    item.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
                    item.style.borderLeft = '3px solid var(--champlain-green)';
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.style.background = 'white';
                    item.style.borderLeft = '3px solid var(--champlain-bright-blue)';
                }
            });

            GraphsModule.currentPlayIndex++;
        }, 1500);
    },

    /**
     * Stop animated progression
     */
    stopProgression: () => {
        GraphsModule.isPlaying = false;
        if (GraphsModule.playInterval) {
            clearInterval(GraphsModule.playInterval);
            GraphsModule.playInterval = null;
        }

        const playBtn = document.getElementById('playProgressionBtn');
        playBtn.textContent = '▶️ Play Progression';
        playBtn.style.background = 'var(--champlain-green)';

        // Reset all course items
        document.querySelectorAll('.graph-course-item').forEach(item => {
            item.style.background = 'white';
            item.style.borderLeft = '3px solid var(--champlain-bright-blue)';
        });
    }
};
