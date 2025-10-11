# Projects Feature - Implementation Plan Part 1: Backend

**Related Documents:**
- Design: `.planning/specs/projects-feature-design.md`
- Part 2: Frontend (`.planning/specs/projects-implementation-part2-frontend.md`)
- Part 3: Testing & Integration (`.planning/specs/projects-implementation-part3-testing.md`)

---

## Prerequisites

### Understanding the Codebase

**Backend Stack:**
- Node.js + Express + TypeScript
- MongoDB with Mongoose ODM
- JWT authentication via Clerk
- Jest for testing
- Express-validator for validation

**Key Backend Directories:**
- `backend/src/models/` - Mongoose schemas
- `backend/src/controllers/` - Request handlers
- `backend/src/routes/` - Route definitions
- `backend/src/middleware/` - Auth, validation middleware
- `backend/src/utils/` - Helper functions
- `backend/test/` - Jest unit tests (mirrors src structure)

**Authentication Pattern:**
- All protected routes use `verifyAccessToken` middleware
- Middleware extracts `userId` from JWT and attaches to `req.userId`
- User is fetched from database using Clerk ID from token

**Testing Pattern:**
- Mock dependencies (models, validators)
- Test happy path + error cases
- Use `beforeEach` to reset mocks
- Mock response object with chained methods

---

## Phase 1: Backend Foundation

### Task 1.1: Add User-Project Relationship to Project Creation

**Objective:** When a project is created, automatically add the creator as a member.

**Files to Modify:**
- `backend/src/controllers/projectController.ts`
- `backend/src/models/user.ts` (verify structure)

**Implementation Steps:**

1. **Update `createProject` function** in `projectController.ts`:
   
   **Current code location:** Lines 7-36
   
   **Changes needed:**
   ```typescript
   // After line 27: project.issues = [];
   // Add these lines:
   
   // Add creator to project's users array
   project.users = [req.userId];
   
   await project.save();
   
   // Add project to user's projects array
   const user = await User.findById(req.userId);
   if (!user) {
     return res.status(404).json({ message: "User not found" });
   }
   
   user.projects.push(project._id);
   await user.save();
   ```

2. **Import User model** at top of file:
   ```typescript
   import User from "../models/user";
   ```

**How to Test:**
```bash
cd backend
npm test -- projectController.test.ts
```

**What Success Looks Like:**
- Project created with user in `users[]` array
- User has project in `projects[]` array
- Tests pass

**Commit Message:**
```
feat(backend): add user-project relationship on project creation

- Auto-add creator to project.users[]
- Auto-add project to user.projects[]
- Maintain bidirectional relationship
```

---

### Task 1.2: Filter Projects by User Access

**Objective:** Users should only see projects they're members of.

**Files to Modify:**
- `backend/src/controllers/projectController.ts`

**Implementation Steps:**

1. **Update `getAllProjects` function** (lines 38-47):
   
   **Replace:**
   ```typescript
   const projects = await Project.find({});
   ```
   
   **With:**
   ```typescript
   const projects = await Project.find({ users: req.userId });
   ```

**How to Test:**
```bash
npm test -- projectController.test.ts
```

**What Success Looks Like:**
- Only returns projects where user is in `users[]` array
- Empty array if user has no projects
- Tests pass

**Commit Message:**
```
feat(backend): filter projects by user membership

- getAllProjects now returns only user's projects
- Query filters by users array containing userId
```

---

### Task 1.3: Add Project Access Verification

**Objective:** Verify user has access to project before allowing operations.

**Files to Modify:**
- `backend/src/controllers/projectController.ts`

**Implementation Steps:**

1. **Update `getProject` function** (lines 49-65):
   
   **After line 54** (after finding project), add:
   ```typescript
   if (!project) {
     return res.status(404).json({ message: "Project not found" });
   }
   
   // Verify user has access
   const hasAccess = project.users.some(
     (userId) => userId.toString() === req.userId
   );
   
   if (!hasAccess) {
     return res.status(403).json({ message: "Access denied" });
   }
   ```

2. **Update `updateProject` function** (lines 67-89):
   
   **After line 72** (after finding project), add same access check:
   ```typescript
   if (!existingProject) {
     return res.status(404).json({ message: "Project not found" });
   }
   
   // Verify user has access
   const hasAccess = existingProject.users.some(
     (userId) => userId.toString() === req.userId
   );
   
   if (!hasAccess) {
     return res.status(403).json({ message: "Access denied" });
   }
   ```

