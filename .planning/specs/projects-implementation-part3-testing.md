# Projects Feature - Implementation Plan Part 3: Testing & Integration

**Related Documents:**
- Design: `.planning/specs/projects-feature-design.md`
- Part 1: Backend (`.planning/specs/projects-implementation-part1-backend.md`)
- Part 2: Frontend (`.planning/specs/projects-implementation-part2-frontend.md`)

---

## Phase 5: Update Existing Pages for Project Context

### Task 5.1: Update KanbanPage for Project Context

**Objective:** Make KanbanPage work with project-specific issues.

**Files to Modify:**
- `frontend/src/pages/kanban/KanbanPage.tsx`

**Implementation Steps:**

1. **Import useParams** and **useGetProject**:
   ```typescript
   import { useParams } from "react-router-dom";
   import { useGetProject } from "@/hooks/useProject";
   ```

2. **Get projectId from URL** (add at top of component):
   ```typescript
   const { projectId } = useParams<{ projectId: string }>();
   const { data: project, isLoading: isProjectLoading } = useGetProject(projectId || "");
   ```

3. **Update useGetAllIssues call** to filter by project:
   
   **Find current call** (around line 20):
   ```typescript
   const { data: allIssues, isLoading: isGetLoading } = useGetAllIssues();
   ```
   
   **Replace with:**
   ```typescript
   const { data: allIssues, isLoading: isGetLoading } = useGetAllIssues(project?._id);
   ```

4. **Update header to show project name**:
   
   **Find current header** (around line 67):
   ```typescript
   <h1>{"Project: Kanban"}</h1>
   ```
   
   **Replace with:**
   ```typescript
   <div className="mb-4">
     <h1 className="text-3xl font-bold">
       {project?.name || "Loading..."}
     </h1>
     <p className="text-muted-foreground">
       {type === "active-board" ? "Active Board" : "Backlog"}
     </p>
   </div>
   ```

5. **Update loading state** to include project loading:
   ```typescript
   {isGetLoading || isProjectLoading ? (
     <LoadingSpinner />
   ) : (
     <KanbanBoard
       // ... existing props
     />
   )}
   ```

6. **Handle missing project**:
   ```typescript
   if (!projectId) {
     return (
       <div className="container mx-auto py-8">
         <p>Project not found. Please select a project.</p>
       </div>
     );
   }
   ```

**How to Test:**
```bash
npm run dev
# Create a project
# Navigate to project kanban board
# Verify project name shows in header
# Verify only project's issues display
```

**What Success Looks Like:**
- Project name displays in header
- Only project's issues show
- Loading states work correctly
- Handles missing projectId

**Commit Message:**
```
feat(frontend): update KanbanPage for project context

- Get projectId from URL params
- Filter issues by project
- Display project name in header
- Handle loading and error states
```

---

### Task 5.2: Update CreateIssuePage for Project Context

**Objective:** Create issues within project context.

**Files to Modify:**
- `frontend/src/pages/kanban/CreateIssuePage.tsx`

**Implementation Steps:**

1. **Import useParams** and **useGetProject**:
   ```typescript
   import { useParams } from "react-router-dom";
   import { useGetProject } from "@/hooks/useProject";
   ```

2. **Get projectId from URL**:
   ```typescript
   const { projectId } = useParams<{ projectId: string }>();
   const { data: project } = useGetProject(projectId || "");
   ```

3. **Update handleSaveIssue** to include project:
   
   **Find current function** (around line 12):
   ```typescript
   const handleSaveIssue = async (
     formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">
   ) => {
     try {
       await createIssue(formData);
       toast.success("Issue created successfully");
       navigate("/kanban");
     } catch (error) {
       toast.error("Failed to create issue");
     }
   };
   ```
   
   **Replace with:**
   ```typescript
   const handleSaveIssue = async (
     formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">
   ) => {
     if (!project) {
       toast.error("Project not found");
       return;
     }
     
     try {
       const issueData = {
         ...formData,
         project: project._id,
       };
       await createIssue(issueData);
       toast.success("Issue created successfully");
       navigate(`/projects/${projectId}/kanban`);
     } catch (error) {
       toast.error("Failed to create issue");
     }
   };
   ```

