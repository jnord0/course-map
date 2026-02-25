// State Management - Central application state with data adapter

// Data Adapter for backward compatibility and new format support
const DataAdapter = {
    /**
     * Normalize course data to work with existing visualization code
     * Handles both legacy format and new courseData structure
     */
    normalizeCourse: (courseInput) => {
        // Check if it's already in legacy format
        if (courseInput.code && courseInput.name && !courseInput.courseData) {
            console.log('Course already in legacy format:', courseInput.code);
            return courseInput; // Already in legacy format
        }
        
        // Check if it's in new format
        if (courseInput.courseData) {
            const cd = courseInput.courseData;
            const identity = cd.courseIdentity;
            const outcomes = cd.learningOutcomes;
            const metadata = cd.metadata;
            
            // Build course code from prefix and number
            const code = `${identity.prefix}-${identity.number}`;
            
            console.log('Normalizing course:', code);
            console.log('Original competencyMapping:', outcomes.competencyMapping);
            
            // Convert new competency IDs to legacy IDs for backward compatibility
            const legacyCompetencies = DataAdapter.convertCompetencyMapping(
                outcomes.competencyMapping
            );
            
            console.log('Converted to legacy competencies:', legacyCompetencies);
            
            // Build prerequisites string and keep array
            const prereqArray = identity.prerequisites || [];
            const prereqString = prereqArray.length > 0
                ? prereqArray.map(p => `${p.coursePrefix}-${p.courseNumber}`).join(', ')
                : null;
            
            // Extract CLO and PLO IDs
            const cloIds = outcomes.courseLearningOutcomes.map(clo => clo.id);
            const ploIds = outcomes.programLearningOutcomes.map(plo => plo.id);
            
            // Return normalized format compatible with existing code
            const normalized = {
                id: courseInput.id || null, // Will be set by state
                code: code,
                name: identity.title,
                description: identity.catalogDescription,
                creditHours: identity.credits.toString(),
                prerequisites: prereqString,
                prerequisiteList: prereqArray, // Keep array for advanced filtering
                competencies: legacyCompetencies,
                plos: ploIds,
                clos: cloIds,
                justification: cd.topicalOutline ? cd.topicalOutline.body : '',

                // Keep original courseData for full access
                courseData: cd,

                // Additional normalized fields
                submittedBy: metadata.createdBy,
                submittedDate: metadata.createdDate,
                status: metadata.status.toLowerCase(),
                semesterOffered: identity.semesterOffered || 'BOTH',
                courseType: identity.courseType || [],
                capacity: identity.capacity || 24
            };
            
            console.log('Normalized course result:', normalized);
            return normalized;
        }
        
        // Unknown format, return as-is
        console.log('Unknown course format:', courseInput);
        return courseInput;
    },
    
    /**
     * Convert new competency mapping format to legacy format
     * New: { "Inquiry": 3, "Integration": 2, ... }
     * Legacy: { "thinking": 3, "learning": 2, ... }
     */
    convertCompetencyMapping: (newMapping) => {
        if (!newMapping) return {};
        
        const legacyMapping = {};
        const conversionMap = {
            'Inquiry': 'INQ',
            'Integration': 'INT',
            'GlobalCulturalAwareness': 'GCU',
            'Analysis': 'ANL',
            'DiversityEquityInclusion': 'DEI',
            'Communication': 'COM',
            'Collaboration': 'COL',
            'Creativity': 'CRE',
            'ScientificLiteracy': 'SCI',
            'InformationLiteracy': 'INL',
            'TechnologyLiteracy': 'TEC',
            'QuantitativeLiteracy': 'QNT'
        };

        Object.entries(newMapping).forEach(([newId, weight]) => {
            // Check if it's already in the new format (INQ, INT, etc)
            if (['INQ', 'INT', 'GCU', 'ANL', 'DEI', 'COM', 'COL', 'CRE', 'SCI', 'INL', 'TEC', 'QNT'].includes(newId)) {
                if (weight > 0) {
                    legacyMapping[newId] = weight;
                }
            } else {
                // Convert from long form to short form
                const shortId = conversionMap[newId];
                if (shortId && weight > 0) {
                    legacyMapping[shortId] = weight;
                }
            }
        });
        
        console.log('Converted competency mapping:', newMapping, '->', legacyMapping);
        return legacyMapping;
    },
    
    /**
     * Convert legacy competency IDs to new format
     * Legacy: { "thinking": 3, "learning": 2, ... }
     * New: { "Inquiry": 3, "Integration": 2, ... }
     */
    convertToNewCompetencyFormat: (legacyMapping) => {
        if (!legacyMapping) return {};
        
        const newMapping = {};
        const conversionMap = {
            'INQ': 'Inquiry',
            'INT': 'Integration',
            'GCU': 'GlobalCulturalAwareness',
            'ANL': 'Analysis',
            'DEI': 'DiversityEquityInclusion',
            'SCI': 'ScientificLiteracy',
            'INL': 'InformationLiteracy',
            'TEC': 'TechnologyLiteracy',
            'QNT': 'QuantitativeLiteracy',
            // Old legacy IDs
            'thinking': 'Inquiry',
            'learning': 'Integration',
            'global': 'GlobalCulturalAwareness',
            'information': 'InformationLiteracy',
            'ethics': 'DiversityEquityInclusion',
            'communication': 'Communication',
            'collaboration': 'Collaboration'
        };

        Object.entries(legacyMapping).forEach(([legacyId, weight]) => {
            // Check if it's already in the new long format
            if (['Inquiry', 'Integration', 'GlobalCulturalAwareness', 'Analysis', 'DiversityEquityInclusion', 'ScientificLiteracy', 'InformationLiteracy', 'TechnologyLiteracy', 'Communication', 'Collaboration', 'Creativity', 'QuantitativeLiteracy'].includes(legacyId)) {
                if (weight > 0) {
                    newMapping[legacyId] = Math.max(newMapping[legacyId] || 0, weight);
                }
            } else {
                const newId = conversionMap[legacyId] || legacyId;
                if (weight > 0) {
                    newMapping[newId] = Math.max(newMapping[newId] || 0, weight);
                }
            }
        });
        
        return newMapping;
    },
    
    /**
     * Convert normalized course back to full courseData structure
     * Used when saving courses via admin interface
     */
    denormalizeCourse: (normalizedCourse) => {
        // If it already has courseData, update and return
        if (normalizedCourse.courseData) {
            return {
                id: normalizedCourse.id,
                courseData: {
                    ...normalizedCourse.courseData,
                    metadata: {
                        ...normalizedCourse.courseData.metadata,
                        lastModified: new Date().toISOString().split('T')[0]
                    },
                    courseIdentity: {
                        ...normalizedCourse.courseData.courseIdentity,
                        title: normalizedCourse.name,
                        catalogDescription: normalizedCourse.description,
                        credits: parseInt(normalizedCourse.creditHours) || 3
                    },
                    learningOutcomes: {
                        ...normalizedCourse.courseData.learningOutcomes,
                        competencyMapping: DataAdapter.convertToNewCompetencyFormat(
                            normalizedCourse.competencies
                        )
                    }
                }
            };
        }
        
        // Create new courseData structure from legacy format
        const codeParts = normalizedCourse.code.split('-');
        const prefix = codeParts[0];
        const number = parseInt(codeParts[1]) || 100;
        
        return {
            id: normalizedCourse.id,
            courseData: {
                metadata: {
                    version: "0.1.0",
                    createdDate: normalizedCourse.submittedDate || new Date().toISOString().split('T')[0],
                    lastModified: new Date().toISOString().split('T')[0],
                    status: normalizedCourse.status ? normalizedCourse.status.toUpperCase() : "DRAFT",
                    reviewStatus: "PENDING",
                    createdBy: normalizedCourse.submittedBy || "admin@champlain.edu",
                    proposalId: `PROP-${Date.now()}`
                },
                courseIdentity: {
                    prefix: prefix,
                    number: number,
                    title: normalizedCourse.name,
                    transcriptTitle: normalizedCourse.name,
                    credits: parseInt(normalizedCourse.creditHours) || 3,
                    facultyLoad: parseInt(normalizedCourse.creditHours) || 3,
                    effectiveSemester: {
                        term: "FALL",
                        year: new Date().getFullYear()
                    },
                    courseType: [
                        {
                            category: "Major",
                            subcategory: "General"
                        }
                    ],
                    catalogDescription: normalizedCourse.description || "",
                    prerequisites: DataAdapter.parsePrerequisites(normalizedCourse.prerequisites),
                    instructionalMethod: "STANDARD",
                    semesterOffered: "BOTH",
                    capacity: 24
                },
                learningOutcomes: {
                    courseLearningOutcomes: (normalizedCourse.clos || []).map((clo, i) => ({
                        id: clo,
                        description: `Learning outcome ${i + 1}`,
                        linkedPLOs: []
                    })),
                    programLearningOutcomes: (normalizedCourse.plos || []).map((plo, i) => ({
                        id: plo,
                        description: `Program learning outcome ${i + 1}`,
                        competencies: []
                    })),
                    competencyMapping: DataAdapter.convertToNewCompetencyFormat(
                        normalizedCourse.competencies
                    )
                },
                topicalOutline: {
                    body: normalizedCourse.justification || ""
                },
                assessmentDesign: {
                    majorAssessments: []
                },
                resourcesPlanning: {
                    facilities: {
                        classroomType: "Standard",
                        body: ""
                    },
                    technology: {
                        body: ""
                    },
                    libraryResources: [],
                    otherResources: {
                        body: ""
                    }
                }
            }
        };
    },
    
    /**
     * Parse prerequisite string into structured format
     */
    parsePrerequisites: (prereqString) => {
        if (!prereqString) return [];
        
        const prereqs = [];
        const parts = prereqString.split(',').map(p => p.trim());
        
        parts.forEach(part => {
            const match = part.match(/([A-Z]+)-(\d+)/);
            if (match) {
                prereqs.push({
                    coursePrefix: match[1],
                    courseNumber: match[2],
                    courseName: ""
                });
            }
        });
        
        return prereqs;
    },
    
    /**
     * Normalize competency data
     */
    normalizeCompetency: (compInput) => {
        // New format has description and category
        if (compInput.description) {
            return {
                id: compInput.id,
                name: compInput.name,
                description: compInput.description,
                category: compInput.category
            };
        }
        
        // Legacy format - just id and name
        return compInput;
    }
};

