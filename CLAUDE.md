# CLAUDE.md - AI Assistant Guide

## Project Overview

**Champlain Academic Affairs System** is a web-based course and competency management platform for Champlain College. This is a frontend-only single-page application (SPA) built with vanilla JavaScript and D3.js for interactive visualizations.

**Tech Stack:**
- Vanilla JavaScript (ES6+)
- D3.js v7.8.5 for data visualization
- Pure CSS with custom properties
- No build system or bundler required

**Total Codebase:** ~5,227 lines of code across 7 JavaScript modules, 1 HTML file, and comprehensive CSS styling.

---

## Repository Structure

```
course-map/
├── README.md                          # Project documentation
├── frontend/                          # Main application directory
│   ├── index.html                     # Single HTML entry point (428 lines)
│   ├── css/
│   │   └── styles.css                 # Comprehensive styling (1,532 lines)
│   ├── js/
│   │   ├── app.js                     # Main application entry (192 lines)
│   │   ├── auth.js                    # Authentication logic (84 lines)
│   │   ├── state.js                   # State management (578 lines)
│   │   ├── components/                # Business logic components
│   │   │   ├── courses.js             # Course management (531 lines)
│   │   │   ├── competencies.js        # Competency tracking (146 lines)
│   │   │   └── proposals.js           # Proposal workflow (546 lines)
│   │   └── ui/                        # User interface modules
│   │       ├── visualization.js       # D3.js network visualization (1,555 lines)
│   │       └── modals.js              # Modal management (63 lines)
│   └── data/
│       └── courses.json               # Course and competency data
└── .git/                              # Git repository
```

---

## Architecture & Design Patterns

### Module Organization

**Dependency Hierarchy:**
```
app.js (Entry Point)
  ├── auth.js (Authentication & RBAC)
  ├── state.js (Centralized State Management)
  │   └── Data normalization and adapters
  ├── components/ (Business Logic)
  │   ├── courses.js
  │   ├── competencies.js
  │   └── proposals.js
  └── ui/ (Presentation)
      ├── visualization.js
      └── modals.js
```

### Key Patterns

1. **Module Pattern**: Each file uses object namespacing to avoid global pollution
   ```javascript
   window.ModuleName = { functions... };
   ```

2. **Centralized State Management**: All application state lives in `state.js`
   - `AppState` object holds: selectedCourseIds, selectedCompetencyIds, proposals, users
   - `StateGetters` for reading state
   - `StateSetters` for updating state

3. **Data Adapter Pattern**: Normalizes legacy and new course data formats
   - Located in `state.js`
   - Ensures backward compatibility
   - Handles competency ID mapping (full names ↔ abbreviated codes)

4. **Role-Based Access Control (RBAC)**:
   - Three roles: Student, Faculty, Administrator
   - Permissions checked in `auth.js`
   - UI elements shown/hidden based on role

5. **Event Delegation**: Centralized event handling in `app.js`

---

## Code Conventions & Standards

### Naming Conventions

- **Variables & Functions**: camelCase
  ```javascript
  const selectedCourses = [];
  function getCourseById() {}
  ```

- **Constants**: UPPERCASE_WITH_UNDERSCORES
  ```javascript
  const MAX_CAPACITY = 30;
  ```

- **Module Namespaces**: PascalCase
  ```javascript
  window.CourseManager = {};
  ```

### File Organization

- **One module per file**: Each file exports a single namespace
- **Related functionality grouped**: Components in `components/`, UI in `ui/`
- **Separation of concerns**: Business logic separate from presentation

### Code Style

- **Defensive programming**: Always check for null/undefined
  ```javascript
  if (!course || !course.code) return;
  ```

- **Detailed comments**: Explain WHY, not just WHAT
- **JSDoc-style documentation** for complex functions
- **Consistent indentation**: 2 spaces (inferred from codebase)

---

## Development Workflow

### Working with Courses

**Location**: `frontend/js/components/courses.js`

**Key Functions:**
- `CourseManager.getCourses()` - Returns all courses
- `CourseManager.getCourseByCode(code)` - Find course by code
- `CourseManager.addCourse(courseData)` - Add new course
- `CourseManager.updateCourse(code, updates)` - Update existing course
- `CourseManager.deleteCourse(code)` - Remove course

