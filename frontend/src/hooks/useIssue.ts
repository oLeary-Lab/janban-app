import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

import {
  createIssue,
  deleteIssue,
  getAllIssues,
  getIssue,
  updateIssue,
  updateIssueByFormData,
} from "@/api/issueApiClient";

import type { Issue } from "../types/kanbanTypes";

const ISSUES_QUERY_KEY = "issues";
const ISSUE_QUERY_KEY = "issue";
const PROJECT_ISSUES_QUERY_KEY = "project-issues";

export const useCreateIssue = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">,
    ) => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }

      return createIssue(formData, accessToken);
    },

    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: [ISSUES_QUERY_KEY] });
      const currentIssues = queryClient.getQueryData<Issue[]>([
        ISSUES_QUERY_KEY,
      ]);

      const optimisticIssue: Issue = {
        ...formData,
        _id: `temp-${Date.now()}`,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      queryClient.setQueryData<Issue[]>([ISSUES_QUERY_KEY], (old) => [
        ...(old || []),
        optimisticIssue,
      ]);

      return { currentIssues, tempId: optimisticIssue._id };
    },

    onSuccess: (newIssue, _, context) => {
      queryClient.setQueryData<Issue[]>(
        [ISSUES_QUERY_KEY],
        (old) =>
          old?.map((issue) =>
            issue._id === context?.tempId ? newIssue : issue,
          ) || [],
      );

      queryClient.setQueryData<Issue>(
        [ISSUE_QUERY_KEY, newIssue.issueCode],
        newIssue,
      );
    },

    onError: (err, _, context) => {
      console.log("Error creating issue:", err);
      queryClient.setQueryData([ISSUES_QUERY_KEY], context?.currentIssues);
    },

    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ISSUE_QUERY_KEY, data?.issueCode],
      });
    },
  });
};

export const useGetAllIssues = (projectId?: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: projectId
      ? [PROJECT_ISSUES_QUERY_KEY, projectId]
      : [ISSUES_QUERY_KEY],
    queryFn: async () => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      return getAllIssues(accessToken, projectId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useGetIssue = () => {
  const { getToken } = useAuth();
  const { issueCode } = useParams();

  return useQuery({
    queryKey: [ISSUE_QUERY_KEY, issueCode],
    queryFn: async () => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      return getIssue(issueCode!, accessToken);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useUpdateIssueByFormData = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">,
    ) => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      return updateIssueByFormData(formData, accessToken);
    },

    onMutate: async (formData) => {
      const queryId = formData.issueCode;

      await queryClient.cancelQueries({ queryKey: [ISSUES_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [ISSUE_QUERY_KEY, queryId],
      });

      const currentIssues = queryClient.getQueryData([ISSUES_QUERY_KEY]);
      const currentIssue = queryClient.getQueryData<Issue>([
        ISSUE_QUERY_KEY,
        queryId,
      ]);

      queryClient.setQueryData<Issue[]>(
        [ISSUES_QUERY_KEY],
        (old) =>
          old?.map((issue) =>
            issue.issueCode === queryId
              ? { ...issue, ...formData, lastUpdated: new Date() }
              : issue,
          ) || [],
      );

      queryClient.setQueryData<Issue>([ISSUE_QUERY_KEY, queryId], (old) =>
        old ? { ...old, ...formData, lastUpdated: new Date() } : old,
      );

      return { currentIssues, currentIssue };
    },

    onSuccess: (updatedIssue, { issueCode }) => {
      queryClient.setQueryData<Issue[]>(
        [ISSUES_QUERY_KEY],
        (old) =>
          old?.map((issue) =>
            issue.issueCode === issueCode ? updatedIssue : issue,
          ) || [],
      );

      queryClient.setQueryData<Issue>(
        [ISSUE_QUERY_KEY, issueCode],
        updatedIssue,
      );
    },

    onError: (err, { issueCode }, context) => {
      console.log("Error updating issue:", err);
      queryClient.setQueryData([ISSUES_QUERY_KEY], context?.currentIssues);
      queryClient.setQueryData(
        [ISSUE_QUERY_KEY, issueCode],
        context?.currentIssue,
      );
    },

    onSettled: (_, __, { issueCode }) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ISSUE_QUERY_KEY, issueCode],
      });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (issue: Issue) => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      return updateIssue(issue, accessToken);
    },

    onMutate: async (issue) => {
      const queryId = issue.issueCode;

      await queryClient.cancelQueries({ queryKey: [ISSUES_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [ISSUE_QUERY_KEY, queryId],
      });

      const currentIssues = queryClient.getQueryData([ISSUES_QUERY_KEY]);
      const currentIssue = queryClient.getQueryData<Issue>([
        ISSUE_QUERY_KEY,
        queryId,
      ]);

      queryClient.setQueryData<Issue[]>(
        [ISSUES_QUERY_KEY],
        (old) =>
          old?.map((oldIssue) =>
            oldIssue.issueCode === queryId
              ? { ...oldIssue, ...issue, lastUpdated: new Date() }
              : oldIssue,
          ) || [],
      );

      queryClient.setQueryData<Issue>([ISSUE_QUERY_KEY, queryId], (old) =>
        old ? { ...old, ...issue, lastUpdated: new Date() } : old,
      );

      return { currentIssues, currentIssue };
    },

    onError: (err, { issueCode }, context) => {
      console.log("Error updating issue:", err);
      queryClient.setQueryData([ISSUES_QUERY_KEY], context?.currentIssues);
      queryClient.setQueryData(
        [ISSUE_QUERY_KEY, issueCode],
        context?.currentIssue,
      );
    },

    onSettled: (_, __, { issueCode }) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ISSUE_QUERY_KEY, issueCode],
      });
    },
  });
};

export const useDeleteIssue = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issue: Issue) => {
      const accessToken = await getToken();

      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      return deleteIssue(issue, accessToken);
    },

    onMutate: async (issue) => {
      const queryId = issue.issueCode;

      await queryClient.cancelQueries({ queryKey: [ISSUES_QUERY_KEY] });
      await queryClient.cancelQueries({
        queryKey: [ISSUE_QUERY_KEY, queryId],
      });

      const currentIssues = queryClient.getQueryData([ISSUES_QUERY_KEY]);
      const currentIssue = queryClient.getQueryData<Issue>([
        ISSUE_QUERY_KEY,
        queryId,
      ]);

      queryClient.setQueryData<Issue[]>(
        [ISSUES_QUERY_KEY],
        (old) =>
          old?.filter((oldIssue) => oldIssue.issueCode !== queryId) || [],
      );

      queryClient.setQueryData([ISSUE_QUERY_KEY, queryId], null);

      return { currentIssues, currentIssue };
    },

    onError: (err, issue, context) => {
      console.log("Error deleting issue:", err);
      queryClient.setQueryData([ISSUES_QUERY_KEY], context?.currentIssues);
      queryClient.setQueryData(
        [ISSUE_QUERY_KEY, issue.issueCode],
        context?.currentIssue,
      );
    },

    onSettled: (_, __, issue) => {
      queryClient.invalidateQueries({ queryKey: [ISSUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ISSUE_QUERY_KEY, issue.issueCode],
      });
    },
  });
};