const AppState = {
    // User state
    currentUser: null,
    currentRole: null,
    
    // Courses data (will be loaded from JSON and normalized)
    coursesData: [],
    
    // Selected courses for visualization - START WITH EMPTY ARRAY
    selectedCourseIds: [],
    
    // All college competencies (will be loaded from JSON)
    allCompetencies: [],
    
    // Program Learning Objectives (will be loaded from JSON)
    plos: [],
    
    // Course Learning Objectives (will be loaded from JSON)
    clos: [],
    
    // Proposals
    proposals: [
        {
            id: 1,
            courseCode: 'CSI-450',
            courseTitle: 'Machine Learning Fundamentals',
            description: 'Introduction to machine learning algorithms and applications',
            prerequisites: 'CSI-340',
            creditHours: '3',
            competencies: {
                thinking: 3,
                information: 2
            },
            justification: 'ML is essential for modern CS curriculum',
            submittedBy: 'faculty',
            submittedDate: '2025-01-15',
            status: 'pending',
            feedback: []
        }
    ],
    
    // Skill Pack Proposals
    skillPackProposals: [
        {
            id: 1001,
            skillPackName: 'AI & Machine Learning Practitioner',
            affiliatedPrograms: ['Computer Science & Innovation', 'Data Science'],
            description: 'A curated sequence of courses preparing students to design, build, and critically evaluate AI/ML systems in real-world contexts. This skill pack bridges core CS fundamentals with applied machine learning techniques used across industry.',
            outcome: 'Students will be able to build, evaluate, and ethically deploy machine learning models across structured and unstructured data domains.',
            rationale: 'Industry demand for AI practitioners has tripled since 2022. This skill pack bundles existing and near-future courses into a credential-backed pathway for students targeting ML engineering or data science roles, differentiating Champlain graduates in a competitive market.',
            courses: [
                {
                    courseCode: 'CSI-340',
                    contribution: 'Provides core database and data management skills essential for working with training datasets, feature stores, and ML experiment tracking.',
                    competencies: ['Analysis', 'Quantitative Literacy'],
                    prerequisites: [],
                    disposition: 'existing',
                    notes: ''
                },
                {
                    courseCode: 'CSI-360',
                    contribution: 'Covers web application development used for building ML model APIs and data dashboards for model output visualization.',
                    competencies: ['Collaboration', 'Communication', 'Creativity'],
                    prerequisites: ['CSI-340'],
                    disposition: 'existing',
                    notes: ''
                },
                {
                    courseCode: 'CSI-440',
                    contribution: 'Applies systems thinking and requirements engineering to AI/ML project scoping, stakeholder analysis, and ethical impact assessment.',
                    competencies: ['Inquiry', 'Communication', 'Analysis'],
                    prerequisites: ['CSI-340'],
                    disposition: 'modification',
                    notes: 'Add 2-week module on ML project scoping and bias auditing framework'
                }
            ],
            technologyRequirements: 'GPU-accessible computing (Google Colab Pro or campus server with CUDA). Python 3.10+, Jupyter Notebooks, scikit-learn, PyTorch, pandas.',
            libraryResources: 'IEEE Xplore and ACM Digital Library access for current ML research. "Hands-On Machine Learning" (Géron, 3rd ed.) as shared text across courses.',
            newCourseProposals: 'CSI-455 – Applied Deep Learning (proposed, pending curriculum committee review in Spring 2026)',
            courseModifications: 'CSI-440 – Add module on ML project scoping and AI ethics audit framework (~2 weeks of new content)',
            courseEliminations: 'None',
            programImpact: 'Minor competency overlap with the existing Data Analytics concentration. Coordination with the Data Science program is recommended to align coverage and avoid duplication.',
            submittedBy: 'faculty',
            submittedDate: '2026-02-05',
            status: 'pending',
            feedback: [
                {
                    message: 'Strong rationale and clear industry alignment — I appreciate the specificity. Two items to resolve before I can move this forward:\n\n1. Has the CSI-440 course owner been consulted on the proposed modification? We need sign-off before it can be listed as a required modification.\n\n2. Can you clarify the relationship with the existing Data Science concentration? Specifically, will students in that program be double-counted, or should this skill pack explicitly target CS & Innovation students?',
                    from: 'admin',
                    date: '2026-02-10',
                    timestamp: 1739145600000,
                    feedbackType: 'revision'
                }
            ]
        }
    ],

    // Course being edited (for modals)
    editingCourseId: null,

    // Active filters for course search
    activeFilters: {
        textSearch: '',
        departments: [],
        creditHours: [],
        semesterOffered: [],
        competencies: [],
        competencyWeights: [],
        prerequisiteMode: null,
        prerequisiteSpecific: null,
        completedCourses: [],
        courseType: [],
        capacityMin: undefined,
        capacityMax: undefined
    },

    // Saved filter presets
    filterPresets: [],

    // User credentials (for demo purposes - will be replaced by backend auth)
    users: {
        'student': { password: 'password', role: 'Student' },
        'faculty': { password: 'password', role: 'Faculty' },
        'admin': { password: 'password', role: 'Administrator' }
    },

    // Data loaded flag
    dataLoaded: false,

    // User schedules - keyed by username
    // Structure: { username: { semesterId: { semesterId, courses: [], conflicts: [], totalCredits: 0 } } }
    userSchedules: {},

    // Completed courses - keyed by username
    // Structure: { username: ['CSI-140', 'CSI-240', ...] }
    completedCourses: {}
};