**Important**: Always use state management functions, not direct manipulation:
```javascript
// ✅ Correct
StateSetters.setSelectedCourses([...selectedCourses, courseId]);

// ❌ Incorrect
AppState.selectedCourseIds.push(courseId);
```

### Working with Competencies

**Location**: `frontend/js/components/competencies.js`

**10 Core Competencies:**
1. Inquiry
2. Integration
3. Global/Cultural Awareness
4. Analysis
5. Diversity/Equity/Inclusion
6. Communication
7. Collaboration
8. Creativity
9. Ethical Reasoning
10. Quantitative Literacy

**Competency Weights:**
- `1` = Addressed
- `2` = Reinforced
- `3` = Emphasized

**Key Functions:**
- `CompetencyTracker.getCompetencyData()` - Get all competencies
- `CompetencyTracker.calculateCompetencyScores(courseIds)` - Calculate aggregated scores

### Working with Proposals

**Location**: `frontend/js/components/proposals.js`

**Proposal Lifecycle:**
1. Faculty submits proposal → Status: "pending"
2. Admin reviews proposal
3. Admin approves/rejects with feedback
4. Status updates to "approved" or "rejected"

**Key Functions:**
- `ProposalManager.submitProposal(proposalData)` - Submit new proposal
- `ProposalManager.getPendingProposals()` - Get all pending proposals
- `ProposalManager.reviewProposal(proposalId, decision, feedback)` - Review proposal
- `ProposalManager.getUserProposals(username)` - Get user's proposals

### Working with Visualization

**Location**: `frontend/js/ui/visualization.js`

**Most complex module** (1,555 lines) - handles D3.js network visualization

**Key Functions:**
- `CourseVisualizer.renderVisualization(courses, competencies)` - Main render
- `CourseVisualizer.updateVisualization(selectedCourses)` - Update based on selection
- `CourseVisualizer.toggleView()` - Switch between network and table view

**Important Considerations:**
- Uses SVG with responsive viewport scaling
- Bipartite graph layout (courses on left, competencies on right)
- Node sizes based on competency weights
- Interactive tooltips and hover effects
- Performance considerations for large datasets

---

## Data Schema

### Course Object Structure

```javascript
{
  "version": "1.0",                    // Data version
  "createdDate": "2024-01-15",        // Creation date
  "status": "active",                  // active | inactive | archived
  "approvalStatus": "approved",        // pending | approved | rejected
  "proposalId": "PROP-2024-001",      // Related proposal ID

  // Course Identity
  "code": "CSI-440",                   // Unique course code
  "title": "Software Requirements Engineering",
  "credits": 3,
  "prerequisites": ["CSI-340"],        // Array of course codes
  "capacity": 25,

  // Learning Outcomes
  "clos": [                            // Course Learning Outcomes
    "Analyze stakeholder needs...",
    "Design software requirements..."
  ],
  "plos": [                            // Program Learning Outcomes
    "Apply systems thinking...",
    "Demonstrate professional..."
  ],

  // Competency Mapping
  "competencies": {
    "Inquiry": 2,                      // 1=Addressed, 2=Reinforced, 3=Emphasized
    "Analysis": 3,
    "Communication": 2
  },

  // Content Details
  "topicalOutline": "Week-by-week content...",
  "assessmentDesign": "Assessment strategy...",
  "resources": "Required texts and materials...",

  // Metadata
  "createdBy": "john.smith",
  "submissionDate": "2024-01-15"
}
```

### Proposal Object Structure

```javascript
{
  "id": "PROP-2024-001",               // Unique proposal ID
  "courseCode": "CSI-440",
  "courseTitle": "Software Requirements Engineering",
  "description": "Full course description...",
  "prerequisites": ["CSI-340"],
  "credits": 3,

  // Competency weights (7 core competencies)
  "competencies": {
    "inquiry": 2,
    "analysis": 3,
    "communication": 2,
    "collaboration": 1,
    "creativity": 2,
    "ethicalReasoning": 1,
    "quantitativeLiteracy": 1
  },

  "justification": "Rationale for course...",
  "status": "pending",                 // pending | approved | rejected
  "submittedBy": "john.smith",
  "submittedDate": "2024-01-15",
  "reviewedBy": null,
  "reviewDate": null,
  "feedback": null
}
```

---

## Authentication & Authorization

