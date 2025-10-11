# Projects Feature - Implementation Plan Part 2: Frontend

**Related Documents:**
- Design: `.planning/specs/projects-feature-design.md`
- Part 1: Backend (`.planning/specs/projects-implementation-part1-backend.md`)
- Part 3: Testing & Integration (`.planning/specs/projects-implementation-part3-testing.md`)

---

## Prerequisites

### Understanding the Frontend Codebase

**Frontend Stack:**
- React 18 + TypeScript
- Vite (build tool)
- React Router v6 (routing)
- TanStack Query (data fetching/caching)
- React Hook Form + Zod (forms/validation)
- Clerk (authentication)
- Tailwind CSS + shadcn/ui (styling/components)
- Vitest (testing)

**Key Frontend Directories:**
- `frontend/src/pages/` - Page components (route targets)
- `frontend/src/components/` - Reusable components
- `frontend/src/hooks/` - Custom React hooks (TanStack Query)
- `frontend/src/api/` - API client functions
- `frontend/src/types/` - TypeScript type definitions
- `frontend/src/router/` - Route configuration

**Data Fetching Pattern (TanStack Query):**
- `useQuery` for GET requests (caching, auto-refetch)
- `useMutation` for POST/PUT/DELETE (optimistic updates)
- Query keys for cache management: `["resource", id]`
- Optimistic updates in `onMutate`
- Rollback on error in `onError`
- Invalidate queries in `onSettled`

**Form Pattern:**
- Zod schema for validation
- React Hook Form with zodResolver
- shadcn/ui form components
- Submit handler calls mutation hook

---

## Phase 2: Frontend Data Layer

### Task 2.1: Update Issue Type with Project Field

**Objective:** Add project reference to Issue type.

**Files to Modify:**
- `frontend/src/types/kanbanTypes.ts`

**Implementation Steps:**

1. **Update Issue type** (lines 6-18):
   
   **Add project field:**
   ```typescript
   export type Issue = {
     _id: string;
     project: string; // ADD THIS LINE
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

**How to Test:**
- TypeScript compilation: `npm run build`
- Check for type errors in IDE

**What Success Looks Like:**
- No TypeScript errors
- Issue type includes project field

**Commit Message:**
```
feat(frontend): add project field to Issue type

