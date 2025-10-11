# Projects Feature - Design Specification

**Date:** 2025-10-11  
**Status:** In Design

## Overview

Add Projects entity to enable users to organize issues into multiple kanban boards. Each project represents a separate workspace with its own set of issues.

## Design Decisions

### 1. Data Migration Strategy

- **Decision:** Fresh start - no migration needed
- **Rationale:** No production data exists, can reset database

### 2. Project Selection & Navigation

- **Decision:** Combination approach (D)
  - Projects list page at `/projects`
  - URL-based routing for boards: `/projects/:projectId/kanban`
  - URL-based routing for backlog: `/projects/:projectId/backlog`
- **Rationale:**
  - Bookmarkable/shareable URLs
  - Browser navigation works intuitively
  - Single source of truth (URL)
  - Easier testing
  - Extensible for future project-specific pages

### 3. User-Project Relationships

- **Decision:** Simple auto-membership (E)
  - Project creator is automatically added as member
  - Manual user management deferred to future
- **Rationale:** YAGNI - start simple, add complexity when needed

### 4. Issue Creation Flow

- **Decision:** Context-based (B)
  - Issues created within current project context (from URL)
  - No project selector in issue form
- **Rationale:**
  - Simpler UX, fewer errors
  - Matches URL-based routing pattern
  - Can't accidentally create in wrong project

### 5. Projects List Page

- **Decision:** List + Create + Info (C)
  - Table/list of user's projects
  - "Create New Project" button
  - Show: name, description, issue count, last updated
  - Links to each project's board
- **Rationale:** Balance between simplicity and usefulness

---

## Backend Implementation

### Data Model Changes

#### Project Model (Existing)

```typescript
{
  name: String (required)
  projectId: String (required, unique) // Format: JP000001
  description: String (required)
  users: ObjectId[] (ref: User) // At least one required
  issues: ObjectId[] (ref: Issue)
  createdAt: Date
  lastUpdated: Date
}
```

#### Issue Model (Existing)

```typescript
{
  project: ObjectId (ref: Project, required) // Already added
  issueCategory: String (required)
  isBacklog: Boolean (required)
  issueCode: String (required, unique)
  name: String (required)
  description: String (required)
  storyPoints: Number
  assignee: String
  columnId: String (required)
  createdAt: Date
  lastUpdated: Date
}
```

#### User Model (Existing)

```typescript
{
  clerkId: String (required, unique)
  racfid: String (required, unique)
  email: String (required, unique)
  name: String (required)
  passwordEnabled: Boolean (required)
  projects: ObjectId[] (ref: Project) // Already added
  createdAt: Date
  lastUpdated: Date
}
```

### Controller Changes

#### Project Controller

**Updates needed:**

1. `createProject`

   - After creating project, add project to user's `projects[]` array
   - Ensure user is in project's `users[]` array
   - Maintain bidirectional relationship

2. `getAllProjects`

   - Filter to return only projects where current user is a member
   - Query: `Project.find({ users: userId })`

3. `getProject`
   - Verify user has access to project before returning
   - Return 403 if user not in project.users[]

**New endpoints to consider:**

- None needed initially

#### Issue Controller

**Updates needed:**

1. `createIssue`

   - Verify project exists and user has access
   - Add issue to project's `issues[]` array
   - Project field is already required in schema

2. `getAllIssues`

   - Add optional `projectId` query parameter
   - Filter issues by project if provided
   - Consider if we need global issue view or always filter by project

3. `getIssue`
   - Verify user has access to issue's project

**New endpoints to consider:**

- `GET /api/projects/:projectId/issues` - Get all issues for a project

#### User Controller

**Updates needed:**

- Ensure user-project relationship is maintained when projects are created
- May need helper functions for adding/removing users from projects

### API Routes

#### Existing Routes

```
POST   /api/projects/create-project
GET    /api/projects
GET    /api/projects/:projectId
PUT    /api/projects/:projectId
DELETE /api/projects/:projectId

POST   /api/issues/create-issue
GET    /api/issues
GET    /api/issues/:issueCode
PUT    /api/issues/:issueCode
DELETE /api/issues/:issueCode
```

#### New Routes Needed

```
GET    /api/projects/:projectId/issues  // Get issues for specific project
```

### Validation & Middleware

#### Project Validation (Existing)

- `validateProjectCreation` - validates name, description

#### New Validation Needed

- Verify user access to project before operations
- Verify project exists before creating issues

---

## Frontend Implementation

### Routing Changes

#### Current Routes

```
/                          - HomePage
/sign-in                   - SignInPage
/register                  - RegisterPage
/my-profile                - UserProfilePage
/projects                  - ProjectsPage (stub)
/kanban                    - KanbanPage (active board)
/backlog                   - KanbanPage (backlog)
/create-issue              - CreateIssuePage
/edit-issue/:issueCode     - IssueManagementPage
```

#### New Route Structure

```
/                                      - HomePage
/sign-in                               - SignInPage
/register                              - RegisterPage
/my-profile                            - UserProfilePage
/projects                              - ProjectsPage (list all projects)
/projects/:projectId/kanban            - KanbanPage (active board)
/projects/:projectId/backlog           - KanbanPage (backlog)
/projects/:projectId/create-issue      - CreateIssuePage
/projects/:projectId/edit-issue/:issueCode - IssueManagementPage
```

**Migration notes:**

- Old `/kanban` and `/backlog` routes can redirect to projects page or show "select a project" message
- Or keep them temporarily with a default project selection

### Component Changes

#### New Components Needed

1. **ProjectsPage** (update existing stub)

   - Fetch and display user's projects
   - "Create New Project" button
   - Project table/list with: name, description, issue count, last updated
   - Links to each project's kanban board

