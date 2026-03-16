import { useGetAllProjects } from "@/hooks/useProject";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProjectTable from "@/components/projects/ProjectTable";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

const ProjectPage = () => {
  const { data: projects, isLoading } = useGetAllProjects();

  return (
    <div className="mx-auto my-5 rounded-lg border-2 border-amber-300 bg-indigo-100 p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mx-2 rounded-md bg-indigo-600 px-4 py-2 text-2xl font-bold text-white">
            Projects
          </h1>
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

export default ProjectPage;