- Update Issue type to include project reference
- Aligns with backend Issue model
```

---

### Task 2.2: Complete useProject Hooks

**Objective:** Implement all CRUD hooks for projects.

**Files to Modify:**
- `frontend/src/hooks/useProject.ts`

**Implementation Steps:**

1. **Import missing function** from API client:
   ```typescript
   import {
     createProject,
     getAllProjects,
     getProject,
     updateProject,
     deleteProject,
   } from "@/api/projectApiClient";
   ```

2. **Complete useCreateProject** (already started, lines 9-47):
   
   **Add missing handlers:**
   ```typescript
   onSuccess: (newProject, _, context) => {
     queryClient.setQueryData<Project[]>(
       [PROJECTS_QUERY_KEY],
       (old) =>
         old?.map((project) =>
           project._id === context?.tempId ? newProject : project
         ) || []
     );
   },
   
   onError: (err, _, context) => {
     console.log("Error creating project:", err);
     queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
   },
   
   onSettled: () => {
     queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
   },
   ```

3. **Add useGetAllProjects hook:**
   ```typescript
   export const useGetAllProjects = () => {
     const { getToken } = useAuth();
   
     return useQuery({
       queryKey: [PROJECTS_QUERY_KEY],
       queryFn: async () => {
         const accessToken = await getToken();
   
         if (!accessToken) {
           throw new Error("No authentication token available");
         }
         return getAllProjects(accessToken);
       },
       staleTime: 5 * 60 * 1000, // 5 minutes
       refetchOnWindowFocus: false,
     });
   };
   ```

4. **Add useGetProject hook:**
   ```typescript
   export const useGetProject = (projectId: string) => {
     const { getToken } = useAuth();
   
     return useQuery({
       queryKey: [PROJECT_QUERY_KEY, projectId],
       queryFn: async () => {
         const accessToken = await getToken();
   
         if (!accessToken) {
           throw new Error("No authentication token available");
         }
         return getProject(projectId, accessToken);
       },
       enabled: !!projectId,
       staleTime: 5 * 60 * 1000,
       refetchOnWindowFocus: false,
     });
   };
   ```

5. **Add useUpdateProject hook:**
   ```typescript
   export const useUpdateProject = () => {
     const { getToken } = useAuth();
     const queryClient = useQueryClient();
   
     return useMutation({
       mutationFn: async ({
         projectId,
         formData,
       }: {
         projectId: string;
         formData: Partial<Project>;
       }) => {
         const accessToken = await getToken();
   
         if (!accessToken) {
           throw new Error("No authentication token available");
         }
         return updateProject(projectId, formData, accessToken);
       },
   
       onMutate: async ({ projectId, formData }) => {
         await queryClient.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] });
         await queryClient.cancelQueries({
           queryKey: [PROJECT_QUERY_KEY, projectId],
         });
   
         const currentProjects = queryClient.getQueryData([PROJECTS_QUERY_KEY]);
         const currentProject = queryClient.getQueryData<Project>([
           PROJECT_QUERY_KEY,
           projectId,
         ]);
   
         queryClient.setQueryData<Project[]>(
           [PROJECTS_QUERY_KEY],
           (old) =>
             old?.map((project) =>
               project.projectId === projectId
                 ? { ...project, ...formData, lastUpdated: new Date().toISOString() }
                 : project
             ) || []
         );
   
         queryClient.setQueryData<Project>(
           [PROJECT_QUERY_KEY, projectId],
           (old) =>
             old
               ? { ...old, ...formData, lastUpdated: new Date().toISOString() }
               : old
         );
   
         return { currentProjects, currentProject };
       },
   
       onSuccess: (updatedProject, { projectId }) => {
         queryClient.setQueryData<Project[]>(
           [PROJECTS_QUERY_KEY],
           (old) =>
             old?.map((project) =>
               project.projectId === projectId ? updatedProject : project
             ) || []
         );
   
         queryClient.setQueryData<Project>(
           [PROJECT_QUERY_KEY, projectId],
           updatedProject
         );
       },
   
       onError: (err, { projectId }, context) => {
         console.log("Error updating project:", err);
         queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
         queryClient.setQueryData(
           [PROJECT_QUERY_KEY, projectId],
           context?.currentProject
         );
       },
   
       onSettled: (_, __, { projectId }) => {
         queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
         queryClient.invalidateQueries({
           queryKey: [PROJECT_QUERY_KEY, projectId],
         });
       },
     });
   };
   ```

6. **Add useDeleteProject hook:**
   ```typescript
   export const useDeleteProject = () => {
     const { getToken } = useAuth();
     const queryClient = useQueryClient();
   
     return useMutation({
       mutationFn: async (projectId: string) => {
         const accessToken = await getToken();
   
         if (!accessToken) {
           throw new Error("No authentication token available");
         }
         return deleteProject(projectId, accessToken);
       },
   
       onMutate: async (projectId) => {
         await queryClient.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] });
         await queryClient.cancelQueries({
           queryKey: [PROJECT_QUERY_KEY, projectId],
         });
   
         const currentProjects = queryClient.getQueryData([PROJECTS_QUERY_KEY]);
         const currentProject = queryClient.getQueryData<Project>([
           PROJECT_QUERY_KEY,
           projectId,
         ]);
   
         queryClient.setQueryData<Project[]>(
           [PROJECTS_QUERY_KEY],
           (old) => old?.filter((project) => project.projectId !== projectId) || []
         );
   
         queryClient.setQueryData([PROJECT_QUERY_KEY, projectId], null);
   
         return { currentProjects, currentProject };
       },
   
       onError: (err, projectId, context) => {
         console.log("Error deleting project:", err);
         queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
         queryClient.setQueryData(
           [PROJECT_QUERY_KEY, projectId],
           context?.currentProject
         );
       },
   
       onSettled: (_, __, projectId) => {
         queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
         queryClient.invalidateQueries({
           queryKey: [PROJECT_QUERY_KEY, projectId],
         });
       },
     });
   };
   ```

**Pattern Reference:**
- Follow same pattern as `frontend/src/hooks/useIssue.ts`
- Use optimistic updates
- Handle errors with rollback
- Invalidate queries on settled

**How to Test:**
- TypeScript compilation
- Will be tested when integrated with components

**What Success Looks Like:**
- All hooks export correctly
- No TypeScript errors
- Follows TanStack Query patterns

**Commit Message:**
```
feat(frontend): complete useProject hooks