2. **ProjectTable** (update existing stub)

   - Display projects in table format
   - Columns: Name, Description, Issues, Last Updated, Actions
   - Click row or button to navigate to project board

3. **CreateProjectForm** (new)

   - Form with: name (required), description (required)
   - Submit creates project and navigates to project board

4. **CreateProjectDialog/Modal** (new)
   - Modal wrapper for CreateProjectForm
   - Triggered from ProjectsPage

#### Components to Update

1. **KanbanPage**

   - Accept `projectId` from URL params
   - Filter issues by project
   - Display project name in header
   - Update breadcrumbs/navigation

2. **CreateIssuePage**

   - Accept `projectId` from URL params
   - Pass project to issue creation
   - Remove any project selector (if it existed)

3. **IssueManagementPage**

   - Accept `projectId` from URL params
   - Verify issue belongs to project

4. **Layout/Header**
   - Show current project context
   - Breadcrumbs: Projects > [Project Name] > Kanban
   - Link back to projects list

### State Management

#### React Query Keys

```typescript
// Existing
["issues"] - all issues
["issue", issueCode] - single issue

// New/Updated
["projects"] - all user's projects
["project", projectId] - single project
["project-issues", projectId] - issues for a project
```

#### Hooks to Create/Update

**New Hooks:**

1. `useGetAllProjects()` - Fetch user's projects
2. `useGetProject(projectId)` - Fetch single project
3. `useUpdateProject()` - Update project details
4. `useDeleteProject()` - Delete project
5. Complete `useCreateProject()` - Currently incomplete

**Hooks to Update:**

1. `useGetAllIssues()` - Add optional projectId parameter
2. `useCreateIssue()` - Require projectId parameter
3. `useGetIssue()` - Verify project context

### Type Updates

#### Frontend Types

**Update Issue type:**

```typescript
export type Issue = {
  _id: string;
  project: string; // Add project reference
  issueCategory: string;
  isBacklog: boolean;
  issueCode: string;
  name: string;
  description: string;
  storyPoints: number;
  assignee: string;
  columnId: string;
  createdAt: Date;
  lastUpdated: Date;
};
```

**Project type (existing):**

```typescript
export type Project = {
  _id: string;
  projectId: string; // JP000001 format
  name: string;
  description: string;
  users: User[] | null;
  issues: Issue[] | null;
  createdAt: string;
  lastUpdated: string;
};
```

### API Client Functions

**Create projectApiClient.ts:**

```typescript
-createProject(formData, token) -
  getAllProjects(token) -
  getProject(projectId, token) -
  updateProject(projectId, formData, token) -
  deleteProject(projectId, token);
```

**Update issueApiClient.ts:**

```typescript
- createIssue(formData, token) // formData includes project
- getAllIssues(token, projectId?) // Add optional filter
- getIssuesByProject(projectId, token) // New function
```

---

## Testing Strategy

### Backend Tests

#### Project Controller Tests (Existing)

- All CRUD operations covered
- Need to add tests for user-project relationship

**New tests needed:**

1. Creating project adds user to project.users[]
2. Creating project adds project to user.projects[]
3. getAllProjects only returns user's projects
4. getProject returns 403 if user not a member

#### Issue Controller Tests (Existing)

- Basic CRUD covered

**New tests needed:**

1. Creating issue adds to project.issues[]
2. Creating issue requires valid project
3. Creating issue requires user access to project
4. getAllIssues filters by projectId when provided

### Frontend Tests

#### Unit Tests

- ProjectsPage renders projects list
- ProjectTable displays project data correctly
- CreateProjectForm validation
- Project-related hooks work correctly

#### E2E Tests

- User can create a project
- User can view projects list
- User can navigate to project board
- User can create issue within project context
- User can switch between projects
- Project isolation (can't see other users' projects)

---

## Implementation Plan

### Phase 1: Backend Foundation

1. Update projectController.createProject to manage user-project relationship
2. Update projectController.getAllProjects to filter by user
3. Update issueController to handle project context
4. Add project access verification middleware
5. Create projectApiClient.ts in frontend
6. Update backend tests

### Phase 2: Frontend Data Layer

1. Complete useProject hooks (all CRUD operations)
2. Update useIssue hooks for project context
3. Update Issue type to include project field
4. Create API client functions

### Phase 3: Routing & Navigation

1. Update router with new project-based routes
2. Add route protection/validation
3. Handle old routes (redirect or deprecate)
4. Update Layout/Header with breadcrumbs

### Phase 4: Projects List Page

1. Implement ProjectsPage
2. Implement ProjectTable component
3. Implement CreateProjectForm
4. Implement CreateProjectDialog
5. Wire up with hooks and navigation

### Phase 5: Update Existing Pages

1. Update KanbanPage for project context
2. Update CreateIssuePage for project context
3. Update IssueManagementPage for project context
4. Update any other issue-related pages

### Phase 6: Testing & Polish

1. Write/update backend tests
2. Write frontend unit tests
3. Write E2E tests
4. Manual testing
5. Bug fixes and polish

---

## Open Questions & Future Considerations

### Deferred Features

1. User invitation/management system
2. Project settings page
3. Project deletion with cascade (what happens to issues?)
4. Project archiving
5. Project permissions/roles
6. Cross-project issue movement
7. Project templates
8. Project dashboard with stats

### Technical Debt to Address

1. Bidirectional relationship sync (User.projects ↔ Project.users)
2. Orphaned issues if project deleted
3. Performance with large number of projects/issues
4. Caching strategy for project data

### Questions for Future Discussion

1. Should deleting a project delete all its issues?
2. Should we allow moving issues between projects?
3. Do we need project-level permissions (owner vs member)?
4. Should project names be unique per user?
