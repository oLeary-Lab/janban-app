import { useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  useDeleteIssue,
  useGetAllIssues,
  useUpdateIssue,
} from "@/hooks/useIssue";
import { useGetProject } from "@/hooks/useProject";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import type { Issue } from "@/types/kanbanTypes";

type Props = {
  type: "active-board" | "backlog";
};

const KanbanPage = ({ type }: Props) => {
  const { projectId } = useParams();
  const { data: project } = useGetProject(projectId || "");
  const { data: issues, isLoading: isGetLoading } = useGetAllIssues(projectId);
  const { mutateAsync: updateIssue } = useUpdateIssue();
  const { mutateAsync: deleteIssue } = useDeleteIssue();

  const handleUpdateIssue = async (issueWithUpdatedData: Issue) => {
    try {
      await updateIssue(issueWithUpdatedData);
      toast.success("Issue updated");
    } catch (err) {
      console.log(err);
      toast.error("Error updating issue. Please try again");
    }
  };

  const handleDeleteIssue = async (issueToDelete: Issue) => {
    try {
      await deleteIssue(issueToDelete);
      toast.success("Issue deleted");
    } catch (err) {
      console.log(err);
      toast.error("Error deleting issue");
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
    <>
      <h1>{project ? `${project.name}: Kanban` : "Loading..."}</h1>
      {isGetLoading ? (
        <LoadingSpinner />
      ) : (
        <KanbanBoard
          type={type}
          projectId={projectId}
          issues={issues}
          handleUpdateIssue={handleUpdateIssue}
          handleDeleteIssue={handleDeleteIssue}
        />
      )}
    </>
  );
};

export default KanbanPage;