// State getters
const StateGetters = {
    getCurrentUser: () => AppState.currentUser,
    getCurrentRole: () => AppState.currentRole,
    getCourses: () => AppState.coursesData,
    getSelectedCourses: () => AppState.coursesData.filter(c => AppState.selectedCourseIds.includes(c.id)),
    getCompetencies: () => AppState.allCompetencies,
    getProposals: () => AppState.proposals,
    getSkillPackProposals: () => AppState.skillPackProposals,
    getUsers: () => AppState.users,
    isDataLoaded: () => AppState.dataLoaded,
    getActiveFilters: () => AppState.activeFilters,
    getFilterPresets: () => AppState.filterPresets,
    getSelectedCourseIds: () => AppState.selectedCourseIds,

    // Schedule getters
    getUserSchedules: () => {
        const username = AppState.currentUser;
        if (!username) return {};
        if (!AppState.userSchedules[username]) {
            AppState.userSchedules[username] = {};
        }
        return AppState.userSchedules[username];
    },

    getCompletedCourses: () => {
        const username = AppState.currentUser;
        if (!username) return [];
        return AppState.completedCourses[username] || [];
    }
};

// State setters
const StateSetters = {
    setCurrentUser: (username, role) => {
        AppState.currentUser = username;
        AppState.currentRole = role;
    },
    
    setCourses: (courses) => {
        // Normalize all courses through the adapter
        AppState.coursesData = courses.map((course, index) => {
            const normalized = DataAdapter.normalizeCourse(course);
            // Assign ID if not present
            if (!normalized.id) {
                normalized.id = index + 1;
            }
            return normalized;
        });
    },
    
    setCompetencies: (competencies) => {
        // Normalize competencies
        AppState.allCompetencies = competencies.map(comp => 
            DataAdapter.normalizeCompetency(comp)
        );
    },
    
    setDataLoaded: (loaded) => {
        AppState.dataLoaded = loaded;
    },
    
    addCourse: (course) => {
        const newId = AppState.coursesData.length > 0 
            ? Math.max(...AppState.coursesData.map(c => c.id)) + 1 
            : 1;
        course.id = newId;
        
        // Normalize the course before adding
        const normalized = DataAdapter.normalizeCourse(course);
        normalized.id = newId;
        
        AppState.coursesData.push(normalized);
    },
    
    updateCourse: (id, courseData) => {
        const course = AppState.coursesData.find(c => c.id === id);
        if (course) {
            // Merge updates while preserving courseData structure
            Object.assign(course, courseData);
            
            // If courseData exists, update it too
            if (course.courseData) {
                const denormalized = DataAdapter.denormalizeCourse({
                    ...course,
                    ...courseData
                });
                course.courseData = denormalized.courseData;
            }
        }
    },
    
    deleteCourse: (id) => {
        const index = AppState.coursesData.findIndex(c => c.id === id);
        if (index > -1) {
            AppState.coursesData.splice(index, 1);
            // Also remove from selected courses
            const selectedIndex = AppState.selectedCourseIds.indexOf(id);
            if (selectedIndex > -1) {
                AppState.selectedCourseIds.splice(selectedIndex, 1);
            }
        }
    },
    
    toggleCourseSelection: (courseId) => {
        const index = AppState.selectedCourseIds.indexOf(courseId);
        if (index > -1) {
            AppState.selectedCourseIds.splice(index, 1);
        } else {
            AppState.selectedCourseIds.push(courseId);
        }
    },
    
    removeCourseSelection: (courseId) => {
        const index = AppState.selectedCourseIds.indexOf(courseId);
        if (index > -1) {
            AppState.selectedCourseIds.splice(index, 1);
        }
    },
    
    addProposal: (proposal) => {
        proposal.id = AppState.proposals.length + 1;
        AppState.proposals.push(proposal);
    },
    
    updateProposalStatus: (id, status) => {
        const proposal = AppState.proposals.find(p => p.id === id);
        if (proposal) {
            proposal.status = status;
        }
    },
    
    updateProposal: (id, proposalData) => {
        const proposal = AppState.proposals.find(p => p.id === id);
        if (proposal) {
            // Update proposal fields but preserve metadata
            proposal.courseCode = proposalData.courseCode;
            proposal.courseTitle = proposalData.courseTitle;
            proposal.description = proposalData.description;
            proposal.prerequisites = proposalData.prerequisites;
            proposal.creditHours = proposalData.creditHours;
            proposal.competencies = proposalData.competencies;
            proposal.justification = proposalData.justification;
            // Keep original submission data and feedback
        }
    },
    
    addSkillPackProposal: (proposal) => {
        proposal.id = Date.now();
        AppState.skillPackProposals.push(proposal);
    },

    updateSkillPackProposalStatus: (id, status) => {
        const proposal = AppState.skillPackProposals.find(p => p.id === id);
        if (proposal) {
            proposal.status = status;
        }
    },

    updateSkillPackProposal: (id, proposalData) => {
        const proposal = AppState.skillPackProposals.find(p => p.id === id);
        if (proposal) {
            Object.assign(proposal, proposalData);
        }
    },

    addSkillPackProposalFeedback: (id, feedback, feedbackType = 'general') => {
        const proposal = AppState.skillPackProposals.find(p => p.id === id);
        if (proposal) {
            if (!proposal.feedback) proposal.feedback = [];
            proposal.feedback.push({
                message: feedback,
                feedbackType,
                from: AppState.currentUser,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now()
            });
        }
    },

    addProposalFeedback: (id, feedback, feedbackType = 'general') => {
        const proposal = AppState.proposals.find(p => p.id === id);
        if (proposal) {
            if (!proposal.feedback) {
                proposal.feedback = [];
            }
            proposal.feedback.push({
                message: feedback,
                feedbackType,
                from: AppState.currentUser,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now()
            });
        }
    },
    
    setEditingCourse: (id) => {
        AppState.editingCourseId = id;
    },
    
    clearEditingCourse: () => {
        AppState.editingCourseId = null;
    },
    
    logout: () => {
        AppState.currentUser = null;
        AppState.currentRole = null;
        // Clear selected courses on logout
        AppState.selectedCourseIds = [];
    },

    setActiveFilters: (filters) => {
        AppState.activeFilters = { ...AppState.activeFilters, ...filters };
    },

    clearFilters: () => {
        AppState.activeFilters = {
            textSearch: '',
            departments: [],
            creditHours: [],
            semesterOffered: [],
            competencies: [],
            competencyWeights: [],
            prerequisiteMode: null,
            prerequisiteSpecific: null,
            completedCourses: [],
            courseType: [],
            capacityMin: undefined,
            capacityMax: undefined
        };
    },

    saveFilterPreset: (name) => {
        const preset = {
            id: Date.now(),
            name: name,
            filters: { ...AppState.activeFilters },
            createdBy: AppState.currentUser,
            createdDate: new Date().toISOString().split('T')[0]
        };
        AppState.filterPresets.push(preset);
        return preset;
    },

    loadFilterPreset: (presetId) => {
        const preset = AppState.filterPresets.find(p => p.id === presetId);
        if (preset) {
            AppState.activeFilters = { ...preset.filters };
            return true;
        }
        return false;
    },

    deleteFilterPreset: (presetId) => {
        const index = AppState.filterPresets.findIndex(p => p.id === presetId);
        if (index > -1) {
            AppState.filterPresets.splice(index, 1);
            return true;
        }
        return false;
    },

    // Schedule setters
    addCourseToSchedule: (semesterId, courseData) => {
        const username = AppState.currentUser;
        if (!username) return;

        if (!AppState.userSchedules[username]) {
            AppState.userSchedules[username] = {};
        }

        if (!AppState.userSchedules[username][semesterId]) {
            AppState.userSchedules[username][semesterId] = {
                semesterId: semesterId,
                courses: [],
                conflicts: [],
                totalCredits: 0
            };
        }

        // Check if course already in schedule
        const existing = AppState.userSchedules[username][semesterId].courses
            .find(c => c.courseId === courseData.courseId);

        if (!existing) {
            AppState.userSchedules[username][semesterId].courses.push(courseData);
        }

        // Update total credits
        StateSetters.updateScheduleCredits(semesterId);
    },

    removeCourseFromSchedule: (semesterId, courseId) => {
        const username = AppState.currentUser;
        if (!username || !AppState.userSchedules[username]) return;

        const schedule = AppState.userSchedules[username][semesterId];
        if (!schedule) return;

        schedule.courses = schedule.courses.filter(c => c.courseId !== courseId);

        // Update total credits
        StateSetters.updateScheduleCredits(semesterId);
    },

    updateScheduleConflicts: (semesterId, conflicts) => {
        const username = AppState.currentUser;
        if (!username || !AppState.userSchedules[username]) return;

        const schedule = AppState.userSchedules[username][semesterId];
        if (schedule) {
            schedule.conflicts = conflicts;
        }
    },

    updateScheduleCredits: (semesterId) => {
        const username = AppState.currentUser;
        if (!username || !AppState.userSchedules[username]) return;

        const schedule = AppState.userSchedules[username][semesterId];
        if (!schedule) return;

        const totalCredits = schedule.courses.reduce((sum, sc) => {
            const course = AppState.coursesData.find(c => c.id === sc.courseId);
            return sum + (parseInt(course.creditHours) || 3);
        }, 0);

        schedule.totalCredits = totalCredits;
    },

    setCompletedCourses: (courses) => {
        const username = AppState.currentUser;
        if (!username) return;

        AppState.completedCourses[username] = courses;
    },

    addCompletedCourse: (courseCode) => {
        const username = AppState.currentUser;
        if (!username) return;

        if (!AppState.completedCourses[username]) {
            AppState.completedCourses[username] = [];
        }

        if (!AppState.completedCourses[username].includes(courseCode)) {
            AppState.completedCourses[username].push(courseCode);
        }
    },

    removeCompletedCourse: (courseCode) => {
        const username = AppState.currentUser;
        if (!username || !AppState.completedCourses[username]) return;

        AppState.completedCourses[username] = AppState.completedCourses[username]
            .filter(code => code !== courseCode);
    },

    clearUserSchedules: () => {
        const username = AppState.currentUser;
        if (username && AppState.userSchedules[username]) {
            AppState.userSchedules[username] = {};
        }
    }
};