- Add useGetAllProjects, useGetProject hooks
- Add useUpdateProject, useDeleteProject hooks
- Complete useCreateProject with handlers
- Follow TanStack Query patterns with optimistic updates
```

---

### Task 2.3: Update useIssue Hooks for Project Context

**Objective:** Modify issue hooks to work with project context.

**Files to Modify:**
- `frontend/src/hooks/useIssue.ts`
- `frontend/src/api/issueApiClient.ts`

**Implementation Steps:**

1. **Update createIssue API function** in `issueApiClient.ts`:
   
   **No changes needed** - already accepts formData which will include project

2. **Update getAllIssues API function** in `issueApiClient.ts`:
   
   **Modify function signature** (line 25):
   ```typescript
   export const getAllIssues = async (
     accessToken: string,
     projectId?: string
   ): Promise<Issue[]> => {
     const url = projectId
       ? `/api/issues?projectId=${projectId}`
       : "/api/issues";
   
     return await axiosInstance
       .get(url, {
         headers: {
           Authorization: `Bearer ${accessToken}`,
         },
       })
       .then((response) => response.data)
       .catch(() => {
         throw new Error("Error with fetching all issues");
       });
   };
   ```

3. **Add getIssuesByProject API function** in `issueApiClient.ts`:
   
   **Add at end of file:**
   ```typescript
   export const getIssuesByProject = async (
     projectId: string,
     accessToken: string
   ): Promise<Issue[]> => {
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

4. **Update useGetAllIssues hook** in `useIssue.ts`:
   
   **Modify to accept optional projectId** (lines 86-102):
   ```typescript
   export const useGetAllIssues = (projectId?: string) => {
     const { getToken } = useAuth();
   
     return useQuery({
       queryKey: projectId
         ? ["project-issues", projectId]
         : [ISSUES_QUERY_KEY],
       queryFn: async () => {
         const accessToken = await getToken();
   
         if (!accessToken) {
           throw new Error("No authentication token available");
         }
         return getAllIssues(accessToken, projectId);
       },
       staleTime: 5 * 60 * 1000,
       refetchOnWindowFocus: false,
     });
   };
   ```

**How to Test:**
- TypeScript compilation
- Will be tested when integrated with pages

**What Success Looks Like:**
- Issues can be filtered by project
- Hooks accept project context
- No TypeScript errors

**Commit Message:**
```
feat(frontend): update issue hooks for project context

- Add optional projectId to useGetAllIssues
- Update getAllIssues API to accept projectId query param
- Add getIssuesByProject API function
- Support project-scoped issue queries
```

---

## Phase 3: Routing & Navigation

### Task 3.1: Update Router with Project-Based Routes

**Objective:** Add new project-based routes and update existing ones.

**Files to Modify:**
- `frontend/src/router/index.tsx`

**Implementation Steps:**

1. **Import ProjectsPage** (add to imports at top):
   ```typescript
   import ProjectsPage from "@/pages/projects/ProjectsPage";
   ```

2. **Update route structure** inside `createBrowserRouter`:
   
   **Keep existing `/projects` route** (already exists around line 50)
   
   **Update kanban routes** - replace existing kanban routes with:
   ```typescript
   {
     path: "/projects/:projectId/kanban",
     element: <KanbanPage type="active-board" />,
   },
   {
     path: "/projects/:projectId/backlog",
     element: <KanbanPage type="backlog" />,
   },
   {
     path: "/projects/:projectId/create-issue",
     element: <CreateIssuePage />,
   },
   {
     path: "/projects/:projectId/edit-issue/:issueCode",
     element: <IssueManagementPage />,
   },
   ```

3. **Keep old routes temporarily** for backward compatibility:
   ```typescript
   {
     path: "/kanban",
     element: <Navigate to="/projects" replace />,
   },
   {
     path: "/backlog",
     element: <Navigate to="/projects" replace />,
   },
   {
     path: "/create-issue",
     element: <Navigate to="/projects" replace />,
   },
   {
     path: "/edit-issue/:issueCode",
     element: <Navigate to="/projects" replace />,
   },
   ```

4. **Import Navigate** from react-router-dom:
   ```typescript
   import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
   ```

**How to Test:**
- Run dev server: `npm run dev`
- Navigate to routes manually
- Check browser console for errors

**What Success Looks Like:**
- New routes accessible
- Old routes redirect to projects page
- No console errors

**Commit Message:**
```
feat(frontend): update router with project-based routes

- Add /projects/:projectId/kanban and backlog routes
- Add /projects/:projectId/create-issue route
- Add /projects/:projectId/edit-issue/:issueCode route
- Redirect old routes to /projects page
```

---

### Task 3.2: Update Layout Header with Project Context

**Objective:** Show current project in header/breadcrumbs.

**Files to Modify:**
- `frontend/src/layouts/Layout.tsx` (or wherever header is)
- `frontend/src/components/common/Header.tsx` (if separate)

**Implementation Steps:**

1. **Check current header structure:**
   ```bash
   # Find header component
   find frontend/src -name "*Header*" -o -name "*Layout*"
   ```

2. **Add breadcrumb logic** (example implementation):
   
   **In header component:**
   ```typescript
   import { useParams, useLocation, Link } from "react-router-dom";
   import { useGetProject } from "@/hooks/useProject";
   
   // Inside component:
   const { projectId } = useParams();
   const location = useLocation();
   const { data: project } = useGetProject(projectId || "");
   
   const showProjectBreadcrumb = location.pathname.includes("/projects/") && projectId;
   ```

3. **Render breadcrumbs:**
   ```tsx
   {showProjectBreadcrumb && project && (
     <div className="flex items-center gap-2 text-sm">
       <Link to="/projects" className="hover:underline">
         Projects
       </Link>
       <span>/</span>
       <span className="font-medium">{project.name}</span>
     </div>
   )}
   ```

**Pattern Reference:**
- Check existing header/layout components
- Use consistent styling
- Keep it simple for now

**How to Test:**
- Navigate to project routes
- Verify breadcrumbs appear
- Click breadcrumb links

**What Success Looks Like:**
- Breadcrumbs show on project pages
- Links navigate correctly
- Styling matches app theme

**Commit Message:**
```
feat(frontend): add project breadcrumbs to header

- Show project name in header when on project pages
- Add breadcrumb navigation to projects list
- Use useParams and useGetProject for context
```

---

## Phase 4: Projects List Page

### Task 4.1: Implement ProjectTable Component

**Objective:** Create table to display projects.

**Files to Modify:**
- `frontend/src/components/projects/ProjectTable.tsx`

**Implementation Steps:**

1. **Replace stub with full implementation:**

```typescript
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import type { Project } from "@/types/projectTypes";

type Props = {
  projects: Project[];
};

const ProjectTable = ({ projects }: Props) => {
  const navigate = useNavigate();

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}/kanban`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No projects found. Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project._id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="max-w-md truncate">
                  {project.description}
                </TableCell>
                <TableCell>
                  {project.issues?.length || 0}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(project.lastUpdated), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProject(project.projectId)}
                  >
                    View Board
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectTable;
```

2. **Install date-fns if not already installed:**
   ```bash
   cd frontend
   npm install date-fns
   ```

**Pattern Reference:**
- Use shadcn/ui Table components
- Follow existing table patterns in codebase
- Keep styling consistent

**How to Test:**
- Will be tested when integrated with ProjectsPage
- Check TypeScript compilation

**What Success Looks Like:**
- Table renders projects correctly
- Empty state shows helpful message
- View Board button navigates correctly

**Commit Message:**
```
feat(frontend): implement ProjectTable component

