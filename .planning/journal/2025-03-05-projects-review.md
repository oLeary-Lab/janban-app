# Projects Feature Review - Smith's Analysis

**Date:** 2025-03-05

## Context

Mr Anderson asked me to review the `project-feature` branch and make an implementation plan. The branch has ~20 commits of prior work by a previous assistant.

## Key Findings

### Backend is mostly solid

- Models, controllers, routes are all in place and well-structured
- Tests exist with reportedly high coverage (83 tests, 97.8%)
- Two cleanup bugs: `deleteIssue` doesn't clean project.issues[], `deleteProject` doesn't cascade

### Frontend is half-wired

The data layer (API clients, hooks, types) is complete. But the actual pages and components still use old routes and don't read `projectId` from URL params. The app would be non-functional right now because:

- KanbanPage fetches all issues globally
- CreateIssuePage doesn't set the project field on issues
- Multiple hardcoded navigation paths point to routes that no longer exist in the router

### Architecture concerns

1. **IssuesContext** is a React anti-pattern alongside React Query — duplicates cache state
2. **Bidirectional references** (Project.issues[], User.projects[]) are denormalization that creates sync bugs. Debatable whether to fix now or later.
3. **MainNavbar** has static links that are broken — needs to become project-context-aware

## Decision Points for Mr Anderson

1. Remove denormalized arrays now or later?
2. Delete cascade behavior for projects
3. NavBar behavior when not in project context

## Plan Written

See `.planning/specs/projects-implementation-plan.md` for the full 5-phase plan.
