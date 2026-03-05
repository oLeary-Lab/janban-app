# Projects Feature - Implementation Plan

**Date:** 2025-03-05
**Branch:** `project-feature`
**Status:** Planning

## Design Decisions (Agreed)

1. **Remove denormalized arrays**: Drop `Project.issues[]` and `User.projects[]`. Issues already have a `project` ref, and we already query `Project.find({ users: userId })`. Eliminates sync bugs.
2. **Cascade delete with warning**: Deleting a project cascade-deletes all its issues. The frontend must show a confirmation dialog with the exact count of issues that will be deleted.
3. **Sidebar uses last-visited project**: Store last-visited `projectId` in `localStorage`. Kanban/backlog sidebar links use this. If no project visited yet, redirect to `/projects`.

## Current State Assessment

### What's Already Done (and Working)

**Backend** — mostly complete:

- Models: Project, Issue, User all have correct relationships
- Project controller: full CRUD with user access control
- Issue controller: updated with project verification on create, `getIssuesByProject` endpoint
- Routes: all project routes configured with auth middleware
- Tests: 83 tests, reportedly high coverage

**Frontend data layer** — complete:

- `projectApiClient.ts`: all CRUD + `getIssuesByProject`
- `issueApiClient.ts`: supports optional `projectId` parameter
- `useProject.ts`: all 5 hooks (create, getAll, get, update, delete) with optimistic updates
- `useIssue.ts`: `useGetAllIssues(projectId?)` uses project-specific query keys
- Types: `Issue` has `project` field, `Project` type is defined
- Router: project-scoped routes (`/projects/:projectId/kanban`, etc.)
- Header: breadcrumbs showing project context
- ProjectsPage: basic list with table and create dialog

### What's Broken or Missing

#### 1. Broken Navigation Links (Critical)

Multiple components still reference old routes that no longer exist in the router:

| File                      | Line    | Broken Link                  | Should Be                                              |
| ------------------------- | ------- | ---------------------------- | ------------------------------------------------------ |
| `KanbanBoard.tsx`         | 104     | `/issues/create-issue`       | `/projects/${projectId}/create-issue`                  |
| `IssueCard.tsx`           | 52      | `/issues/${issue.issueCode}` | `/projects/${projectId}/edit-issue/${issue.issueCode}` |
| `IssueManagementForm.tsx` | 82, 300 | `navigate("/kanban")`        | `navigate(\`/projects/${projectId}/kanban\`)`          |
| `CreateIssuePage.tsx`     | 19      | `navigate("/kanban")`        | `navigate(\`/projects/${projectId}/kanban\`)`          |
| `IssueManagementPage.tsx` | 22      | `navigate("/kanban")`        | `navigate(\`/projects/${projectId}/kanban\`)`          |
| `MainNavbar.tsx`          | 48, 58  | `/kanban`, `/kanban/backlog` | Dynamic or removed                                     |

#### 2. KanbanPage Doesn't Filter by Project

`KanbanPage` calls `useGetAllIssues()` with no projectId, fetching ALL issues globally instead of project-scoped issues. It needs to read `projectId` from URL params.

#### 3. CreateIssuePage Doesn't Set Project on Issue

The `project` field is required on the Issue model, but `CreateIssuePage` never sets it. The form schema in `IssueManagementForm` doesn't include `project`.

#### 4. IssuesContext Is Redundant

`IssuesContext` copies React Query data into separate state. This creates stale data bugs and is an anti-pattern when React Query is already managing the cache.

#### 5. No Project Edit/Delete UI

No frontend way to edit project name/description or delete a project (hooks exist, but no UI).

#### 6. MainNavbar Has Static Links

Sidebar links to `/kanban` and `/kanban/backlog` don't know which project the user is in. Need to be dynamic or restructured.

#### 7. Backend Cleanup Gaps

- `deleteIssue` doesn't remove the issue from `project.issues[]`
- `deleteProject` doesn't clean up orphaned issues or update `user.projects[]`

---

## Design Critique of Existing Plan

**What's good in the spec:**

- URL-based routing is the right call — bookmarkable, testable, no ambient state
- Keeping user management simple (auto-membership) is YAGNI-appropriate
- Context-based issue creation (from URL, no project selector) is clean UX

**What I'd change:**

1. **Drop `issues[]` from Project model.** Storing issue IDs on the project is redundant — issues already have a `project` ref. Every create/delete requires syncing two places. Querying `Issue.find({ project: projectId })` is sufficient and simpler. However, this is a schema migration. Acceptable since there's no production data.

2. **Drop `projects[]` from User model.** Same reasoning — we can query `Project.find({ users: userId })`. But `users[]` on Project is the access control mechanism, so that stays. The reverse reference on User is pure denormalization with sync risk.

3. **Remove IssuesContext.** React Query already caches issues. The context just duplicates state and introduces staleness.

4. **Restructure MainNavbar.** Instead of static kanban/backlog links, the sidebar should show "Projects" link always, and show kanban/backlog links only when in a project context (reading from URL params).