- Display projects in table format
- Show name, description, issue count, last updated
- Add View Board button for navigation
- Handle empty state
```

---

### Task 4.2: Create CreateProjectForm Component

**Objective:** Build form for creating new projects.

**Files to Create:**
- `frontend/src/components/forms/CreateProjectForm.tsx`

**Implementation Steps:**

1. **Create new file** with full form implementation:

```typescript
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { Project } from "@/types/projectTypes";

type Props = {
  onSubmit: (formData: Omit<Project, "_id" | "projectId" | "users" | "issues" | "createdAt" | "lastUpdated">) => void;
  isLoading: boolean;
};

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Project description is required"),
});

type FormData = z.infer<typeof formSchema>;

const CreateProjectForm = ({ onSubmit, isLoading }: Props) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter project description"
                  {...field}
                  disabled={isLoading}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateProjectForm;
```

**Pattern Reference:**
- Follow same pattern as `IssueManagementForm.tsx`
- Use Zod for validation
- Use shadcn/ui form components

**How to Test:**
- TypeScript compilation
- Will be tested when integrated

**What Success Looks Like:**
- Form validates correctly
- Disabled state works
- Follows existing form patterns

**Commit Message:**
```
feat(frontend): create CreateProjectForm component

- Add form with name and description fields
- Use Zod validation
- Follow existing form patterns with shadcn/ui
```

---

### Task 4.3: Create CreateProjectDialog Component

**Objective:** Wrap form in modal dialog.

**Files to Create:**
- `frontend/src/components/projects/CreateProjectDialog.tsx`

**Implementation Steps:**

1. **Create new file:**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateProjectForm from "@/components/forms/CreateProjectForm";
import { useCreateProject } from "@/hooks/useProject";

import type { Project } from "@/types/projectTypes";

const CreateProjectDialog = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { mutateAsync: createProject, isPending } = useCreateProject();

  const handleSubmit = async (
    formData: Omit<Project, "_id" | "projectId" | "users" | "issues" | "createdAt" | "lastUpdated">
  ) => {
    try {
      const newProject = await createProject(formData);
      toast.success("Project created successfully");
      setOpen(false);
      navigate(`/projects/${newProject.projectId}/kanban`);
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your issues and kanban boards.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm onSubmit={handleSubmit} isLoading={isPending} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
```

