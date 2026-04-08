import { useGetAllProjects } from "@/hooks/useProject";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProjectTable from "@/components/projects/ProjectTable";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";

const ProjectPage = () => {
  const { data: projects, isLoading } = useGetAllProjects();

  return (
    <div className="mx-auto my-5 rounded-lg border-2 border-amber-300 bg-indigo-100 p-5">
      <div className="mb-6 flex flex-col items-center justify-between">
        <h1 className="mx-2 rounded-md px-4 py-2 text-2xl font-bold underline">
          Projects
        </h1>
        <p className="mx-2 text-sm italic">
          Manage your projects and kanban boards
        </p>

        <CreateProjectDialog />
      </div>

      {/* {isLoading ? (
        <LoadingSpinner />
      ) : ( */}
      <ProjectTable projects={projects || []} />
      {/* )} */}
    </div>
  );
};

export default ProjectPage;
