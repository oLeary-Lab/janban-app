import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "@/layouts/Layout";
import HomePage from "@/pages/landing/HomePage";
import SignInPage from "@/pages/auth/SignInPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import UserProfilePage from "@/pages/user/UserProfilePage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import KanbanPage from "@/pages/kanban/KanbanPage";
import CreateIssuePage from "@/pages/kanban/CreateIssuePage";
import IssueManagementPage from "@/pages/kanban/IssueManagementPage";
import UnderConstructionPage from "@/pages/UnderConstructionPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AuthRedirectPage from "@/pages/auth/AuthRedirectPage";
import ProjectPage from "@/pages/projects/ProjectPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },

      // Auth routes
      {
        path: "/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },

      // Protected routes
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          {
            path: "/auth-redirect",
            element: <AuthRedirectPage />,
          },
          {
            path: "/my-profile",
            element: <UserProfilePage />,
          },
          {
            path: "/projects",
            element: <ProjectPage />,
          },

          // Project-scoped routes
          {
            path: "/projects/:projectId/kanban",
            element: <KanbanPage type="active-board" />,
            handle: { layoutVariant: "kanban" },
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
        ],
      },

      // Redirect pages
      {
        path: "/under-construction",
        element: <UnderConstructionPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