### Demo Accounts

```
Username: student  | Password: password | Role: Student
Username: faculty  | Password: password | Role: Faculty
Username: admin    | Password: password | Role: Administrator
```

### Role Permissions

**Student:**
- View courses
- Select courses for visualization
- Track competencies
- View competency coverage

**Faculty:**
- All student permissions
- Submit course proposals
- View own proposals
- Edit pending proposals
- Track proposal status

**Administrator:**
- All faculty permissions
- Review all proposals
- Approve/reject proposals with feedback
- Create/edit/delete courses
- Manage competencies
- System administration
- Access all course metadata

### Working with Auth

**Location**: `frontend/js/auth.js`

```javascript
// Check if user is logged in
if (AuthManager.isAuthenticated()) {
  const user = AuthManager.getCurrentUser();
  console.log(user.username, user.role);
}

// Check permissions
if (AuthManager.hasRole('Administrator')) {
  // Show admin features
}

// Logout
AuthManager.logout();
```

**Important Notes:**
- Current implementation is **client-side only** (demo/learning purposes)
- Code includes comments for backend integration with JWT tokens
- In production, authentication should be server-side with secure tokens

---

## Styling & Branding

### Champlain College Brand Colors

**Primary Colors:**
```css
--champlain-navy: #003C5F;      /* Primary brand color */
--champlain-dark-blue: #002A3A;  /* Dark accent */
--champlain-blue: #236192;       /* Standard blue */
--champlain-bright-blue: #00A9E0; /* Bright accent */
--champlain-green: #74AA50;      /* Success/positive */
--champlain-teal: #3DC4B2;       /* Accent color */
```

**Usage:**
- Header gradient: Navy to Dark Blue
- Buttons: Bright Blue with hover effects
- Success states: Green
- Links and accents: Teal

### CSS Organization

**File**: `frontend/css/styles.css` (1,532 lines)

**Structure:**
1. CSS Custom Properties (variables)
2. Global resets and base styles
3. Layout (flexbox, grid)
4. Component styles (cards, buttons, forms)
5. Page-specific styles (login, dashboard)
6. Modal styles
7. Visualization styles
8. Responsive media queries

**Design System:**
- Card-based UI components
- Consistent spacing scale
- Smooth transitions and animations
- Backdrop blur effects on modals
- Responsive breakpoints for mobile/tablet/desktop

---

## Common Tasks & Workflows

### Adding a New Course

1. **Prepare course data** following the Course Object Structure
2. **Call state setter**:
   ```javascript
   const newCourse = {
     code: "CSI-999",
     title: "Advanced Topics",
     credits: 3,
     competencies: {
       "Inquiry": 2,
       "Analysis": 3
     }
     // ... other fields
   };

   CourseManager.addCourse(newCourse);
   ```
3. **Update visualization** if needed:
   ```javascript
   CourseVisualizer.renderVisualization(
     StateGetters.getAllCourses(),
     StateGetters.getAllCompetencies()
   );
   ```

### Modifying the Visualization

**Location**: `frontend/js/ui/visualization.js`

**Key Areas:**
- **Layout algorithm**: Lines 50-150 (bipartite graph positioning)
- **Node rendering**: Lines 200-400 (D3.js selection and data binding)
- **Edge rendering**: Lines 450-600 (connecting lines with weights)
- **Interactions**: Lines 700-900 (hover, click, tooltips)

**Tips:**
- Use D3.js data binding patterns: `selection.data().enter().append()`
- Update scales when changing node sizes
- Test with different numbers of courses (1, 5, 20+)
- Maintain responsive behavior with `viewBox` attribute

### Adding a New Modal

1. **Add HTML structure** to `frontend/index.html`:
   ```html
   <div id="new-modal-overlay" class="modal-overlay">
     <div class="modal-content">
       <!-- Modal content -->
     </div>
   </div>
   ```

2. **Add modal functions** in `frontend/js/ui/modals.js`:
   ```javascript
   openNewModal() {
     document.getElementById('new-modal-overlay').style.display = 'flex';
   },

   closeNewModal() {
     document.getElementById('new-modal-overlay').style.display = 'none';
   }
   ```

3. **Register close handlers** in `modals.js`:
   ```javascript
   setupModalCloseHandlers() {
     // Add click-outside-to-close behavior
   }
   ```

