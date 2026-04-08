import { Link } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import { FolderKanban } from "lucide-react";
import { RiKanbanView2 } from "react-icons/ri";
import { MdOutlineTableRows } from "react-icons/md";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState } from "react";

const MainNavbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="self-stretch">
      {/* Vertical sidebar for md and larger screens */}
      <div className="hidden h-full lg:block">
        <div
          className={`${
            isCollapsed ? "w-16" : "min-w-36"
          } h-full border-r-2 border-gray-700 bg-amber-300 transition-all duration-300`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-1 rounded-full border border-gray-700 bg-amber-300 p-1 hover:bg-amber-400"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <div className="space-y-4 p-4">
            <nav className="space-y-6">
              <Link
                to="/"
                className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-110 hover:font-bold"
              >
                <AiOutlineHome
                  className={`text-2xl ${isCollapsed && "hover:scale-125"}`}
                />
                {!isCollapsed && <span className="text-lg">Home</span>}
              </Link>
              <Link
                to="/projects"
                className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-110 hover:font-bold"
              >
                <FolderKanban
                  className={`text-2xl ${isCollapsed && "hover:scale-125"}`}
                />
                {!isCollapsed && <span className="text-lg">Projects</span>}
              </Link>
              <Link
                to="/projects/:projectId/kanban"
                className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-110 hover:font-bold"
              >
                <RiKanbanView2
                  className={`text-2xl ${isCollapsed && "hover:scale-125"}`}
                />
                {!isCollapsed && <span className="text-lg">Kanban</span>}
              </Link>

              <Link
                to="/projects/:projectId/backlog"
                className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-110 hover:font-bold"
              >
                <MdOutlineTableRows
                  className={`text-2xl ${isCollapsed && "hover:scale-125"}`}
                />
                {!isCollapsed && <span className="text-lg">Backlog</span>}
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Horizontal bar for small screens */}
      <div className="w-full lg:hidden">
        <div className="h-auto border-b-2 border-gray-700 bg-amber-300">
          <nav className="flex items-center justify-evenly p-2">
            <Link
              to="/"
              className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-125"
            >
              <AiOutlineHome className="text-2xl" />
            </Link>
            <Link
              to="/projects"
              className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-125 hover:font-bold"
            >
              <FolderKanban className="text-2xl" />
            </Link>
            <Link
              to="/projects/:projectId/kanban"
              className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-125 hover:font-bold"
            >
              <RiKanbanView2 className="text-2xl" />
            </Link>

            <Link
              to="/projects/:projectId/backlog"
              className="flex transform items-center gap-2 text-black transition-transform duration-150 hover:scale-125 hover:font-bold"
            >
              <MdOutlineTableRows className="text-2xl" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MainNavbar;
