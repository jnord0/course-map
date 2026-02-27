# Champlain Academic Affairs System

A web-based course and competency management platform for Champlain College academic planning and curriculum visualization.

## Overview

The **Champlain Academic Affairs System** is a single-page application (SPA) that enables students, faculty, and administrators to visualize course relationships, track competency development, plan semester schedules, manage skill packs, and submit course proposals. Built with vanilla JavaScript and D3.js — no backend or build tools required.

## Features

| Feature | Description |
|---|---|
| **Network Visualization** | D3.js bipartite graph mapping courses to competencies with weighted edges |
| **Semester Planner** | Drag-and-drop scheduler with cumulative competency timeline charts |
| **Competency Analytics** | Bar, pie, and radar charts for competency weight distribution |
| **Course Pathway Planner** | Prerequisite chain visualization; see which courses unlock after completions |
| **Skill Packs** | Browse and propose curriculum bundles grouped by program and interest area |
| **Course Impact Reports** | Per-course report showing prerequisite chains, dependents, and skill pack membership |
| **Proposal Workflow** | Faculty submit course proposals; admins approve/reject with feedback |
| **Role-Based Access Control** | Student / Faculty / Administrator permission tiers |
| **Inline Comments** | Google Docs-style text commenting on proposal detail views |
| **Responsive Design** | Works on desktop, tablet, and mobile |

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A static file server

### Running locally

```bash
# Python 3
cd frontend
python3 -m http.server 8080

# Node.js
cd frontend
npx http-server -p 8080
```

Then open `http://localhost:8080`.

### Demo accounts

| Username | Password | Role |
|----------|----------|------|
| `student` | `password` | Student |
| `faculty` | `password` | Faculty |
| `admin` | `password` | Administrator |

**Student** — view courses, track competencies, use pathway planner
**Faculty** — all student features + submit and manage course proposals
**Administrator** — all faculty features + approve/reject proposals, create/edit/delete courses, access impact reports

## Project Structure

```
course-map/
├── README.md
├── CLAUDE.md                          # AI assistant development guide
└── frontend/
    ├── index.html                     # Single-page application entry point
    ├── css/
    │   └── styles.css                 # Champlain brand styling
    ├── js/
    │   ├── app.js                     # App initialization & routing
    │   ├── auth.js                    # Authentication & RBAC
    │   ├── state.js                   # Centralized state management
    │   ├── skill-packs.js             # Skill pack catalog module
    │   ├── mobile.js                  # Mobile-specific enhancements
    │   ├── comparison-export.js       # Course comparison & export
    │   ├── components/
    │   │   ├── courses.js             # Course CRUD & impact reports
    │   │   ├── competencies.js        # Competency tracking
    │   │   ├── proposals.js           # Proposal workflow
    │   │   ├── filters.js             # Search & filter logic
    │   │   ├── prerequisites.js       # Prerequisite validation
    │   │   ├── scheduling.js          # Scheduling helpers
    │   │   └── skill-pack-proposals.js
    │   └── ui/
    │       ├── visualization.js       # D3.js network graph & view switching
    │       ├── modals.js              # Modal management
    │       ├── graphs.js              # Competency analytics charts
    │       ├── semester-planner.js    # Semester scheduling interface
    │       ├── prerequisite-visualization.js
    │       ├── skillpack-overlap-checker.js
    │       ├── inline-comments.js     # Inline text commenting
    │       └── ux-enhancements.js
    └── data/
        ├── courses.json               # Course and competency data
        └── skill_packs.json           # Skill pack catalog
```

## Technology Stack

- **Language**: Vanilla JavaScript (ES6+)
- **Visualization**: D3.js v7.8.5
- **Styling**: Pure CSS3 with custom properties
- **Data**: JSON flat files (no database)
- **Build**: None — open `index.html` directly or serve statically

## Architecture

- **Module pattern** — each file exports a single `window.ModuleName` namespace
- **Centralized state** — all app state in `state.js` via `StateGetters` / `StateSetters`
- **Data adapter** — normalizes legacy and new course formats in `state.js`
- **Event delegation** — centralized handlers in `app.js`

## Known Limitations

- No backend — data resets on page refresh
- Authentication is client-side only (demo/educational use)
- All courses stored in a single JSON file

## Browser Support

Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+

---

Built for Champlain College Academic Affairs · Last updated February 2026