### Adding a New Competency

1. **Update competency data** in `state.js`:
   ```javascript
   const COMPETENCIES = [
     { id: 'new-competency', name: 'New Competency Name', color: '#hexcode' }
   ];
   ```

2. **Update proposal forms** in `frontend/index.html` (proposal submission form)

3. **Update visualization colors** in `visualization.js` (color scale)

4. **Test backward compatibility** with existing course data

---

## Testing & Quality Assurance

### Manual Testing Checklist

**Authentication:**
- [ ] Login with each role (student, faculty, admin)
- [ ] Verify role-specific UI elements show/hide correctly
- [ ] Test logout functionality
- [ ] Verify unauthorized actions are prevented

**Course Management:**
- [ ] Search courses by code and name
- [ ] Add courses to selection
- [ ] View course details
- [ ] (Admin) Create new course
- [ ] (Admin) Edit existing course
- [ ] (Admin) Delete course

**Visualization:**
- [ ] Render with 0 courses selected
- [ ] Render with 1 course selected
- [ ] Render with multiple courses (5+)
- [ ] Toggle between network and table view
- [ ] Hover interactions work correctly
- [ ] Tooltips display accurate information
- [ ] Responsive behavior on different screen sizes

**Proposals:**
- [ ] (Faculty) Submit new proposal
- [ ] (Faculty) View own proposals
- [ ] (Faculty) Edit pending proposal
- [ ] (Admin) View all pending proposals
- [ ] (Admin) Review and approve proposal
- [ ] (Admin) Review and reject proposal with feedback
- [ ] Verify status updates correctly

**Competency Tracking:**
- [ ] Tracker updates when courses selected/deselected
- [ ] Competency scores calculate correctly
- [ ] Weighted values displayed accurately

### Browser Compatibility

**Recommended Testing Browsers:**
- Chrome/Edge (Chromium) - Primary target
- Firefox
- Safari (macOS/iOS)

**Required Features:**
- ES6 JavaScript support
- SVG rendering
- CSS Grid and Flexbox
- CSS Custom Properties
- Backdrop filter (graceful degradation okay)

---

## Git Workflow

### Branch Naming

Current working branch: `claude/claude-md-mhzff0i5o391lfj0-01X9tJdfh38Khe5G6iBTZhQK`

**Convention**: `claude/<description>-<session-id>`

### Commit Messages

**Format:**
```
<type>: <short description>

<optional detailed description>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation changes
- `style:` Styling/CSS changes
- `chore:` Maintenance tasks

**Examples:**
```
feat: Add competency weight filtering to visualization

Implemented slider controls to filter competencies by weight threshold.
Users can now focus on emphasized (weight=3) competencies only.

fix: Correct course prerequisite validation

