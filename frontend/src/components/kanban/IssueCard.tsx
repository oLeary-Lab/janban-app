import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DeleteIssueDialog from "@/components/kanban/DeleteIssueDialog";

import type { Issue } from "@/types/kanbanTypes";

type Props = {
  issue: Issue;
  projectId: string;
  handleDeleteIssue: (issue: Issue) => void;
};

const IssueCard = ({ issue, projectId, handleDeleteIssue }: Props) => {
  const [mouseIsOver, setMouseIsOver] = useState<boolean>(false);

  const {
    setNodeRef: setDraggableNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.issueCode,
    data: {
      type: "Issue",
      issue,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform) ?? undefined,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      data-issue-id={issue.issueCode}
      onMouseEnter={() => setMouseIsOver(true)}
      onMouseLeave={() => setMouseIsOver(false)}
      ref={setDraggableNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex min-h-24 cursor-grab flex-col items-start rounded-xl bg-indigo-800 p-2.5 text-left text-xs text-white hover:ring-2 hover:ring-inset hover:ring-amber-100`}
    >
      <Link to={`/projects/${projectId}/edit-issue/${issue.issueCode}`}>
        <p className="text-sm font-bold underline hover:text-amber-400">
          {issue.issueCode}
        </p>
      </Link>
      <p>{issue.name}</p>
      <br />
      <p className="font-bold underline">Assignee:</p>
      <div className="flex w-full items-center justify-between gap-2">
        <p className="w-1/2">{issue.assignee}</p>
        {mouseIsOver && (
          <AlertDialog>
            <AlertDialogTrigger className="bg-lloyds-green mr-2 w-4 text-xs text-white hover:cursor-pointer hover:bg-indigo-800 hover:text-red-500">
              <TrashIcon className="h-4" />
            </AlertDialogTrigger>
            <DeleteIssueDialog
              issue={issue}
              handleDeleteIssue={handleDeleteIssue}
            />
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
