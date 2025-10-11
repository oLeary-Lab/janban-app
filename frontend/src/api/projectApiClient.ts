import { axiosInstance } from "./axiosConfig";

import type { Issue } from "@/types/kanbanTypes";
import type { Project } from "@/types/projectTypes";

type DeleteProjectResponse = {
  message: string;
};

export const createProject = async (
  formData: Partial<Project>,
  accessToken: string,
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
  accessToken: string,
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
  accessToken: string,
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
  accessToken: string,
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
  accessToken: string,
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
  accessToken: string,
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