**Pattern Reference:**
- Use shadcn/ui Dialog component
- Follow similar dialog patterns in codebase
- Navigate to new project after creation

**How to Test:**
- Will be tested when integrated
- Check TypeScript compilation

**What Success Looks Like:**
- Dialog opens/closes correctly
- Form submits and creates project
- Navigates to new project board

**Commit Message:**
```
feat(frontend): create CreateProjectDialog component

- Wrap CreateProjectForm in Dialog
- Handle project creation and navigation
- Show success/error toasts
```

---

### Task 4.4: Implement ProjectsPage

**Objective:** Complete the projects list page.

**Files to Modify:**
- `frontend/src/pages/projects/ProjectsPage.tsx`

**Implementation Steps:**

1. **Replace stub with full implementation:**

```typescript
import { useGetAllProjects } from "@/hooks/useProject";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProjectTable from "@/components/projects/ProjectTable";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

const ProjectsPage = () => {
  const { data: projects, isLoading } = useGetAllProjects();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and kanban boards
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ProjectTable projects={projects || []} />
      )}
    </div>
  );
};

export default ProjectsPage;
```

**How to Test:**
```bash
npm run dev
# Navigate to /projects
# Click "Create New Project"
# Fill form and submit
# Verify navigation to new project board
```

**What Success Looks Like:**
- Page loads projects
- Loading spinner shows while fetching
- Create button opens dialog
- Table displays projects

**Commit Message:**
```
feat(frontend): implement ProjectsPage

- Fetch and display all user projects
- Add create project button
- Show loading state
- Integrate ProjectTable and CreateProjectDialog
```

---

## Phase 4 Complete

**Verification Checklist:**
- [ ] ProjectTable displays projects correctly
- [ ] CreateProjectForm validates input
- [ ] CreateProjectDialog opens/closes
- [ ] ProjectsPage loads and displays data
- [ ] Can create new project
- [ ] Navigation works after creation
- [ ] All TypeScript compiles without errors

**Next Steps:**
Proceed to Part 3: Testing & Integration