4. **Update page header** to show project context:
   ```typescript
   <div className="mb-4">
     <h1 className="text-2xl font-bold">Create New Issue</h1>
     {project && (
       <p className="text-muted-foreground">
         Project: {project.name}
       </p>
     )}
   </div>
   ```

5. **Handle missing project**:
   ```typescript
   if (!projectId || !project) {
     return (
       <div className="container mx-auto py-8">
         <p>Project not found. Please select a project.</p>
       </div>
     );
   }
   ```

**How to Test:**
```bash
npm run dev
# Navigate to /projects/:projectId/create-issue
# Fill out form
# Submit
# Verify issue created with correct project
# Verify navigation to project kanban board
```

**What Success Looks Like:**
- Project context shown in header
- Issue created with project reference
- Navigates back to project board
- Handles missing project

**Commit Message:**
```
feat(frontend): update CreateIssuePage for project context

- Get projectId from URL params
- Include project in issue creation
- Show project name in header
- Navigate to project board after creation
```

---

### Task 5.3: Update IssueManagementPage for Project Context

**Objective:** Edit issues within project context.

**Files to Modify:**
- `frontend/src/pages/kanban/IssueManagementPage.tsx`

**Implementation Steps:**

1. **Import useParams** and **useGetProject**:
   ```typescript
   import { useParams } from "react-router-dom";
   import { useGetProject } from "@/hooks/useProject";
   ```

2. **Get projectId from URL**:
   ```typescript
   const { projectId, issueCode } = useParams<{ projectId: string; issueCode: string }>();
   const { data: project } = useGetProject(projectId || "");
   ```

3. **Update handleSaveIssue** navigation:
   
   **Find current navigation** (around line 18):
   ```typescript
   navigate("/kanban");
   ```
   
   **Replace with:**
   ```typescript
   navigate(`/projects/${projectId}/kanban`);
   ```

4. **Verify issue belongs to project**:
   
   **After issue loads**, add verification:
   ```typescript
   const { data: issue, isLoading } = useGetIssue();
   
   // Add this check
   useEffect(() => {
     if (issue && project && issue.project !== project._id) {
       toast.error("Issue does not belong to this project");
       navigate(`/projects/${projectId}/kanban`);
     }
   }, [issue, project, projectId, navigate]);
   ```

5. **Import useEffect**:
   ```typescript
   import { useEffect } from "react";
   ```

6. **Update page header**:
   ```typescript
   <div className="mb-4">
     <h1 className="text-2xl font-bold">Edit Issue</h1>
     {project && (
       <p className="text-muted-foreground">
         Project: {project.name}
       </p>
     )}
   </div>
   ```

**How to Test:**
```bash
npm run dev
# Navigate to existing issue edit page
# Verify project context shown
# Edit and save
# Verify navigation back to project board
# Try accessing issue from different project (should redirect)
```

**What Success Looks Like:**
- Project context displayed
- Issue edits save correctly
- Navigation returns to project board
- Cross-project access prevented

**Commit Message:**
```
feat(frontend): update IssueManagementPage for project context

- Get projectId from URL params
- Verify issue belongs to project
- Show project name in header
- Navigate to project board after save
```

---

### Task 5.4: Update IssueManagementForm to Include Project

**Objective:** Ensure form includes project field.

**Files to Modify:**
- `frontend/src/components/forms/IssueManagementForm.tsx`

**Implementation Steps:**

1. **Update formSchema** to include project:
   
   **Find formSchema** (around line 42):
   ```typescript
   const formSchema = z.object({
     issueCategory: z.string().min(1, "Required"),
     isBacklog: z.boolean({ required_error: "Required" }).default(false),
     issueCode: z.string(),
     name: z.string().min(1, "Required"),
     description: z.string().min(1, "Required"),
     storyPoints: z
       .number()
       .min(1, "Select between 1-8 inclusive")
       .max(8, "Select between 1-8 inclusive"),
     assignee: z.string().min(1, "Required"),
     columnId: z.string().min(1, "Required"),
   });
   ```
   
   **Add project field:**
   ```typescript
   const formSchema = z.object({
     project: z.string().min(1, "Project is required"), // ADD THIS
     issueCategory: z.string().min(1, "Required"),
     // ... rest of fields
   });
   ```

