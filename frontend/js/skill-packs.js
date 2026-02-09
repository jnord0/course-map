/**
 * Skill Packs Discovery Module
 * Handles loading and displaying skill packs by interest category
 */

const SkillPacksModule = {
    skillPacks: [],
    selectedCategory: null,
    currentFilter: 'all',

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
        try {
            await SkillPacksModule.loadSkillPacks();
            SkillPacksModule.renderCategories();
            SkillPacksModule.setupEventListeners();
            console.log('Skill Packs Module initialized');
        } catch (error) {
            console.error('Failed to initialize Skill Packs Module:', error);
        }
    },

    /**
     * Load skill packs data from JSON
     */
    loadSkillPacks: async () => {
        try {
            const response = await fetch('data/skill_packs.json');
            const data = await response.json();
            SkillPacksModule.skillPacks = data.skillPacks || [];
        } catch (error) {
            console.error('Failed to load skill packs:', error);
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
    },

    /**
     * Select a category
     */
    selectCategory: (category) => {
        SkillPacksModule.selectedCategory = category;

        // Update active button
        document.querySelectorAll('.interest-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Update title
        const title = document.getElementById('selectedCategoryTitle');
        if (title) {
            title.textContent = category;
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
     * Render skill packs grid
     */
    renderSkillPacks: () => {
        const grid = document.getElementById('skillPacksGrid');
        if (!grid) return;

        const packs = SkillPacksModule.getFilteredPacks();

        if (!SkillPacksModule.selectedCategory) {
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
                    <p>No skill packs match the current filter. Try selecting "All Packs".</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = packs.map(pack => `
            <div class="skill-pack-card">
                <span class="skill-pack-badge ${SkillPacksModule.getBadgeClass(pack.skillPackType)}">
                    ${SkillPacksModule.getBadgeText(pack.skillPackType)}
                </span>
                <div class="skill-pack-title">${pack.skillPackTitle}</div>
                <div class="skill-pack-program">${pack.programName}</div>
                <div class="skill-pack-description">${pack.description}</div>
                <div class="skill-pack-courses">
                    <div class="skill-pack-courses-label">Courses (${pack.courses.length})</div>
                    <div class="skill-pack-course-list">
                        ${pack.courses.slice(0, 4).map(c => `
                            <span class="skill-pack-course">${c.courseCode}</span>
                        `).join('')}
                        ${pack.courses.length > 4 ? `<span class="skill-pack-course">+${pack.courses.length - 4} more</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// Make module available globally
window.SkillPacksModule = SkillPacksModule;
