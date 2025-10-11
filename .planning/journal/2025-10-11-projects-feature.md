# Projects Feature - Initial Analysis
Date: 2025-10-11

## Current State

### What Exists
- **Backend Models**: Project and Issue models with relationships
  - Project has: name, projectId (JP000001 format), description, users[], issues[]
  - Issue has: project reference (required), issueCategory, isBacklog, issueCode, name, description, storyPoints, assignee, columnId
  - User has: projects[] array
  - Validation: Projects must have at least one user

- **Backend Controllers**: Full CRUD for projects
  - createProject, getAllProjects, getProject, updateProject, deleteProject
  - Auto-generates projectId in JP000001 format
  - Tests exist and appear comprehensive

- **Backend Routes**: `/api/projects` endpoints configured with auth

- **Frontend**: Partial implementation
  - ProjectsPage exists but is a stub
  - ProjectTable component is a stub
  - useProject hook has only useCreateProject (incomplete)
  - Project type defined in projectTypes.ts
  - Route configured at `/projects`

### Key Observations
1. Issue model already has required `project` reference - breaking change for existing issues
2. Currently, KanbanPage shows all issues globally (no project filtering)
3. No project selection/context mechanism exists yet
4. Frontend Issue type doesn't include project field yet
5. The app currently works as single-board, needs to become multi-board

## Questions to Ask Neo
1. Migration strategy for existing issues without projects
2. How users select/switch between projects
3. Default project behavior
4. User-project relationship management
5. Issue creation flow with projects
