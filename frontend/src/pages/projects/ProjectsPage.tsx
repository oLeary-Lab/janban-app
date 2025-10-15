import { useGetAllProjects } from "@/hooks/useProject";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProjectTable from "@/components/projects/ProjectTable";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

const ProjectsPage = () => {
  const { data: projects, isLoading } = useGetAllProjects();

  return (
    <div className="container mx-auto rounded-lg bg-indigo-100 p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold underline">Projects</h1>
          <p className="mt-1 text-sm italic">
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