2. **Update defaultValues**:
   ```typescript
   defaultValues: {
     project: "", // ADD THIS
     issueCategory: "",
     // ... rest of fields
   },
   ```

3. **Update useEffect** that sets currentIssue values:
   
   **Find useEffect** (around line 80):
   ```typescript
   useEffect(() => {
     if (currentIssue) {
       form.reset({
         project: currentIssue.project, // ADD THIS
         issueCategory: currentIssue.issueCategory,
         // ... rest of fields
       });
     }
   }, [currentIssue, form]);
   ```

4. **Add hidden field for project** (no UI needed):
   
   **In form JSX**, add after opening `<form>` tag:
   ```tsx
   <FormField
     control={form.control}
     name="project"
     render={({ field }) => (
       <FormItem className="hidden">
         <FormControl>
           <Input type="hidden" {...field} />
         </FormControl>
       </FormItem>
     )}
   />
   ```

**How to Test:**
- TypeScript compilation
- Create/edit issue flow
- Verify project included in submission

**What Success Looks Like:**
- Form includes project field
- Project persists through edits
- No TypeScript errors

**Commit Message:**
```
feat(frontend): add project field to IssueManagementForm

- Include project in form schema
- Add hidden project field
- Ensure project persists through edits
```

---

## Phase 6: Testing & Polish

### Task 6.1: Write Backend Unit Tests

**Objective:** Ensure all backend changes have test coverage.

**Files to Verify:**
- `backend/test/controllers/projectController.test.ts`
- `backend/test/controllers/issueController.test.ts`

**Implementation Steps:**

1. **Run all backend tests:**
   ```bash
   cd backend
   npm test
   ```

2. **Check coverage:**
   ```bash
   npm run test:coverage
   ```

3. **Review coverage report** in terminal output:
   - Look for uncovered lines
   - Ensure new code paths tested
   - Target >80% coverage for modified files

4. **Add missing tests** if coverage low:
   - Follow patterns from Part 1, Tasks 1.7 and 1.8
   - Test error cases
   - Test edge cases (empty arrays, null values)

**What Success Looks Like:**
- All tests pass
- Coverage >80% for modified files
- No console errors or warnings

**Commit Message:**
```
test(backend): ensure comprehensive test coverage

- Verify all project-user relationship tests pass
- Verify all issue-project integration tests pass
- Achieve >80% coverage on modified files
```

---

### Task 6.2: Write Frontend Unit Tests

**Objective:** Add unit tests for new components.

**Files to Create:**
- `frontend/src/components/projects/ProjectTable.test.tsx`
- `frontend/src/components/forms/CreateProjectForm.test.tsx`
- `frontend/src/pages/projects/ProjectsPage.test.tsx`

**Implementation Steps:**

1. **Create ProjectTable test:**

```typescript
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ProjectTable from "./ProjectTable";
import type { Project } from "@/types/projectTypes";

const mockProjects: Project[] = [
  {
    _id: "1",
    projectId: "JP000001",
    name: "Test Project",
    description: "Test Description",
    users: null,
    issues: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    lastUpdated: "2025-01-01T00:00:00.000Z",
  },
];

describe("ProjectTable", () => {
  it("renders projects correctly", () => {
    render(
      <BrowserRouter>
        <ProjectTable projects={mockProjects} />
      </BrowserRouter>
    );

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("shows empty state when no projects", () => {
    render(
      <BrowserRouter>
        <ProjectTable projects={[]} />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/No projects found/i)
    ).toBeInTheDocument();
  });
});
```

2. **Create CreateProjectForm test:**

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateProjectForm from "./CreateProjectForm";