3. **Update `deleteProject` function** (lines 91-106):
   
   **Before deletion**, add access check:
   ```typescript
   const project = await Project.findOne({ projectId });
   
   if (!project) {
     return res.status(404).json({ message: "Project not found" });
   }
   
   // Verify user has access
   const hasAccess = project.users.some(
     (userId) => userId.toString() === req.userId
   );
   
   if (!hasAccess) {
     return res.status(403).json({ message: "Access denied" });
   }
   
   await Project.findOneAndDelete({ projectId });
   ```

**How to Test:**
```bash
npm test -- projectController.test.ts
```

**What Success Looks Like:**
- Returns 403 if user not in project.users[]
- Operations succeed if user has access
- Tests pass

**Commit Message:**
```
feat(backend): add project access verification

- Verify user membership before get/update/delete
- Return 403 for unauthorized access
- Prevent cross-user project access
```

---

### Task 1.4: Update Issue Controller for Project Context

**Objective:** Handle project association when creating/fetching issues.

**Files to Modify:**
- `backend/src/controllers/issueController.ts`
- `backend/src/models/project.ts` (verify structure)

**Implementation Steps:**

1. **Import Project model** at top of `issueController.ts`:
   ```typescript
   import Project from "../models/project";
   ```

2. **Update `createIssue` function** (lines 7-36):
   
   **After validation passes** (around line 15), add:
   ```typescript
   const { project: projectId } = req.body;
   
   // Verify project exists
   const project = await Project.findById(projectId);
   if (!project) {
     return res.status(404).json({ message: "Project not found" });
   }
   
   // Verify user has access to project
   const hasAccess = project.users.some(
     (userId) => userId.toString() === req.userId
   );
   
   if (!hasAccess) {
     return res.status(403).json({ message: "Access denied to project" });
   }
   ```

3. **After issue is saved** (after line 29), add:
   ```typescript
   await issue.save();
   
   // Add issue to project's issues array
   project.issues.push(issue._id);
   await project.save();
   ```

4. **Update `getAllIssues` function** (lines 38-47):
   
   **Add optional project filtering:**
   ```typescript
   export const getAllIssues = async (req: Request, res: Response) => {
     try {
       const { projectId } = req.query;
       
       let query = {};
       if (projectId) {
         // Verify user has access to project
         const project = await Project.findById(projectId);
         if (!project) {
           return res.status(404).json({ message: "Project not found" });
         }
         
         const hasAccess = project.users.some(
           (userId) => userId.toString() === req.userId
         );
         
         if (!hasAccess) {
           return res.status(403).json({ message: "Access denied" });
         }
         
         query = { project: projectId };
       }
       
       const issues = await Issue.find(query);
       return res.status(200).json(issues);
     } catch (err) {
       console.log(err);
       return res.status(500).json({ message: "Something went wrong" });
     }
   };
   ```

5. **Update `getIssue` function** (lines 49-65):
   
   **After finding issue**, add access verification:
   ```typescript
   if (!issue) {
     return res.status(404).json({ message: "Issue not found" });
   }
   
   // Verify user has access to issue's project
   const project = await Project.findById(issue.project);
   if (!project) {
     return res.status(404).json({ message: "Project not found" });
   }
   
   const hasAccess = project.users.some(
     (userId) => userId.toString() === req.userId
   );
   
   if (!hasAccess) {
     return res.status(403).json({ message: "Access denied" });
   }
   ```

**How to Test:**
```bash
npm test -- issueController.test.ts
```

**What Success Looks Like:**
- Issues require valid project
- Issues added to project.issues[] array
- User must have project access
- Query parameter filters by project
- Tests pass

**Commit Message:**
```
feat(backend): integrate project context with issues

- Verify project exists and user has access on issue creation
- Add created issue to project.issues[] array
- Add optional projectId query filter to getAllIssues
- Verify project access when fetching individual issues
```

---

### Task 1.5: Add Get Issues by Project Endpoint

**Objective:** Create dedicated endpoint for fetching project's issues.

**Files to Modify:**
- `backend/src/routes/issueRoute.ts`
- `backend/src/controllers/issueController.ts`

**Implementation Steps:**

