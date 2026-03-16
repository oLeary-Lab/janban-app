import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import IssueManagementForm from "@/components/forms/IssueManagementForm";
import { useCreateIssue } from "@/hooks/useIssue";
import { useGetProject } from "@/hooks/useProject";

import type { Issue } from "@/types/kanbanTypes";

const CreateIssuePage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: project } = useGetProject(projectId || "");
  const { mutateAsync: createIssue, isPending: isLoading } = useCreateIssue();

  const handleSave = async (
    formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">,
  ) => {
    if (!project) {
      toast.error("Project not found");
      return;
    }

    try {
      const issueWithProject = { ...formData, projectId: project.projectId };
      const issue = await createIssue(issueWithProject);
      toast.success(`Issue ${issue.issueCode} created`);
      navigate(`/projects/${projectId}/kanban`);
    } catch (err) {
      console.log("Error creating issue:", err);
      toast.error("Error creating issue. Please try again");
    }
  };

  if (!projectId) {
    return (
      <div className="container mx-auto py-8">
        <p>
          No project selected. Please select a project from the Projects page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full rounded-lg border-2 border-amber-300 bg-indigo-100 p-10">
      <h1 className="mb-4 rounded-md bg-indigo-600 px-4 py-2 text-2xl font-bold text-white">
        Create Issue
      </h1>
      <IssueManagementForm
        onSave={handleSave}
        onCancel={() => navigate(`/projects/${projectId}/kanban`)}
        projectId={projectId}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CreateIssuePage;
