import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
} from "@/api/projectApiClient";

import type { Project } from "@/types/projectTypes";

const PROJECTS_QUERY_KEY = "projects";
const PROJECT_QUERY_KEY = "project";

export const useCreateProject = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      formData: Omit<Project, "_id" | "createdAt" | "lastUpdated">,
    ) => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }

      return createProject(formData, accessToken);
    },

    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      const currentProjects = queryClient.getQueryData<Project[]>([
        PROJECTS_QUERY_KEY,
      ]);

      const optimisticProject: Project = {
        ...formData,
        projectId: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      queryClient.setQueryData<Project[]>([PROJECTS_QUERY_KEY], (old) => [
        ...(old || []),
        optimisticProject,
      ]);

      return { currentProjects, tempId: optimisticProject.projectId };
    },

    onSuccess: (newProject, _, context) => {
      queryClient.setQueryData<Project[]>(
        [PROJECTS_QUERY_KEY],
        (old) =>
          old?.map((project) =>
            project.projectId === context?.tempId ? newProject : project,
          ) || [],
      );
    },

    onError: (err, _, context) => {
      console.log("Error creating project:", err);
      queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });
};

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
              ? {
                  ...project,
                  ...formData,
                  lastUpdated: new Date().toISOString(),
                }
              : project,
          ) || [],
      );

      queryClient.setQueryData<Project>(
        [PROJECT_QUERY_KEY, projectId],
        (old) =>
          old
            ? { ...old, ...formData, lastUpdated: new Date().toISOString() }
            : old,
      );

      return { currentProjects, currentProject };
    },

    onSuccess: (updatedProject, { projectId }) => {
      queryClient.setQueryData<Project[]>(
        [PROJECTS_QUERY_KEY],
        (old) =>
          old?.map((project) =>
            project.projectId === projectId ? updatedProject : project,
          ) || [],
      );

      queryClient.setQueryData<Project>(
        [PROJECT_QUERY_KEY, projectId],
        updatedProject,
      );
    },

    onError: (err, { projectId }, context) => {
      console.log("Error updating project:", err);
      queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
      queryClient.setQueryData(
        [PROJECT_QUERY_KEY, projectId],
        context?.currentProject,
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
        (old) =>
          old?.filter((project) => project.projectId !== projectId) || [],
      );

      queryClient.setQueryData([PROJECT_QUERY_KEY, projectId], null);

      return { currentProjects, currentProject };
    },

    onError: (err, projectId, context) => {
      console.log("Error deleting project:", err);
      queryClient.setQueryData([PROJECTS_QUERY_KEY], context?.currentProjects);
      queryClient.setQueryData(
        [PROJECT_QUERY_KEY, projectId],
        context?.currentProject,
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