// Data loading function
const DataLoader = {
    /**
     * Load courses and competencies from JSON file
     */
    loadData: async () => {
        try {
            const response = await fetch('data/courses.json');
            if (!response.ok) {
                throw new Error('Failed to load courses data');
            }
            const data = await response.json();

            // Set courses (will be normalized via adapter)
            StateSetters.setCourses(data.courses);

            // Use competencies from JSON if available, otherwise use standard 10 Champlain competencies
            const competencies = data.competencies || [
                { id: 'ANL', name: 'Analysis', color: '#E52019' },
                { id: 'COL', name: 'Collaboration', color: '#F7931E' },
                { id: 'COM', name: 'Communication', color: '#FFDD00' },
                { id: 'CRE', name: 'Creativity', color: '#C4D82D' },
                { id: 'DEI', name: 'Diversity, Equity & Inclusion', color: '#5CB85C' },
                { id: 'GCU', name: 'Global/Cultural Awareness', color: '#7CC9B5' },
                { id: 'INL', name: 'Information Literacy', color: '#00B5AD' },
                { id: 'INQ', name: 'Inquiry', color: '#3C8DAD' },
                { id: 'INT', name: 'Integration', color: '#7B4FD0' },
                { id: 'QNT', name: 'Quantitative Literacy', color: '#D640A8' },
                { id: 'SCI', name: 'Scientific Literacy', color: '#F799C0' },
                { id: 'TEC', name: 'Technology Literacy', color: '#A61C3C' }
            ];

            StateSetters.setCompetencies(competencies);
            StateSetters.setDataLoaded(true);

            console.log('Course data loaded and normalized successfully:',
                AppState.coursesData.length, 'courses');
            console.log('Sample normalized course:', AppState.coursesData[0]);

            return true;
        } catch (error) {
            console.error('Error loading course data:', error);

            // Fallback to hardcoded data if JSON fails to load
            console.warn('Using fallback course data');
            StateSetters.setCourses([
                {
                    id: 1,
                    code: 'CSI-440',
                    name: 'Software Requirements Engineering',
                    competencies: {
                        thinking: 3,
                        information: 2,
                        learning: 2,
                        global: 2
                    }
                }
            ]);
            StateSetters.setCompetencies([
                { id: 'ANL', name: 'Analysis', color: '#E52019' },
                { id: 'COL', name: 'Collaboration', color: '#F7931E' },
                { id: 'COM', name: 'Communication', color: '#FFDD00' },
                { id: 'CRE', name: 'Creativity', color: '#C4D82D' },
                { id: 'DEI', name: 'Diversity, Equity & Inclusion', color: '#5CB85C' },
                { id: 'GCU', name: 'Global/Cultural Awareness', color: '#7CC9B5' },
                { id: 'INL', name: 'Information Literacy', color: '#00B5AD' },
                { id: 'INQ', name: 'Inquiry', color: '#3C8DAD' },
                { id: 'INT', name: 'Integration', color: '#7B4FD0' },
                { id: 'QNT', name: 'Quantitative Literacy', color: '#D640A8' },
                { id: 'SCI', name: 'Scientific Literacy', color: '#F799C0' },
                { id: 'TEC', name: 'Technology Literacy', color: '#A61C3C' }
            ]);
            StateSetters.setDataLoaded(true);

            return false;
        }
    }
};

// Export adapter for use in other modules
window.DataAdapter = DataAdapter;