describe("CreateProjectForm", () => {
  it("validates required fields", async () => {
    const mockSubmit = vi.fn();
    render(<CreateProjectForm onSubmit={mockSubmit} isLoading={false} />);

    const submitButton = screen.getByRole("button", { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/project description is required/i)).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const mockSubmit = vi.fn();
    render(<CreateProjectForm onSubmit={mockSubmit} isLoading={false} />);

    const nameInput = screen.getByPlaceholderText(/enter project name/i);
    const descInput = screen.getByPlaceholderText(/enter project description/i);
    const submitButton = screen.getByRole("button", { name: /create project/i });

    fireEvent.change(nameInput, { target: { value: "New Project" } });
    fireEvent.change(descInput, { target: { value: "New Description" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: "New Project",
        description: "New Description",
      });
    });
  });
});
```

3. **Run frontend tests:**
   ```bash
   cd frontend
   npm test
   ```

**Pattern Reference:**
- Use Vitest and Testing Library
- Mock dependencies (hooks, navigation)
- Test user interactions
- Test validation

**What Success Looks Like:**
- All tests pass
- Components render correctly
- User interactions work
- Validation tested

**Commit Message:**
```
test(frontend): add unit tests for project components

- Add ProjectTable tests
- Add CreateProjectForm tests
- Test rendering, validation, and interactions
```

---

### Task 6.3: Manual Testing Checklist

**Objective:** Verify entire feature works end-to-end.

**Testing Steps:**

1. **Project Creation Flow:**
   - [ ] Navigate to `/projects`
   - [ ] Click "Create New Project"
   - [ ] Fill form with valid data
   - [ ] Submit form
   - [ ] Verify redirect to project kanban board
   - [ ] Verify project appears in projects list

2. **Project Isolation:**
   - [ ] Create 2+ projects
   - [ ] Create issues in each project
   - [ ] Navigate between project boards
   - [ ] Verify each board shows only its issues
   - [ ] Verify no cross-project data leakage

3. **Issue Creation in Project:**
   - [ ] Navigate to project kanban board
   - [ ] Click create issue
   - [ ] Verify project context shown
   - [ ] Create issue
   - [ ] Verify issue appears on project board
   - [ ] Verify issue has correct project reference

4. **Issue Editing in Project:**
   - [ ] Click edit on an issue
   - [ ] Verify project context shown
   - [ ] Edit issue details
   - [ ] Save changes
   - [ ] Verify redirect to project board
   - [ ] Verify changes persisted

5. **Navigation & Breadcrumbs:**
   - [ ] Verify breadcrumbs show on project pages
   - [ ] Click breadcrumb links
   - [ ] Verify navigation works
   - [ ] Test browser back/forward buttons

6. **Error Handling:**
   - [ ] Try accessing non-existent project
   - [ ] Try creating project with empty fields
   - [ ] Try creating issue without project
   - [ ] Verify error messages display

7. **Loading States:**
   - [ ] Verify loading spinners show
   - [ ] Verify skeleton states (if any)
   - [ ] Test slow network (throttle in DevTools)

8. **Responsive Design:**
   - [ ] Test on mobile viewport
   - [ ] Test on tablet viewport
   - [ ] Test on desktop viewport
   - [ ] Verify table scrolls on small screens

**How to Test:**
```bash
# Start backend
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev

# Open browser to http://localhost:5173
# Follow testing steps above
```

**What Success Looks Like:**
- All checklist items pass
- No console errors
- Smooth user experience
- Data persists correctly

**Document Results:**
Create file `.planning/manual-test-results.md` with findings

---

### Task 6.4: Fix Any Bugs Found

**Objective:** Address issues discovered during testing.

**Process:**

1. **Document each bug:**
   - What happened
   - Expected behavior
   - Steps to reproduce
   - Error messages/logs

2. **Prioritize bugs:**
   - Critical: Blocks core functionality
   - High: Major feature broken
   - Medium: Minor feature issue
   - Low: Cosmetic/edge case

3. **Fix bugs following TDD:**
   - Write failing test that reproduces bug
   - Fix the bug
   - Verify test passes
   - Verify manual test passes

4. **Commit each fix separately:**
   ```
   fix(scope): brief description of bug fix
   
   - What was broken
   - How it was fixed
   - Related test added/updated
   ```

**Common Issues to Watch For:**
- Missing null checks
- Incorrect query keys in TanStack Query
- Race conditions in async operations
- Missing loading states
- Incorrect TypeScript types
- Missing error handling

---

### Task 6.5: Update Documentation

**Objective:** Document the feature for future developers.

**Files to Create/Update:**
- `README.md` (if project-level changes needed)
- `.planning/journal/2025-10-11-projects-feature.md` (update with completion notes)

**Implementation Steps:**

1. **Update journal entry** with:
   - Implementation summary
   - Challenges encountered
   - Solutions applied
   - Lessons learned
   - Future improvements

2. **Add API documentation** (if needed):
   - Document new endpoints
   - Document request/response formats
   - Document authentication requirements

3. **Add code comments** where needed:
   - Complex logic
   - Non-obvious decisions
   - Important constraints

**What Success Looks Like:**
- Clear documentation
- Future developers can understand the feature
- API endpoints documented

**Commit Message:**
```
docs: add documentation for projects feature

