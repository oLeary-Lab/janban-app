import { Issue } from "./kanbanTypes";
import { User } from "./userTypes";

export type Project = {
  projectId: string;
  name: string;
  description: string;
  users: User[] | null;
  issues: Issue[] | null;
  createdAt: string;
  lastUpdated: string;
};

export type DeleteProjectResponse = {
  message: string;
  deletedIssueCount: number;
};

export type ProjectIssueCountResponse = {
  issueCount: number;
};
