/**
 * Skill Pack Course Overlap Checker
 *
 * Pre-proposal tool for faculty to test a set of courses against all existing
 * skill packs before formally submitting a new skill pack proposal.
 *
 * Shows:
 *   - Per-course: how many existing skill packs already include that course
 *   - Per-existing-skill-pack: how much it overlaps with the selected course set
 *     (exact match, partial, or none)
 */

const SkillPackOverlapChecker = {
    // Selected course codes for the working set
    selectedCodes: [],

    // Cached skill pack data (loaded from SkillPacksModule)
    skillPacks: [],

    // Whether the checker panel is expanded
    expanded: false,

    /**
     * Normalize a course code for comparison.
     * Removes whitespace and uppercases so "ANM - 175" === "ANM-175".
     */
    normalizeCode: (code) => {
        if (!code) return '';
        return code.replace(/\s+/g, '').toUpperCase();
    },

    /**
     * Initialize the checker. Called when the skill pack proposals page opens.
     */
    init: () => {
        // Load skill packs from the already-loaded module if available
        if (typeof SkillPacksModule !== 'undefined' && SkillPacksModule.skillPacks.length > 0) {
            SkillPackOverlapChecker.skillPacks = SkillPacksModule.skillPacks;
        } else {
            // Fetch directly if SkillPacksModule hasn't loaded yet
            fetch('data/skill_packs.json')
                .then(r => r.json())
                .then(data => {
                    SkillPackOverlapChecker.skillPacks = data.skillPacks || [];
                })
                .catch(err => console.warn('SkillPackOverlapChecker: could not load skill_packs.json', err));
        }

        SkillPackOverlapChecker.selectedCodes = [];
        SkillPackOverlapChecker.renderCourseInput();
        SkillPackOverlapChecker.renderSelectedCourses();
        SkillPackOverlapChecker.clearResults();
    },

    /**
     * Toggle the collapsible checker panel open/closed.
     */
    toggle: () => {
        SkillPackOverlapChecker.expanded = !SkillPackOverlapChecker.expanded;
        const body = document.getElementById('spOverlapCheckerBody');
        const icon = document.getElementById('spOverlapCheckerToggleIcon');
        if (!body) return;
        if (SkillPackOverlapChecker.expanded) {
            body.classList.remove('hidden');
            if (icon) icon.textContent = '▲';
            SkillPackOverlapChecker.init();
        } else {
            body.classList.add('hidden');
            if (icon) icon.textContent = '▼';
        }
    },

    /**
     * Populate the course autocomplete datalist from state courses.
     */
    renderCourseInput: () => {
        const datalist = document.getElementById('spOverlapCourseOptions');
        if (!datalist) return;

        const courses = StateGetters.getCourses();
        datalist.innerHTML = '';
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.code;
            opt.label = `${c.code} — ${c.name}`;
            datalist.appendChild(opt);
        });
    },

    /**
     * Add the course currently typed/selected in the input to the working set.
     */
    addCourseFromInput: () => {
        const input = document.getElementById('spOverlapCourseInput');
        if (!input) return;
        const raw = input.value.trim();
        if (!raw) return;
        SkillPackOverlapChecker.addCourse(raw);
        input.value = '';
    },

    /**
     * Add a course code to the selected set (deduplicated).
     */
    addCourse: (code) => {
        const normalized = SkillPackOverlapChecker.normalizeCode(code);
        if (!normalized) return;

        // Check if already present (case-insensitive)
        const alreadyIn = SkillPackOverlapChecker.selectedCodes.some(
            c => SkillPackOverlapChecker.normalizeCode(c) === normalized
        );
        if (alreadyIn) return;

        // Try to find the canonical code from state
        const courses = StateGetters.getCourses();
        const match = courses.find(
            c => SkillPackOverlapChecker.normalizeCode(c.code) === normalized
        );

        // Accept the input code even if not in courses.json (could be a new/proposed course)
        SkillPackOverlapChecker.selectedCodes.push(match ? match.code : code.toUpperCase());
        SkillPackOverlapChecker.renderSelectedCourses();
        SkillPackOverlapChecker.clearResults();
    },

    /**
     * Remove a course code from the selected set.
     */
    removeCourse: (code) => {
        const normalized = SkillPackOverlapChecker.normalizeCode(code);
        SkillPackOverlapChecker.selectedCodes = SkillPackOverlapChecker.selectedCodes.filter(
            c => SkillPackOverlapChecker.normalizeCode(c) !== normalized
        );
        SkillPackOverlapChecker.renderSelectedCourses();
        SkillPackOverlapChecker.clearResults();
    },

    /**
     * Re-render the list of selected course chips.
     */
    renderSelectedCourses: () => {
        const container = document.getElementById('spOverlapSelectedCourses');
        if (!container) return;

        if (SkillPackOverlapChecker.selectedCodes.length === 0) {
            container.innerHTML = '<span class="sp-overlap-empty-hint">No courses added yet.</span>';
            return;
        }

        const courses = StateGetters.getCourses();
        container.innerHTML = SkillPackOverlapChecker.selectedCodes.map(code => {
            const course = courses.find(
                c => SkillPackOverlapChecker.normalizeCode(c.code) === SkillPackOverlapChecker.normalizeCode(code)
            );
            const label = course ? `${code} — ${course.name}` : code;
            return `
                <span class="sp-overlap-chip" title="${label}">
                    <span class="sp-overlap-chip-code">${code}</span>
                    <button class="sp-overlap-chip-remove"
                            onclick="SkillPackOverlapChecker.removeCourse('${code}')"
                            title="Remove ${code}">×</button>
                </span>
            `;
        }).join('');

        // Update check button state
        const checkBtn = document.getElementById('spOverlapCheckBtn');
        if (checkBtn) {
            checkBtn.disabled = SkillPackOverlapChecker.selectedCodes.length === 0;
        }
    },

    /**
     * Clear any previous results from the results panel.
     */
    clearResults: () => {
        const panel = document.getElementById('spOverlapResults');
        if (panel) panel.innerHTML = '';
    },

    /**
     * Run the overlap analysis and render results.
     */
    checkOverlap: () => {
        // Ensure skill packs are loaded
        if (SkillPackOverlapChecker.skillPacks.length === 0 &&
            typeof SkillPacksModule !== 'undefined') {
            SkillPackOverlapChecker.skillPacks = SkillPacksModule.skillPacks;
        }

        const selected = SkillPackOverlapChecker.selectedCodes;
        if (selected.length === 0) return;

        const panel = document.getElementById('spOverlapResults');
        if (!panel) return;

        const skillPacks = SkillPackOverlapChecker.skillPacks;
        const norm = SkillPackOverlapChecker.normalizeCode;
        const courses = StateGetters.getCourses();

        // --- Per-course membership ---
        // For each selected code, find which skill packs contain it.
        const courseMembership = selected.map(code => {
            const matchingSPs = skillPacks.filter(sp =>
                (sp.courses || []).some(c => norm(c.courseCode) === norm(code))
            );
            const courseObj = courses.find(c => norm(c.code) === norm(code));
            return { code, name: courseObj ? courseObj.name : null, matchingSPs };
        });

        // --- Per-skillpack overlap ---
        // For each existing skill pack, how many of the selected courses does it share?
        const selectedNorms = selected.map(norm);

        const spOverlap = skillPacks.map(sp => {
            const spCodes = (sp.courses || []).map(c => norm(c.courseCode));
            const sharedNorms = selectedNorms.filter(nc => spCodes.includes(nc));
            // Reverse: selected codes that are in this SP
            const sharedSelected = selected.filter(c => spCodes.includes(norm(c)));
            return {
                sp,
                sharedCount: sharedNorms.length,
                sharedCodes: sharedSelected,
                totalSelected: selected.length,
                totalSPCourses: spCodes.length,
                isExact: sharedNorms.length === selected.length &&
                         spCodes.length === selected.length,
                isSuperSet: sharedNorms.length === selected.length &&
                            spCodes.length >= selected.length,
                isPartial: sharedNorms.length > 0 && sharedNorms.length < selected.length
            };
        }).filter(o => o.sharedCount > 0)
          .sort((a, b) => b.sharedCount - a.sharedCount);

        panel.innerHTML = SkillPackOverlapChecker.renderResultsHTML(courseMembership, spOverlap, selected);
    },

    /**
     * Build the HTML string for the results panel.
     */
    renderResultsHTML: (courseMembership, spOverlap, selected) => {
        // Section 1: Per-course membership
        const courseSectionRows = courseMembership.map(({ code, name, matchingSPs }) => {
            const count = matchingSPs.length;
            const badgeClass = count === 0 ? 'sp-overlap-badge-none'
                             : count === 1 ? 'sp-overlap-badge-one'
                             : 'sp-overlap-badge-many';
            const badgeLabel = count === 0 ? 'Not in any skill pack'
                             : `In ${count} skill pack${count > 1 ? 's' : ''}`;

            const spListHTML = count === 0
                ? '<span class="sp-overlap-sp-none">No existing skill packs use this course.</span>'
                : matchingSPs.map(sp =>
                    `<span class="sp-overlap-sp-name">${sp.skillPackTitle}</span>
                     <span class="sp-overlap-sp-program">${sp.programName}</span>`
                  ).join('');

            return `
                <div class="sp-overlap-course-row">
                    <div class="sp-overlap-course-info">
                        <span class="sp-overlap-course-code">${code}</span>
                        ${name ? `<span class="sp-overlap-course-name">${name}</span>` : ''}
                    </div>
                    <span class="sp-overlap-badge ${badgeClass}">${badgeLabel}</span>
                    <div class="sp-overlap-sp-list">
                        ${spListHTML}
                    </div>
                </div>
            `;
        }).join('');

        // Section 2: Skillpack overlap table
        let spTableHTML = '';
        if (spOverlap.length === 0) {
            spTableHTML = `
                <div class="sp-overlap-no-match">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--champlain-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p>No existing skill packs share any of these courses. Your proposed skill pack is uniquely composed.</p>
                </div>
            `;
        } else {
            const rows = spOverlap.map(({ sp, sharedCount, sharedCodes, totalSelected, totalSPCourses, isExact, isSuperSet, isPartial }) => {
                let overlapLabel, overlapClass;
                if (isExact) {
                    overlapLabel = 'Exact match';
                    overlapClass = 'sp-overlap-exact';
                } else if (isSuperSet) {
                    overlapLabel = `All ${totalSelected} selected courses included`;
                    overlapClass = 'sp-overlap-superset';
                } else {
                    overlapLabel = `${sharedCount} of ${totalSelected} courses match`;
                    overlapClass = 'sp-overlap-partial';
                }

                const sharedList = sharedCodes.join(', ');

                return `
                    <tr class="sp-overlap-sp-row ${overlapClass}">
                        <td class="sp-overlap-sp-col-title">
                            <strong>${sp.skillPackTitle}</strong>
                            <div class="sp-overlap-sp-meta">${sp.programName} &middot; ${sp.interestCategory}</div>
                        </td>
                        <td class="sp-overlap-sp-col-type">${sp.skillPackType || '—'}</td>
                        <td class="sp-overlap-sp-col-overlap">
                            <span class="sp-overlap-match-label ${overlapClass}">${overlapLabel}</span>
                        </td>
                        <td class="sp-overlap-sp-col-shared">
                            <span class="sp-overlap-shared-codes">${sharedList}</span>
                        </td>
                    </tr>
                `;
            }).join('');

            spTableHTML = `
                <div class="sp-overlap-table-wrapper">
                    <table class="sp-overlap-table">
                        <thead>
                            <tr>
                                <th>Existing Skill Pack</th>
                                <th>Type</th>
                                <th>Overlap</th>
                                <th>Shared Courses</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        const totalUnique = courseMembership.filter(c => c.matchingSPs.length === 0).length;
        const uniqueNote = totalUnique === selected.length
            ? 'All selected courses are unique to your proposed skill pack.'
            : totalUnique > 0
                ? `${totalUnique} of ${selected.length} courses are not in any existing skill pack.`
                : 'All selected courses appear in at least one existing skill pack.';

        return `
            <div class="sp-overlap-results-inner">
                <div class="sp-overlap-summary-banner">
                    <span class="sp-overlap-summary-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                    </span>
                    <span>${uniqueNote}</span>
                </div>

                <h4 class="sp-overlap-section-title">Course Membership in Existing Skill Packs</h4>
                <div class="sp-overlap-course-list">
                    ${courseSectionRows}
                </div>

                <h4 class="sp-overlap-section-title sp-overlap-section-title--spaced">
                    Existing Skill Packs with Overlapping Courses
                    ${spOverlap.length > 0 ? `<span class="sp-overlap-count-badge">${spOverlap.length}</span>` : ''}
                </h4>
                ${spTableHTML}
            </div>
        `;
    }
};

window.SkillPackOverlapChecker = SkillPackOverlapChecker;
