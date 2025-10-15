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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="rounded-t-md border border-b-2 border-amber-300 bg-indigo-600 p-2 font-bold text-white">
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow className="bg-indigo-300">
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project._id}>
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
                    variant="outline"
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