1. **Add new controller function** in `issueController.ts`:
   
   **Add at end of file:**
   ```typescript
   // "/api/projects/:projectId/issues"
   export const getIssuesByProject = async (req: Request, res: Response) => {
     try {
       const { projectId } = req.params;
       
       // Verify project exists
       const project = await Project.findOne({ projectId });
       if (!project) {
         return res.status(404).json({ message: "Project not found" });
       }
       
       // Verify user has access
       const hasAccess = project.users.some(
         (userId) => userId.toString() === req.userId
       );
       
       if (!hasAccess) {
         return res.status(403).json({ message: "Access denied" });
       }
       
       // Fetch issues for this project
       const issues = await Issue.find({ project: project._id });
       return res.status(200).json(issues);
     } catch (err) {
       console.log(err);
       return res.status(500).json({ message: "Something went wrong" });
     }
   };
   ```

2. **Add route** in `backend/src/routes/projectRoute.ts`:
   
   **Import the function:**
   ```typescript
   import { getIssuesByProject } from "../controllers/issueController";
   ```
   
   **Add route** (after existing routes):
   ```typescript
   router.get("/:projectId/issues", verifyAccessToken, getIssuesByProject);
   ```

**How to Test:**
```bash
npm test -- issueController.test.ts
npm test -- projectRoute.test.ts
```

**What Success Looks Like:**
- Endpoint returns issues for specific project
- Verifies user access
- Returns 403 if unauthorized
- Tests pass

**Commit Message:**
```
feat(backend): add get issues by project endpoint

- New GET /api/projects/:projectId/issues endpoint
- Returns all issues for a specific project
- Includes access verification
```

---

### Task 1.6: Create Project API Client (Frontend)

**Objective:** Create API client functions for project operations.

**Files to Create:**
- `frontend/src/api/projectApiClient.ts`

**Implementation Steps:**

1. **Create new file** `frontend/src/api/projectApiClient.ts`:

```typescript
import type { Project } from "@/types/projectTypes";
import { axiosInstance } from "./axiosConfig";

type DeleteProjectResponse = {
  message: string;
};

export const createProject = async (
  formData: Partial<Project>,
  accessToken: string
): Promise<Project> => {
  return await axiosInstance
    .post("/api/projects/create-project", formData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error with create project request");
    });
};

export const getAllProjects = async (
  accessToken: string
): Promise<Project[]> => {
  return await axiosInstance
    .get("/api/projects", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error with fetching all projects");
    });
};

export const getProject = async (
  projectId: string,
  accessToken: string
): Promise<Project> => {
  return await axiosInstance
    .get(`/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error with fetching project");
    });
};

export const updateProject = async (
  projectId: string,
  formData: Partial<Project>,
  accessToken: string
): Promise<Project> => {
  return await axiosInstance
    .put(`/api/projects/${projectId}`, formData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error with updating project");
    });
};

