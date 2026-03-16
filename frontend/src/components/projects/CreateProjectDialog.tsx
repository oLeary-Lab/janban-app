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
    formData: Omit<
      Project,
      "projectId" | "users" | "issues" | "createdAt" | "lastUpdated"
    >,
  ) => {
    try {
      // Backend will auto-generate projectId and set users/issues
      const projectData = {
        ...formData,
        projectId: "",
        users: null,
        issues: null,
      };
      const newProject = await createProject(projectData);
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
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="border-amber-300 sm:max-w-[500px]">
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