Fixed issue where circular prerequisites were not detected.
Added validation to prevent courses from depending on themselves.
```

### Push Requirements

**CRITICAL**: Always push to branch starting with `claude/` and ending with session ID:
```bash
git push -u origin claude/claude-md-mhzff0i5o391lfj0-01X9tJdfh38Khe5G6iBTZhQK
```

**Retry Logic**: Network failures should retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)

---

## Performance Considerations

### Visualization Performance

**Current Dataset**: 8 courses, 10 competencies
**Expected Max**: 100+ courses, 10 competencies

**Optimization Strategies:**
1. **Debounce interactions**: Hover events should be debounced
2. **Limit re-renders**: Only update changed elements with D3.js `.join()`
3. **Virtual scrolling**: Consider for table view with 100+ rows
4. **Canvas fallback**: For 200+ nodes, consider Canvas instead of SVG

### State Management Performance

**Current Approach**: Full state in memory (client-side only)

**Considerations:**
- Course data stored in `courses.json` (~500KB currently)
- Could scale to 1000+ courses before performance issues
- For larger datasets, implement pagination or lazy loading
- Backend integration would enable server-side filtering

### DOM Manipulation

**Best Practices:**
- Batch DOM updates
- Use DocumentFragment for multiple insertions
- Minimize reflows/repaints
- Use CSS transforms for animations (GPU-accelerated)

---

## Known Limitations & Future Considerations

### Current Limitations

1. **No Backend**: All data stored client-side
   - No persistence across sessions
   - No real authentication
   - Data loss on page refresh (unless localStorage is added)

2. **Single Data File**: All courses in `courses.json`
   - Not scalable for large institutions
   - No versioning or audit trail

3. **Client-Side Authorization**: Security is UI-only
   - All users can access all data in browser console
   - Production needs server-side authorization

4. **No Search Indexing**: Linear search through courses
   - Performance degrades with 100+ courses
   - Should implement proper search/indexing

### Backend Integration Path

**For Production Deployment:**

1. **API Endpoints Needed:**
   ```
   GET    /api/courses          - List courses
   POST   /api/courses          - Create course
   GET    /api/courses/:code    - Get course details
   PUT    /api/courses/:code    - Update course
   DELETE /api/courses/:code    - Delete course

   GET    /api/proposals        - List proposals
   POST   /api/proposals        - Submit proposal
   PUT    /api/proposals/:id    - Update proposal

   POST   /api/auth/login       - Authenticate user
   POST   /api/auth/logout      - End session
   GET    /api/auth/me          - Get current user
   ```

2. **Authentication**: Replace client-side with JWT tokens
   - Store token in httpOnly cookie or localStorage
   - Send token in Authorization header
   - Verify token server-side for each request

3. **Database Schema**:
   - `courses` table
   - `competencies` table
   - `course_competencies` junction table
   - `proposals` table
   - `users` table
   - `proposal_reviews` table

4. **Code Changes**:
   - Update `auth.js` to call API endpoints
   - Update `state.js` to fetch from API instead of JSON
   - Add loading states and error handling
   - Implement optimistic updates for better UX

---

## Troubleshooting Guide

### Visualization Not Rendering

**Symptoms**: Blank visualization area or D3.js errors

**Checks:**
1. Open browser console for errors
2. Verify D3.js library loaded: `typeof d3` should be `"object"`
3. Check course data format in `courses.json`
4. Verify competency IDs match between courses and competencies
5. Check SVG container dimensions (should have width/height)

**Common Fixes:**
```javascript
// Reset visualization
CourseVisualizer.renderVisualization(
  StateGetters.getAllCourses(),
  StateGetters.getAllCompetencies()
);
```

### Modal Not Opening

**Symptoms**: Modal functions called but nothing displays

**Checks:**
1. Verify modal HTML exists in `index.html`
2. Check modal ID matches function call
3. Verify modal overlay has `display: flex` when opened
4. Check z-index stacking (modals should be high z-index)

**Common Fix:**
```javascript
// Manually open modal
document.getElementById('modal-id-overlay').style.display = 'flex';
```

### State Not Updating

**Symptoms**: UI doesn't reflect state changes

**Checks:**
1. Verify using `StateSetters.setXXX()` not direct mutation
2. Check if UI update function called after state change
3. Verify state getters return expected data
4. Check browser console for errors

**Pattern:**
```javascript
// ✅ Correct
StateSetters.setSelectedCourses(newCourseIds);
updateUI(); // Trigger UI refresh