---

## Implementation Plan

### Phase 1: Backend Schema Cleanup & Delete Cascade

**1.1 Remove `issues[]` from Project schema**

- Remove `issues` field from Project model
- Remove pre-save/update logic referencing issues if any
- Update `createProject` — remove `project.issues = []`
- Update `createIssue` — remove `project.issues.push()` / `project.save()`
- Update `getProject` — remove `.populate("issues")`; use `Issue.find({ project })` if issue data needed
- Update all backend tests asserting on `project.issues`

**1.2 Remove `projects[]` from User schema**

- Remove `projects` field from User model
- Update `createProject` — remove the block pushing project to `user.projects`
- Update all backend tests asserting on `user.projects`

**1.3 Update `deleteProject` to cascade-delete issues**

- Count issues for the project before deletion (`Issue.countDocuments({ project: project._id })`)
- Delete all issues: `Issue.deleteMany({ project: project._id })`
- Delete the project
- Return `{ message, deletedIssueCount }` in response so frontend can confirm/display
- Add an endpoint or field to get issue count before deletion (for the confirmation dialog). Options: either use the existing `getProject` response + a count query, or add `GET /api/projects/:projectId/issue-count`

**1.4 Update backend tests**

- Update all controller tests for schema changes
- Add tests for cascade deletion behavior
- Verify `deleteIssue` still works cleanly (no project cleanup needed anymore)

### Phase 2: Wire Frontend Pages to Project Context

**2.1 Update `KanbanPage` to use project context**

- Read `projectId` from `useParams()`
- Pass `projectId` to `useGetAllIssues(projectId)`
- Show project name in heading (use `useGetProject`)

**2.2 Update `CreateIssuePage` to pass project**

- Read `projectId` from `useParams()`
- Look up project's `_id` from `useGetProject(projectId)`
- Pass `project` (the MongoDB `_id`) into the issue form data before submitting
- Navigate back to `/projects/${projectId}/kanban` after creation

**2.3 Update `IssueManagementPage` for project context**

- Read `projectId` from `useParams()`
- Navigate back to `/projects/${projectId}/kanban` after save/delete

**2.4 Update `IssueManagementForm`**

- Accept `projectId` as prop for navigation
- Include `project` (MongoDB ObjectId) in form schema as hidden field
- Fix all `navigate("/kanban")` calls to use project-scoped path
- Fix delete handler navigation

**2.5 Remove `IssuesContext`**

- Remove `IssuesContext.tsx` and `IssuesProvider`
- Update `KanbanPage` to use React Query data directly
- Update `main.tsx` to remove provider

### Phase 3: Fix All Navigation Links

**3.1 Update `KanbanBoard`**

- Accept `projectId` as prop
- Fix "Add Issue" link to `/projects/${projectId}/create-issue`

**3.2 Update `IssueCard`**

- Accept `projectId` as prop (or derive from context)
- Fix issue link to `/projects/${projectId}/edit-issue/${issue.issueCode}`

**3.3 Restructure `MainNavbar` with last-visited project**

- Always show: Home, Projects
- Kanban and Backlog links use last-visited `projectId` from `localStorage`
- When user navigates to any `/projects/:projectId/*` route, save `projectId` to `localStorage`
- If no project visited yet (no localStorage value), Kanban/Backlog links redirect to `/projects`
- Create a small utility/hook (e.g., `useLastProject`) to encapsulate the read/write logic

### Phase 4: Project Management UI

**4.1 Add edit/delete to ProjectTable**

- Add edit and delete action buttons per row
- Edit opens dialog with form (reuse CreateProjectForm pattern)
- Delete opens confirmation dialog that shows: "This will permanently delete the project and its X issues. Are you sure?"
- Fetch issue count for the project to display in the warning

**4.2 (Optional) Project settings page**

- A dedicated `/projects/:projectId/settings` page
- Can defer to later if not needed for MVP

### Phase 5: Testing

**5.1 Fix and run existing backend tests**

- Need to `npm install` in backend first (ts-jest missing)
- Update tests for any controller changes from Phase 1
- Add tests for delete cleanup behavior

**5.2 Frontend component tests**

- Test project-scoped navigation in KanbanPage
- Test issue creation with project context
- Test MainNavbar dynamic behavior

**5.3 E2E tests**

- Create project → navigate to kanban → create issue → verify on board
- Switch between projects, verify issue isolation
- Delete project, verify cleanup

---

## Execution Order

The work is ordered to fix broken things first, then add new capability:

1. **Phase 1** (Backend cleanup) — removes data integrity bugs
2. **Phase 2** (Wire pages to project) — makes the core flow work
3. **Phase 3** (Fix navigation) — makes the app navigable
4. **Phase 4** (Project management UI) — adds missing CRUD UI
5. **Phase 5** (Testing) — verifies everything works

Estimated total: phases 1-3 are the core work (~60% of effort), phase 4 is additive (~20%), phase 5 is verification (~20%).
