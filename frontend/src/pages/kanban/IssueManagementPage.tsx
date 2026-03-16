import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import IssueManagementForm from "@/components/forms/IssueManagementForm";
import { useGetIssue, useUpdateIssueByFormData } from "@/hooks/useIssue";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import type { Issue } from "@/types/kanbanTypes";

const IssueManagementPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: currentIssue, isLoading: isGetLoading } = useGetIssue();
  const { mutateAsync: updateIssue, isPending: isUpdateLoading } =
    useUpdateIssueByFormData();

  const handleSave = async (
    formData: Omit<Issue, "_id" | "createdAt" | "lastUpdated">,
  ) => {
    try {
      await updateIssue(formData);
      toast.success("Issue successfully updated");
      if (projectId) {
        navigate(`/projects/${projectId}/kanban`);
      } else {
        navigate("/projects");
      }
    } catch (err) {
      console.log("Error updating issue:", err);
      toast.error("Error updating issue. Please try again");
    }
  };

  const handleCancel = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/kanban`);
    } else {
      navigate("/projects");
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
    <div className="mx-auto my-5 w-full rounded-lg border-2 border-amber-300 bg-indigo-100 p-10 sm:max-w-[90%]">
      <h1 className="mb-4 rounded-md bg-indigo-600 px-4 py-2 text-2xl font-bold text-white">
        Manage Issue
      </h1>
      <p className="mx-2 mb-4 text-sm italic">
        View and Edit an Issue's Details
      </p>
      {isGetLoading ? (
        <LoadingSpinner />
      ) : (
        <IssueManagementForm
          currentIssue={currentIssue}
          projectId={projectId}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isUpdateLoading}
        />
      )}
    </div>
  );
};

export default IssueManagementPage;
