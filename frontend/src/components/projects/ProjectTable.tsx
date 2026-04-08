import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import type { Project } from "@/types/projectTypes";

type Props = {
  projects: Project[];
};

const ProjectTable = ({ projects }: Props) => {
  const navigate = useNavigate();

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}/kanban`);
  };

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="rounded-t-md border border-b-2 border-amber-300 bg-indigo-600 font-bold text-white">
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg">
          {projects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.projectId}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="max-w-md truncate">
                  {project.description}
                </TableCell>
                <TableCell>{project.issues?.length || 0}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(project.lastUpdated), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    size="sm"
                    onClick={() => handleViewProject(project.projectId)}
                  >
                    View Board
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectTable;
