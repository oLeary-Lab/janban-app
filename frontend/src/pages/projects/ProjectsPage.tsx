import { useGetAllProjects } from "@/hooks/useProject";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProjectTable from "@/components/projects/ProjectTable";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

const ProjectsPage = () => {
  const { data: projects, isLoading } = useGetAllProjects();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-muted-foreground">
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