// ❌ Incorrect
AppState.selectedCourseIds = newCourseIds; // Direct mutation
```

### Competency Scores Wrong

**Symptoms**: Tracker shows incorrect aggregated scores

**Checks:**
1. Verify selected courses have competency mappings
2. Check competency weight values (1, 2, or 3 only)
3. Verify competency IDs match exactly (case-sensitive)
4. Check data normalization in state.js

**Debug:**
```javascript
const scores = CompetencyTracker.calculateCompetencyScores(
  StateGetters.getSelectedCourseIds()
);
console.log('Competency Scores:', scores);
```

---

## Best Practices for AI Assistants

### When Modifying Code

1. **Always read before editing**: Use Read tool before Edit/Write
2. **Preserve indentation**: Match existing code style exactly
3. **Test changes**: Verify functionality after modifications
4. **Update related files**: If changing state structure, update all consumers
5. **Maintain backward compatibility**: Don't break existing data formats

### When Adding Features

1. **Follow existing patterns**: Match module structure and naming
2. **Update documentation**: Add JSDoc comments for new functions
3. **Consider all roles**: Test feature with student/faculty/admin roles
4. **Responsive design**: Ensure new UI works on mobile/tablet/desktop
5. **Error handling**: Add defensive checks and error messages

### When Debugging

1. **Check browser console first**: Most errors visible there
2. **Verify data format**: Use `console.log` to inspect data structures
3. **Test incrementally**: Change one thing at a time
4. **Use browser DevTools**: Inspect DOM, network, and performance
5. **Check state**: Verify `AppState` object has expected values

### Code Quality Standards

1. **No magic numbers**: Use named constants
2. **Descriptive names**: Functions and variables should be self-documenting
3. **DRY principle**: Extract repeated code into functions
4. **Single responsibility**: Each function should do one thing well
5. **Comment complex logic**: Explain WHY, not WHAT

### Communication

1. **Reference line numbers**: Use `file:line` format (e.g., `courses.js:145`)
2. **Show examples**: Provide code snippets when explaining
3. **Explain tradeoffs**: Discuss pros/cons of different approaches
4. **Be specific**: "Update the visualization" → "Update the D3.js force simulation parameters to increase node spacing"
5. **Confirm understanding**: Ask clarifying questions if requirements are unclear

---

## Quick Reference

### Key Files by Task

**Want to...** | **Edit file...**
---|---
Change authentication logic | `frontend/js/auth.js`
Modify state management | `frontend/js/state.js`
Update course functionality | `frontend/js/components/courses.js`
Change competency tracking | `frontend/js/components/competencies.js`
Modify proposal workflow | `frontend/js/components/proposals.js`
Update visualization | `frontend/js/ui/visualization.js`
Change modal behavior | `frontend/js/ui/modals.js`
Update page layout | `frontend/index.html`
Modify styling | `frontend/css/styles.css`
Change course data | `frontend/data/courses.json`

### Essential Functions

```javascript
// State Management
StateGetters.getAllCourses()
StateGetters.getSelectedCourseIds()
StateSetters.setSelectedCourses(courseIds)

// Authentication
AuthManager.getCurrentUser()
AuthManager.hasRole(role)
AuthManager.isAuthenticated()

// Course Management
CourseManager.getCourses()
CourseManager.getCourseByCode(code)
CourseManager.addCourse(courseData)

// Visualization
CourseVisualizer.renderVisualization(courses, competencies)
CourseVisualizer.updateVisualization(selectedCourses)

// Modals
ModalManager.openProposalModal()
ModalManager.closeAllModals()

// Proposals
ProposalManager.submitProposal(data)
ProposalManager.getPendingProposals()
```

### File Loading Order

```html
<!-- In index.html -->
<script src="https://d3js.org/d3.v7.min.js"></script>  <!-- D3.js first -->
<script src="js/auth.js"></script>                      <!-- Auth second -->
<script src="js/state.js"></script>                     <!-- State third -->
<script src="js/components/courses.js"></script>        <!-- Components -->
<script src="js/components/competencies.js"></script>
<script src="js/components/proposals.js"></script>
<script src="js/ui/visualization.js"></script>          <!-- UI modules -->
<script src="js/ui/modals.js"></script>
<script src="js/app.js"></script>                       <!-- App last -->
```

---

## Additional Resources

### Champlain College Information

- **Official Website**: https://www.champlain.edu
- **Brand Guidelines**: Follow navy/blue/teal color scheme
- **Logo Usage**: College shield loaded from AWS S3

### D3.js Resources

- **Official Documentation**: https://d3js.org
- **Version Used**: v7.8.5
- **Key Concepts**: Data binding, selections, scales, force simulation

### Learning Paths

**For Understanding This Codebase:**
1. Start with `app.js` - see initialization flow
2. Read `auth.js` - understand authentication
3. Study `state.js` - grasp state management
4. Explore `courses.js` - main business logic
5. Review `visualization.js` - D3.js implementation

**For Making Changes:**
1. Read this CLAUDE.md thoroughly
2. Explore the specific file you need to modify
3. Test changes in browser with DevTools open
4. Verify all three roles (student/faculty/admin) work correctly
5. Test responsive behavior on different screen sizes

---

## Contact & Support

This codebase is maintained as part of Champlain College's Academic Affairs system.

For questions about:
- **Code functionality**: Review inline comments and this documentation
- **Business requirements**: Consult with academic affairs stakeholders
- **Technical decisions**: See Architecture & Design Patterns section above

---

**Last Updated**: November 14, 2025
**Version**: 1.0
**Maintained by**: AI Assistants (Claude)