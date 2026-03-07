import { SortableContext } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";

import IssueCard from "@/components/kanban/IssueCard";

import type { Column, Issue } from "@/types/kanbanTypes";

type Props = {
  column: Column;
  projectId: string;
  issues?: Issue[];
  handleDeleteIssue: (issue: Issue) => void;
};

const KanbanColumnContainer = ({
  column,
  projectId,
  issues,
  handleDeleteIssue,
}: Props) => {
  const columnIssueIds: string[] = useMemo(() => {
    if (!issues) {
      return [""];
    }

    return issues.map((issue) => issue.issueCode);
  }, [issues]);

  const { isOver, setNodeRef: DroppableNodeRef } = useDroppable({
    id: column.columnId,
    data: {
      type: "Column",
      column,
    },
  });

  return (
    <div className="w-1/10 flex min-h-screen flex-col p-5">
      <div className="flex h-16 items-center justify-center rounded-t-md border border-b-2 border-amber-300 bg-indigo-600 p-2 text-xl font-bold text-white lg:text-sm xl:text-base">
        <h2>{column.title}</h2>
      </div>
      <SortableContext items={columnIssueIds}>
        <div
          ref={DroppableNodeRef}
          className={`flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden border-2 bg-indigo-300 p-2 transition-all duration-75 ${
            isOver
              ? "border-amber-500 bg-slate-500 shadow-inner"
              : "border-amber-300"
          }`}
        >
          {issues?.map((issue) => (
            <IssueCard
              key={issue.issueCode}
              issue={issue}
              projectId={projectId}
              handleDeleteIssue={handleDeleteIssue}
            />
          ))}
        </div>
      </SortableContext>
      <div className="b-t-2 flex h-16 items-center justify-center rounded-b-md border border-amber-300 bg-indigo-600 p-2 text-xs font-bold text-white">
        <p>{column.title}</p>
      </div>
    </div>
  );
};

export default KanbanColumnContainer;
