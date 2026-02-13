/**
 * Skill Packs Discovery Module
 * Handles loading and displaying skill packs by interest category
 * Features: Browser, Search, Filters, Quick-Add, Progress Tracking
 */

const SkillPacksModule = {
    skillPacks: [],
    selectedCategory: null,
    currentFilter: 'all',
    searchQuery: '',
    selectedProgram: 'all',

    // Category icons (SVG paths)
    categoryIcons: {
        'Art, Media & Design': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
        'Business, Management & Marketing': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
        'Computer Science & Systems': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        'Cybersecurity & Forensics': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        'Game Studio': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>',
        'Human Systems': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'Math & Data': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        'Psychology & Criminology': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'Systems & Policy': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    },

    /**
     * Initialize the skill packs module
     */
    init: async () => {
        console.log('SkillPacksModule: Starting initialization...');

        // Check if required DOM elements exist (landing page)
        const categoriesContainer = document.getElementById('interestCategories');
        if (!categoriesContainer) {
            console.log('SkillPacksModule: Categories container not found, skipping landing page init');
            return;
        }

        try {
            await SkillPacksModule.loadSkillPacks();
            console.log('SkillPacksModule: Loaded', SkillPacksModule.skillPacks.length, 'skill packs');
            SkillPacksModule.renderCategories();
            SkillPacksModule.renderSearchAndFilters();
            SkillPacksModule.setupEventListeners();
            SkillPacksModule.renderSkillPacks();
            console.log('SkillPacksModule: Initialization complete');
        } catch (error) {
            console.error('SkillPacksModule: Failed to initialize:', error);
        }
    },

    /**
     * Initialize for the standalone skill packs page
     */
    initStandalonePage: async () => {
        if (SkillPacksModule.skillPacks.length === 0) {
            await SkillPacksModule.loadSkillPacks();
        }

        const categoriesContainer = document.getElementById('spPageCategories');
        if (!categoriesContainer) return;

        // Render categories
        const categories = SkillPacksModule.getCategories();
        categoriesContainer.innerHTML = categories.map(cat => `
            <button class="interest-btn" data-category="${cat.name}">
                ${SkillPacksModule.categoryIcons[cat.name] || ''}
                <span>${cat.name}</span>
                <span class="count">${cat.count}</span>
            </button>
        `).join('');

        // Add search and filters
        const header = document.querySelector('#spPageContainer .skill-packs-header');
        if (header && !document.getElementById('spPageSearch')) {
            const searchHTML = `
                <div class="skill-packs-search-row">
                    <div class="skill-packs-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input type="text" id="spPageSearch" placeholder="Search skill packs...">
                    </div>
                    <select id="spPageProgramFilter" class="program-filter">
                        <option value="all">All Programs</option>
                        ${SkillPacksModule.getPrograms().map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                </div>
            `;
            header.insertAdjacentHTML('afterbegin', searchHTML);
        }

        // Render initial grid
        SkillPacksModule._renderStandaloneGrid();

        // Setup event listeners for standalone page
        categoriesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.interest-btn');
            if (!btn) return;
            const category = btn.dataset.category;

            // Toggle category
            if (SkillPacksModule.selectedCategory === category) {
                SkillPacksModule.selectedCategory = null;
            } else {
                SkillPacksModule.selectedCategory = category;
            }

            // Update active state
            categoriesContainer.querySelectorAll('.interest-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.category === SkillPacksModule.selectedCategory);
            });

            // Update title
            const title = document.getElementById('spPageCategoryTitle');
            if (title) {
                title.textContent = SkillPacksModule.selectedCategory || 'All Categories';
            }

            SkillPacksModule._renderStandaloneGrid();
        });

        // Filter chips
        const filtersContainer = document.querySelector('#spPageContainer .skill-packs-filters');
        if (filtersContainer) {
            filtersContainer.addEventListener('click', (e) => {
                const chip = e.target.closest('.filter-chip');
                if (!chip) return;
                SkillPacksModule.currentFilter = chip.dataset.filter;
                filtersContainer.querySelectorAll('.filter-chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.filter === SkillPacksModule.currentFilter);
                });
                SkillPacksModule._renderStandaloneGrid();
            });
        }

        // Search
        const searchInput = document.getElementById('spPageSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                SkillPacksModule.searchQuery = e.target.value.toLowerCase();
                SkillPacksModule._renderStandaloneGrid();
            });
        }

        // Program filter
        const programFilter = document.getElementById('spPageProgramFilter');
        if (programFilter) {
            programFilter.addEventListener('change', (e) => {
                SkillPacksModule.selectedProgram = e.target.value;
                SkillPacksModule._renderStandaloneGrid();
            });
        }
    },

    /**
     * Render skill packs grid on the standalone page
     */
    _renderStandaloneGrid: () => {
        const grid = document.getElementById('spPageGrid');
        if (!grid) return;

        const packs = SkillPacksModule.getFilteredPacks();

        if (packs.length === 0 && !SkillPacksModule.selectedCategory && !SkillPacksModule.searchQuery) {
            grid.innerHTML = `
                <div class="skill-packs-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champlain-gray)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <p>Choose an interest category above to see available skill packs</p>
                </div>
            `;
            return;
        }

        if (packs.length === 0) {
            grid.innerHTML = `
                <div class="skill-packs-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champlain-gray)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    <p>No skill packs match your search. Try different keywords or filters.</p>
                </div>
            `;
            return;
        }

        const packsWithIndex = packs.map(pack => ({
            pack,
            originalIndex: SkillPacksModule.skillPacks.indexOf(pack)
        }));

        grid.innerHTML = packsWithIndex.map(({ pack, originalIndex }) => {
            const progress = SkillPacksModule.getPackProgress(pack);
            const hasProgress = progress.completed > 0;

            return `
            <div class="skill-pack-card" data-pack-index="${originalIndex}">
                <span class="skill-pack-badge ${SkillPacksModule.getBadgeClass(pack.skillPackType)}">
                    ${SkillPacksModule.getBadgeText(pack.skillPackType)}
                </span>
                <div class="skill-pack-title">${pack.skillPackTitle}</div>
                <div class="skill-pack-program">${pack.programName}</div>
                <div class="skill-pack-description">${pack.description.substring(0, 150)}${pack.description.length > 150 ? '...' : ''}</div>
                <div class="skill-pack-courses">
                    <div class="skill-pack-courses-label">Courses (${pack.courses.length})</div>
                    <div class="skill-pack-course-list">
                        ${pack.courses.slice(0, 4).map(c => `
                            <span class="skill-pack-course">${c.courseCode.replace(/\s+/g, '')}</span>
                        `).join('')}
                        ${pack.courses.length > 4 ? `<span class="skill-pack-course more">+${pack.courses.length - 4} more</span>` : ''}
                    </div>
                </div>
                ${hasProgress ? `
                <div class="skill-pack-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                    <span class="progress-text">${progress.completed}/${progress.total} courses selected</span>
                </div>
                ` : ''}
                <div class="skill-pack-actions">
                    <button class="quick-add-btn" data-pack-index="${originalIndex}" title="Add all courses to selection">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Quick Add All
                    </button>
                </div>
            </div>
        `;
        }).join('');

        // Add click handlers for cards and quick-add buttons
        grid.addEventListener('click', (e) => {
            const quickAddBtn = e.target.closest('.quick-add-btn');
            if (quickAddBtn) {
                e.stopPropagation();
                const packIndex = parseInt(quickAddBtn.dataset.packIndex);
                SkillPacksModule.quickAddCourses(packIndex);
                SkillPacksModule._renderStandaloneGrid();
                return;
            }

            const card = e.target.closest('.skill-pack-card');
            if (card) {
                const packIndex = parseInt(card.dataset.packIndex);
                SkillPacksModule.openPackModal(packIndex);
            }
        });
    },

    /**
     * Initialize for main app (after login)
     */
    initMainApp: async () => {
        if (SkillPacksModule.skillPacks.length === 0) {
            await SkillPacksModule.loadSkillPacks();
        }
        SkillPacksModule.renderSkillPacksSidebar();
    },

    /**
     * Load skill packs data from JSON
     */
    loadSkillPacks: async () => {
        try {
            const response = await fetch('data/skill_packs.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            SkillPacksModule.skillPacks = data.skillPacks || data || [];

            if (Array.isArray(data)) {
                SkillPacksModule.skillPacks = data;
            }
        } catch (error) {
            console.error('SkillPacksModule: Failed to load skill packs:', error);
            SkillPacksModule.skillPacks = [];
        }
    },

    /**
     * Get unique categories with counts
     */
    getCategories: () => {
        const categoryCounts = {};
        SkillPacksModule.skillPacks.forEach(pack => {
            const cat = pack.interestCategory;
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        return Object.entries(categoryCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, count]) => ({ name, count }));
    },

    /**
     * Get unique programs
     */
    getPrograms: () => {
        const programs = new Set();
        SkillPacksModule.skillPacks.forEach(pack => {
            programs.add(pack.programName);
        });
        return Array.from(programs).sort();
    },

    /**
     * Render category buttons
     */
    renderCategories: () => {
        const container = document.getElementById('interestCategories');
        if (!container) return;

        const categories = SkillPacksModule.getCategories();

        container.innerHTML = categories.map(cat => `
            <button class="interest-btn" data-category="${cat.name}">
                ${SkillPacksModule.categoryIcons[cat.name] || ''}
                <span>${cat.name}</span>
                <span class="count">${cat.count}</span>
            </button>
        `).join('');
    },

    /**
     * Render search bar and program filter
     */
    renderSearchAndFilters: () => {
        const header = document.querySelector('.skill-packs-header');
        if (!header) return;

        // Check if search already exists
        if (document.getElementById('skillPackSearch')) return;

        const searchHTML = `
            <div class="skill-packs-search-row">
                <div class="skill-packs-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input type="text" id="skillPackSearch" placeholder="Search skill packs...">
                </div>
                <select id="programFilter" class="program-filter">
                    <option value="all">All Programs</option>
                    ${SkillPacksModule.getPrograms().map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
        `;

        header.insertAdjacentHTML('afterbegin', searchHTML);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: () => {
        // Category buttons
        const container = document.getElementById('interestCategories');
        if (container) {
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.interest-btn');
                if (btn) {
                    const category = btn.dataset.category;
                    SkillPacksModule.selectCategory(category);
                }
            });
        }

        // Filter chips
        const filtersContainer = document.querySelector('.skill-packs-filters');
        if (filtersContainer) {
            filtersContainer.addEventListener('click', (e) => {
                const chip = e.target.closest('.filter-chip');
                if (chip) {
                    const filter = chip.dataset.filter;
                    SkillPacksModule.setFilter(filter);
                }
            });
        }

        // Search input
        const searchInput = document.getElementById('skillPackSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                SkillPacksModule.searchQuery = e.target.value.toLowerCase();
                SkillPacksModule.renderSkillPacks();
            });
        }

        // Program filter
        const programFilter = document.getElementById('programFilter');
        if (programFilter) {
            programFilter.addEventListener('change', (e) => {
                SkillPacksModule.selectedProgram = e.target.value;
                SkillPacksModule.renderSkillPacks();
            });
        }

        // Skill pack grid clicks (for modal and quick-add)
        const grid = document.getElementById('skillPacksGrid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                // Quick-add button
                const quickAddBtn = e.target.closest('.quick-add-btn');
                if (quickAddBtn) {
                    e.stopPropagation();
                    const packIndex = parseInt(quickAddBtn.dataset.packIndex);
                    SkillPacksModule.quickAddCourses(packIndex);
                    return;
                }

                // Card click - open modal
                const card = e.target.closest('.skill-pack-card');
                if (card) {
                    const packIndex = parseInt(card.dataset.packIndex);
                    SkillPacksModule.openPackModal(packIndex);
                }
            });
        }
    },

    /**
     * Select a category
     */
    selectCategory: (category) => {
        // Toggle category if already selected
        if (SkillPacksModule.selectedCategory === category) {
            SkillPacksModule.selectedCategory = null;
        } else {
            SkillPacksModule.selectedCategory = category;
        }

        // Update active button
        document.querySelectorAll('.interest-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === SkillPacksModule.selectedCategory);
        });

        // Update title
        const title = document.getElementById('selectedCategoryTitle');
        if (title) {
            title.textContent = SkillPacksModule.selectedCategory || 'All Categories';
        }

        // Render packs
        SkillPacksModule.renderSkillPacks();
    },

    /**
     * Set filter
     */
    setFilter: (filter) => {
        SkillPacksModule.currentFilter = filter;

        // Update active chip
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });

        // Re-render packs
        SkillPacksModule.renderSkillPacks();
    },

    /**
     * Get filtered skill packs
     */
    getFilteredPacks: () => {
        let packs = SkillPacksModule.skillPacks;

        // Filter by category
        if (SkillPacksModule.selectedCategory) {
            packs = packs.filter(p => p.interestCategory === SkillPacksModule.selectedCategory);
        }

        // Filter by program
        if (SkillPacksModule.selectedProgram !== 'all') {
            packs = packs.filter(p => p.programName === SkillPacksModule.selectedProgram);
        }

        // Filter by type
        const filter = SkillPacksModule.currentFilter;
        if (filter === 'open') {
            packs = packs.filter(p =>
                p.skillPackType.includes('Open to All') ||
                p.skillPackType.includes('Open with Prerequisites')
            );
        } else if (filter === 'required') {
            packs = packs.filter(p => p.skillPackType.includes('Program Required'));
        }

        // Filter by search
        if (SkillPacksModule.searchQuery) {
            const query = SkillPacksModule.searchQuery;
            packs = packs.filter(p =>
                p.skillPackTitle.toLowerCase().includes(query) ||
                p.programName.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.courses.some(c => c.courseCode.toLowerCase().includes(query) || c.courseTitle.toLowerCase().includes(query))
            );
        }

        return packs;
    },

    /**
     * Get badge class based on skill pack type
     */
    getBadgeClass: (type) => {
        if (type.includes('Open to All')) return 'open';
        if (type.includes('Program Required')) return 'required';
        return 'choice';
    },

    /**
     * Get badge text
     */
    getBadgeText: (type) => {
        if (type.includes('Open to All')) return 'Open to All';
        if (type.includes('Open with Prerequisites')) return 'Open w/ Prerequisites';
        if (type.includes('Program Required')) return 'Program Required';
        if (type.includes('Program Choice')) return 'Program Elective';
        return type;
    },

    /**
     * Calculate completion progress for a skill pack
     * Matches by course code (e.g. "CSI-440") against selected courses
     */
    getPackProgress: (pack) => {
        if (typeof StateGetters === 'undefined') return { completed: 0, total: pack.courses.length, percent: 0 };

        const selectedCourses = StateGetters.getSelectedCourses ? StateGetters.getSelectedCourses() : [];
        const selectedCodes = selectedCourses.map(c => (c.code || '').replace(/\s+/g, '').toUpperCase());
        let completed = 0;

        pack.courses.forEach(course => {
            const code = course.courseCode.replace(/\s+/g, '').toUpperCase();
            if (selectedCodes.includes(code)) {
                completed++;
            }
        });

        return {
            completed,
            total: pack.courses.length,
            percent: Math.round((completed / pack.courses.length) * 100)
        };
    },

    /**
     * Render skill packs grid
     */
    renderSkillPacks: () => {
        const grid = document.getElementById('skillPacksGrid');
        if (!grid) return;

        const packs = SkillPacksModule.getFilteredPacks();

        if (packs.length === 0 && !SkillPacksModule.selectedCategory && !SkillPacksModule.searchQuery) {
            grid.innerHTML = `
                <div class="skill-packs-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champlain-gray)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <p>Choose an interest category above to see available skill packs</p>
                </div>
            `;
            return;
        }

        if (packs.length === 0) {
            grid.innerHTML = `
                <div class="skill-packs-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champlain-gray)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    <p>No skill packs match your search. Try different keywords or filters.</p>
                </div>
            `;
            return;
        }

        // Store packs with their original index for reference
        const packsWithIndex = packs.map(pack => {
            const originalIndex = SkillPacksModule.skillPacks.indexOf(pack);
            return { pack, originalIndex };
        });

        grid.innerHTML = packsWithIndex.map(({ pack, originalIndex }) => {
            const progress = SkillPacksModule.getPackProgress(pack);
            const hasProgress = progress.completed > 0;

            return `
            <div class="skill-pack-card" data-pack-index="${originalIndex}">
                <span class="skill-pack-badge ${SkillPacksModule.getBadgeClass(pack.skillPackType)}">
                    ${SkillPacksModule.getBadgeText(pack.skillPackType)}
                </span>
                <div class="skill-pack-title">${pack.skillPackTitle}</div>
                <div class="skill-pack-program">${pack.programName}</div>
                <div class="skill-pack-description">${pack.description.substring(0, 150)}${pack.description.length > 150 ? '...' : ''}</div>
                <div class="skill-pack-courses">
                    <div class="skill-pack-courses-label">Courses (${pack.courses.length})</div>
                    <div class="skill-pack-course-list">
                        ${pack.courses.slice(0, 4).map(c => `
                            <span class="skill-pack-course">${c.courseCode.replace(/\s+/g, '')}</span>
                        `).join('')}
                        ${pack.courses.length > 4 ? `<span class="skill-pack-course more">+${pack.courses.length - 4} more</span>` : ''}
                    </div>
                </div>
                ${hasProgress ? `
                <div class="skill-pack-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                    <span class="progress-text">${progress.completed}/${progress.total} courses selected</span>
                </div>
                ` : ''}
                <div class="skill-pack-actions">
                    <button class="quick-add-btn" data-pack-index="${originalIndex}" title="Add all courses to selection">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Quick Add All
                    </button>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Quick add all courses from a skill pack
     */
    quickAddCourses: (packIndex) => {
        const pack = SkillPacksModule.skillPacks[packIndex];
        if (!pack) return;

        // Check if we're in the main app (logged in)
        if (typeof StateGetters === 'undefined' || typeof CoursesModule === 'undefined') {
            // Show login prompt
            SkillPacksModule.showToast('Please sign in to add courses to your selection', 'info');
            // Scroll to login section
            document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const allCourses = StateGetters.getAllCourses ? StateGetters.getAllCourses() : [];
        const selectedCourses = StateGetters.getSelectedCourseIds ? StateGetters.getSelectedCourseIds() : [];
        let addedCount = 0;
        let notFoundCount = 0;

        pack.courses.forEach(course => {
            // Normalize the course code
            const packCode = course.courseCode.replace(/\s+/g, '').replace(/-/g, '-').toUpperCase();

            // Find matching course in the system
            const matchingCourse = allCourses.find(c => {
                const systemCode = `${c.courseData?.courseIdentity?.prefix || ''}-${c.courseData?.courseIdentity?.number || ''}`.toUpperCase();
                return systemCode === packCode;
            });

            if (matchingCourse) {
                const courseCode = `${matchingCourse.courseData.courseIdentity.prefix}-${matchingCourse.courseData.courseIdentity.number}`;
                if (!selectedCourses.includes(courseCode)) {
                    // Add to selection
                    if (typeof CoursesModule !== 'undefined' && CoursesModule.toggleCourseSelection) {
                        CoursesModule.toggleCourseSelection(courseCode);
                        addedCount++;
                    }
                }
            } else {
                notFoundCount++;
            }
        });

        // Show feedback
        if (addedCount > 0) {
            SkillPacksModule.showToast(`Added ${addedCount} course${addedCount > 1 ? 's' : ''} from "${pack.skillPackTitle}"`, 'success');
        } else if (notFoundCount === pack.courses.length) {
            SkillPacksModule.showToast(`Courses from this skill pack are not in the system yet`, 'warning');
        } else {
            SkillPacksModule.showToast(`All courses from this pack are already selected`, 'info');
        }

        // Update the display
        SkillPacksModule.renderSkillPacks();
    },

    /**
     * Show toast notification
     */
    showToast: (message, type = 'info') => {
        // Remove existing toast
        const existingToast = document.querySelector('.skill-pack-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `skill-pack-toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => toast.remove(), 4000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    },

    /**
     * Open skill pack detail modal
     */
    openPackModal: (packIndex) => {
        const pack = SkillPacksModule.skillPacks[packIndex];
        if (!pack) return;

        // Create modal if it doesn't exist
        let modal = document.getElementById('skillPackModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'skillPackModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        const courseListHtml = pack.courses.map(course => {
            const isSelected = SkillPacksModule.isCourseSelected(course.courseCode);
            const hasPrereqs = course.prerequisites && course.prerequisites !== 'None';
            return `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    border-radius: 20px;
                    background: ${isSelected ? '#e3f2fd' : '#f8f9fa'};
                    border: 2px solid ${isSelected ? 'var(--champlain-bright-blue)' : '#e8eaf0'};
                ">
                    <span style="font-size: 13px; font-weight: 600; color: var(--champlain-navy);">
                        ${course.courseCode} - ${course.courseTitle}
                    </span>
                    <span style="font-size: 12px; font-weight: 600; color: ${isSelected ? 'var(--champlain-bright-blue)' : hasPrereqs ? '#e65100' : '#74AA50'};">
                        ${isSelected ? 'Selected' : hasPrereqs ? 'Prereqs: ' + course.prerequisites : 'No prerequisites'}
                    </span>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Skill Pack Details</h2>
                    <button class="close-btn" id="closeSkillPackModal">&times;</button>
                </div>
                <div class="modal-body" id="skillPackDetailsBody" style="max-height: 70vh; overflow-y: auto;">
                    <!-- Breadcrumb Navigation -->
                    <nav style="margin-bottom: 16px; padding: 8px 12px; background: var(--bg-tertiary, #f8f9fa); border-radius: 8px; font-size: 13px;">
                        <span style="color: var(--text-secondary, #666);">Dashboard</span>
                        <span style="color: var(--text-tertiary, #999); margin: 0 8px;">›</span>
                        <span style="color: var(--text-secondary, #666);">Skill Packs</span>
                        <span style="color: var(--text-tertiary, #999); margin: 0 8px;">›</span>
                        <span style="color: var(--champlain-blue); font-weight: 600;">${pack.programCode}</span>
                    </nav>

                    <div style="margin-bottom: 24px;">
                        <div style="margin-bottom: 8px;">
                            <span class="skill-pack-badge ${SkillPacksModule.getBadgeClass(pack.skillPackType)}">
                                ${SkillPacksModule.getBadgeText(pack.skillPackType)}
                            </span>
                        </div>
                        <h3 style="color: var(--champlain-navy); margin-bottom: 4px; font-size: 26px; font-weight: bold;">
                            ${pack.skillPackTitle}
                        </h3>
                        <h4 style="color: #666; margin: 0; font-size: 18px; font-weight: 600;">
                            ${pack.programName}
                        </h4>
                    </div>

                    ${pack.description ? `
                        <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-left: 4px solid var(--champlain-navy); border-radius: 4px;">
                            <h4 style="color: var(--champlain-navy); margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                                Description
                            </h4>
                            <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0;">
                                ${pack.description}
                            </p>
                        </div>
                    ` : ''}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="padding: 12px; background: #e3f2fd; border-radius: 8px;">
                            <div style="font-size: 12px; color: #1565c0; font-weight: 600; margin-bottom: 4px;">PROGRAM CODE</div>
                            <div style="font-size: 16px; color: #0d47a1; font-weight: bold;">${pack.programCode}</div>
                        </div>
                        <div style="padding: 12px; background: #e8f5e9; border-radius: 8px;">
                            <div style="font-size: 12px; color: #2e7d32; font-weight: 600; margin-bottom: 4px;">TOTAL COURSES</div>
                            <div style="font-size: 20px; color: #1b5e20; font-weight: bold;">${pack.courses.length}</div>
                        </div>
                        <div style="padding: 12px; background: #fff3e0; border-radius: 8px;">
                            <div style="font-size: 12px; color: #e65100; font-weight: 600; margin-bottom: 4px;">CATEGORY</div>
                            <div style="font-size: 14px; color: #bf360c; font-weight: 600;">${pack.interestCategory}</div>
                        </div>
                        <div style="padding: 12px; background: #f3e5f5; border-radius: 8px;">
                            <div style="font-size: 12px; color: #7b1fa2; font-weight: 600; margin-bottom: 4px;">ACCESS TYPE</div>
                            <div style="font-size: 14px; color: #4a148c; font-weight: 600;">${pack.skillPackType}</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--champlain-navy); margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                            Courses in this Pack (${pack.courses.length})
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${courseListHtml}
                        </div>
                    </div>

                    <div style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin-top: 20px;">
                        <h4 style="color: var(--champlain-navy); margin-bottom: 12px; font-size: 14px;">
                            Quick Actions
                        </h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button
                                class="quick-add-modal-btn"
                                data-pack-index="${packIndex}"
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
                                + Add All Courses
                            </button>
                            <button
                                id="closeSkillPackModalBtn"
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // Event listeners
        modal.querySelector('#closeSkillPackModal').addEventListener('click', () => SkillPacksModule.closePackModal());
        modal.querySelector('#closeSkillPackModalBtn').addEventListener('click', () => SkillPacksModule.closePackModal());
        modal.querySelector('.quick-add-modal-btn').addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.packIndex);
            SkillPacksModule.quickAddCourses(idx);
            SkillPacksModule.openPackModal(idx); // Refresh modal
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) SkillPacksModule.closePackModal();
        });

        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                SkillPacksModule.closePackModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    /**
     * Close skill pack modal
     */
    closePackModal: () => {
        const modal = document.getElementById('skillPackModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Check if a course is selected by matching course codes
     */
    isCourseSelected: (courseCode) => {
        if (typeof StateGetters === 'undefined') return false;
        const selectedCourses = StateGetters.getSelectedCourses ? StateGetters.getSelectedCourses() : [];
        const normalizedCode = courseCode.replace(/\s+/g, '').toUpperCase();
        return selectedCourses.some(c => (c.code || '').replace(/\s+/g, '').toUpperCase() === normalizedCode);
    },

    /**
     * Render skill pack progress into the fixed sidebar container
     */
    renderSkillPacksSidebar: () => {
        const container = document.getElementById('skillPackProgressBody');
        if (!container) return;

        const suggestions = SkillPacksModule.getSuggestedPacks();

        if (suggestions.length === 0) {
            container.innerHTML = '<p class="no-suggestions">Select courses to see skill pack progress</p>';
            return;
        }

        container.innerHTML = `
            <div class="skill-packs-suggestions">
                ${suggestions.map(({ pack, progress }) => `
                    <div class="suggestion-card" data-pack-index="${SkillPacksModule.skillPacks.indexOf(pack)}" onclick="SkillPacksModule.openPackModal(${SkillPacksModule.skillPacks.indexOf(pack)})">
                        <div class="suggestion-title">${pack.skillPackTitle}</div>
                        <div class="suggestion-program">${pack.programName}</div>
                        <div class="suggestion-progress">
                            <div class="mini-progress-bar">
                                <div class="progress-fill" style="width: ${progress.percent}%"></div>
                            </div>
                            <span class="progress-label">${progress.completed}/${progress.total} courses</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Get all skill packs that contain at least one selected course
     */
    getSuggestedPacks: () => {
        if (typeof StateGetters === 'undefined') return [];

        const suggestions = [];

        SkillPacksModule.skillPacks.forEach(pack => {
            const progress = SkillPacksModule.getPackProgress(pack);
            if (progress.completed > 0) {
                suggestions.push({ pack, progress });
            }
        });

        // Sort by progress percentage (highest first), then by name
        suggestions.sort((a, b) => b.progress.percent - a.progress.percent || a.pack.skillPackTitle.localeCompare(b.pack.skillPackTitle));

        return suggestions;
    },

    /**
     * Update sidebar when courses change
     */
    updateSidebar: () => {
        SkillPacksModule.renderSkillPacksSidebar();
    }
};

// Make module available globally
window.SkillPacksModule = SkillPacksModule;