export const deleteProject = async (
  projectId: string,
  accessToken: string
): Promise<DeleteProjectResponse> => {
  return await axiosInstance
    .delete(`/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error occurred during deletion");
    });
};

export const getIssuesByProject = async (
  projectId: string,
  accessToken: string
): Promise<any[]> => {
  return await axiosInstance
    .get(`/api/projects/${projectId}/issues`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.data)
    .catch(() => {
      throw new Error("Error with fetching project issues");
    });
};
```

**Pattern Reference:**
- Follow same pattern as `frontend/src/api/issueApiClient.ts`
- Use axiosInstance from `./axiosConfig`
- Include Authorization header with Bearer token
- Return typed promises
- Catch and throw descriptive errors

**How to Test:**
- Will be tested when integrated with hooks
- Manual testing via browser network tab

**What Success Looks Like:**
- File compiles without errors
- Exports all CRUD functions
- Follows existing API client patterns

**Commit Message:**
```
feat(frontend): create project API client

- Add projectApiClient.ts with all CRUD operations
- Include getIssuesByProject endpoint
- Follow existing API client patterns
```

---

### Task 1.7: Update Backend Tests for User-Project Relationship

**Objective:** Add tests for new user-project relationship logic.

**Files to Modify:**
- `backend/test/controllers/projectController.test.ts`

**Implementation Steps:**

1. **Add User model mock** at top of test file:
   
   **After existing mocks** (around line 15):
   ```typescript
   jest.mock("../../src/models/user");
   import User from "../../src/models/user";
   ```

2. **Add test for user-project relationship in createProject**:
   
   **Add inside `describe("createProject")` block**:
   ```typescript
   it("should add creator to project users and project to user projects", async () => {
     const mockUser = {
       _id: "user123",
       projects: [],
       save: jest.fn().mockResolvedValue(true),
     };
     
     const mockProject = {
       _id: "project123",
       projectId: "JP000001",
       name: "Test Project",
       description: "Test Description",
       users: [],
       issues: [],
       save: jest.fn().mockResolvedValue(true),
     };
     
     mockRequest.body = {
       name: "Test Project",
       description: "Test Description",
     };
     mockRequest.userId = "user123";
     
     (validationResult as unknown as jest.Mock).mockReturnValue({
       isEmpty: () => true,
     });
     (Project.find as jest.Mock).mockResolvedValue([]);
     (Project as unknown as jest.Mock).mockImplementation(() => mockProject);
     (User.findById as jest.Mock).mockResolvedValue(mockUser);
     
     await createProject(mockRequest as Request, mockResponse as Response);
     
     expect(mockProject.users).toContain("user123");
     expect(mockUser.projects).toContain("project123");
     expect(mockUser.save).toHaveBeenCalled();
     expect(mockResponse.status).toHaveBeenCalledWith(201);
   });
   ```

3. **Add test for filtered getAllProjects**:
   
   **Add inside `describe("getAllProjects")` block**:
   ```typescript
   it("should return only projects where user is a member", async () => {
     const mockProjects = [
       { projectId: "JP000001", name: "Project 1", users: ["user123"] },
       { projectId: "JP000002", name: "Project 2", users: ["user123"] },
     ];
     
     mockRequest.userId = "user123";
     (Project.find as jest.Mock).mockResolvedValue(mockProjects);
     
     await getAllProjects(mockRequest as Request, mockResponse as Response);
     
     expect(Project.find).toHaveBeenCalledWith({ users: "user123" });
     expect(mockResponse.status).toHaveBeenCalledWith(200);
     expect(responseObject.json).toHaveBeenCalledWith(mockProjects);
   });
   ```

4. **Add test for project access verification**:
   
   **Add inside `describe("getProject")` block**:
   ```typescript
   it("should return 403 if user does not have access to project", async () => {
     const mockProject = {
       projectId: "JP000001",
       name: "Test Project",
       users: ["otherUser456"],
     };
     
     mockRequest.params = { projectId: "JP000001" };
     mockRequest.userId = "user123";
     (Project.findOne as jest.Mock).mockReturnValue({
       populate: jest.fn().mockResolvedValue(mockProject),
     });
     
     await getProject(mockRequest as Request, mockResponse as Response);
     
     expect(mockResponse.status).toHaveBeenCalledWith(403);
     expect(responseObject.json).toHaveBeenCalledWith({
       message: "Access denied",
     });
   });
   ```

**How to Test:**
```bash
npm test -- projectController.test.ts
```

**What Success Looks Like:**
- All new tests pass
- Existing tests still pass
- Coverage includes new logic

**Commit Message:**
```
test(backend): add tests for user-project relationships

- Test user added to project on creation
- Test project filtering by user membership
- Test access verification returns 403
```

---

### Task 1.8: Update Backend Tests for Issue-Project Integration

**Objective:** Add tests for issue-project relationship logic.

**Files to Modify:**
- `backend/test/controllers/issueController.test.ts`

**Implementation Steps:**

1. **Verify Project model is mocked** (should already be at line 17):
   ```typescript
   jest.mock("../../src/models/project");
   ```

2. **Import Project model**:
   ```typescript
   import Project from "../../src/models/project";
   ```

3. **Add test for project verification on issue creation**:
   
   **Add inside `describe("createIssue")` block**:
   ```typescript
   it("should verify project exists and user has access before creating issue", async () => {
     const mockProject = {
       _id: "project123",
       projectId: "JP000001",
       users: ["user123"],
       issues: [],
       save: jest.fn().mockResolvedValue(true),
     };
     
     const newIssue = {
       _id: "issue123",
       project: "project123",
       issueCategory: "Story",
       isBacklog: false,
       issueCode: "JI000001",
       name: "Test Issue",
       description: "Test description",
       storyPoints: 3,
       assignee: "User123",
       columnId: "playReady",
       save: jest.fn().mockResolvedValue(true),
     };
     
     mockRequest.body = {
       project: "project123",
       issueCategory: "Story",
       isBacklog: false,
       name: "Test Issue",
       description: "Test description",
       storyPoints: 3,
       assignee: "User123",
       columnId: "playReady",
     };
     mockRequest.userId = "user123";
     
     (validationResult as unknown as jest.Mock).mockReturnValue({
       isEmpty: () => true,
     });
     (Project.findById as jest.Mock).mockResolvedValue(mockProject);
     (Issue.find as jest.Mock).mockResolvedValue([]);
     (Issue as unknown as jest.Mock).mockImplementation(() => newIssue);
     jest.spyOn(issueUtils, "checkDatabaseForIssueCode").mockResolvedValue(false);
     
     await createIssue(mockRequest as Request, mockResponse as Response);
     
     expect(Project.findById).toHaveBeenCalledWith("project123");
     expect(mockProject.issues).toContain("issue123");
     expect(mockProject.save).toHaveBeenCalled();
     expect(mockResponse.status).toHaveBeenCalledWith(201);
   });
   
   it("should return 404 if project does not exist", async () => {
     mockRequest.body = { project: "invalidProject" };
     
     (validationResult as unknown as jest.Mock).mockReturnValue({
       isEmpty: () => true,
     });
     (Project.findById as jest.Mock).mockResolvedValue(null);
     
     await createIssue(mockRequest as Request, mockResponse as Response);
     
     expect(mockResponse.status).toHaveBeenCalledWith(404);
     expect(responseObject.json).toHaveBeenCalledWith({
       message: "Project not found",
     });
   });
   
   it("should return 403 if user does not have access to project", async () => {
     const mockProject = {
       _id: "project123",
       users: ["otherUser456"],
     };
     
     mockRequest.body = { project: "project123" };
     mockRequest.userId = "user123";
     
     (validationResult as unknown as jest.Mock).mockReturnValue({
       isEmpty: () => true,
     });
     (Project.findById as jest.Mock).mockResolvedValue(mockProject);
     
     await createIssue(mockRequest as Request, mockResponse as Response);
     
     expect(mockResponse.status).toHaveBeenCalledWith(403);
     expect(responseObject.json).toHaveBeenCalledWith({
       message: "Access denied to project",
     });
   });
   ```

4. **Add test for project filtering in getAllIssues**:
   
   **Add inside `describe("getAllIssues")` block**:
   ```typescript
   it("should filter issues by projectId when query parameter provided", async () => {
     const mockProject = {
       _id: "project123",
       users: ["user123"],
     };
     
     const mockIssues = [
       { issueCode: "JI000001", project: "project123" },
       { issueCode: "JI000002", project: "project123" },
     ];
     
     mockRequest.query = { projectId: "project123" };
     mockRequest.userId = "user123";
     
     (Project.findById as jest.Mock).mockResolvedValue(mockProject);
     (Issue.find as jest.Mock).mockResolvedValue(mockIssues);
     
     await getAllIssues(mockRequest as Request, mockResponse as Response);
     
     expect(Project.findById).toHaveBeenCalledWith("project123");
     expect(Issue.find).toHaveBeenCalledWith({ project: "project123" });
     expect(mockResponse.status).toHaveBeenCalledWith(200);
     expect(responseObject.json).toHaveBeenCalledWith(mockIssues);
   });
   ```

**How to Test:**
```bash
npm test -- issueController.test.ts
```

**What Success Looks Like:**
- All new tests pass
- Existing tests still pass
- Project access verification tested

**Commit Message:**
```
test(backend): add tests for issue-project integration

- Test project verification on issue creation
- Test issue added to project.issues[] array
- Test project filtering in getAllIssues
- Test access denied scenarios
```

---

## Phase 1 Complete

**Verification Checklist:**
- [ ] All backend tests pass: `npm test`
- [ ] Project creation adds user relationship
- [ ] Projects filtered by user membership
- [ ] Project access verified on all operations
- [ ] Issues require valid project
- [ ] Issues added to project.issues[] array
- [ ] Project API client created
- [ ] All commits follow conventional commit format

**Next Steps:**
Proceed to Part 2: Frontend Implementation