- Update journal with implementation notes
- Document new API endpoints
- Add inline comments for complex logic
```

---

### Task 6.6: Final Verification & Cleanup

**Objective:** Ensure everything is production-ready.

**Checklist:**

1. **Code Quality:**
   - [ ] No console.log statements (except intentional logging)
   - [ ] No commented-out code
   - [ ] No TODO comments without tickets
   - [ ] Consistent formatting
   - [ ] No TypeScript `any` types (except necessary)

2. **Tests:**
   - [ ] All backend tests pass: `cd backend && npm test`
   - [ ] All frontend tests pass: `cd frontend && npm test`
   - [ ] Test coverage acceptable
   - [ ] No skipped/disabled tests

3. **Build:**
   - [ ] Backend builds: `cd backend && npm run build`
   - [ ] Frontend builds: `cd frontend && npm run build`
   - [ ] No build warnings

4. **Git:**
   - [ ] All changes committed
   - [ ] Commit messages follow convention
   - [ ] No merge conflicts
   - [ ] Branch up to date with develop

5. **Performance:**
   - [ ] No unnecessary re-renders
   - [ ] Queries cached appropriately
   - [ ] No memory leaks

**How to Verify:**

```bash
# Backend
cd backend
npm test
npm run build

# Frontend  
cd frontend
npm test
npm run build
npm run lint

# Check git status
git status
git log --oneline -10
```

**What Success Looks Like:**
- All checks pass
- Clean git history
- Ready for code review

**Final Commit:**
```
chore: final cleanup for projects feature

- Remove debug logging
- Clean up comments
- Verify all tests pass
- Verify builds succeed
```

---

## Implementation Complete

### Summary

**What Was Built:**
- Backend user-project relationships
- Backend issue-project integration
- Project CRUD API endpoints
- Frontend project management UI
- Project-scoped kanban boards
- Project-scoped issue creation/editing
- Comprehensive test coverage

**Key Files Modified:**
- Backend: 8 files
- Frontend: 15+ files
- Tests: 10+ files

**Commits Made:**
- ~20-25 commits following conventional commit format
- Frequent, small commits
- Clear commit messages

**Testing:**
- Backend unit tests: ✓
- Frontend unit tests: ✓
- Manual testing: ✓
- E2E tests: (deferred to future)

### Next Steps

1. **Code Review:**
   - Create pull request
   - Request review from team
   - Address feedback

2. **Deployment:**
   - Merge to develop branch
   - Deploy to staging
   - Verify in staging environment
   - Deploy to production

3. **Future Enhancements:**
   - User invitation system
   - Project permissions/roles
   - Project settings page
   - Project archiving
   - Project statistics dashboard
   - Cross-project issue movement

### Lessons Learned

**Document in journal:**
- What went well
- What was challenging
- What would you do differently
- Technical insights gained

---

## Troubleshooting Guide

### Common Issues

**Issue: Tests failing after changes**
- Check mocks are updated
- Verify imports are correct
- Check TypeScript types match

**Issue: TypeScript errors**
- Run `npm run build` to see all errors
- Check type definitions match backend
- Verify imports are correct

**Issue: Data not showing in UI**
- Check network tab for API calls
- Verify query keys are correct
- Check React Query DevTools
- Verify data structure matches types

**Issue: Navigation not working**
- Check route definitions
- Verify URL parameters match
- Check useParams destructuring

**Issue: Form validation not working**
- Check Zod schema
- Verify field names match
- Check form registration

**Getting Help:**
- Review design document
- Check existing similar code
- Review TanStack Query docs
- Review React Router docs
- Ask Neo for clarification
