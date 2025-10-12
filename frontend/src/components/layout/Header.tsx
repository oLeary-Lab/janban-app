import { Link, useParams, useLocation } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import { Button } from "@/components/ui/button";
import UserDropDownMenu from "@/components/layout/UserDropDownMenu";
import ModeToggle from "@/components/common/ModeToggle";
import { useTheme } from "@/contexts/ThemeProvider";
import { useGetProject } from "@/hooks/useProject";

const Header = () => {
  const { theme } = useTheme();
  const { projectId } = useParams();
  const location = useLocation();
  const { data: project } = useGetProject(projectId || "");

  const showProjectBreadcrumb =
    location.pathname.includes("/projects/") && projectId && project;

  return (
    <header
      className={`border-b-2 border-amber-300 py-10 text-white ${
        theme === "light" ? "bg-indigo-600" : "bg-indigo-900"
      }`}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-amber-300 hover:text-white"
          >
            Janban
          </Link>
          {showProjectBreadcrumb && (
            <div className="flex items-center gap-2 text-sm">
              <Link
                to="/projects"
                className="text-amber-200 hover:text-white hover:underline"
              >
                Projects
              </Link>
              <span className="text-amber-200">/</span>
              <span className="font-medium text-white">{project.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-5">
          <ModeToggle />

          {/* Dynamic rendering from Clerk */}
          <SignedIn>
            <UserDropDownMenu />
          </SignedIn>
          <SignedOut>
            <Link to="/sign-in">
              <Button
                data-testid="header-sign-in-link"
                className="bg-amber-300 font-bold text-black hover:bg-white"
              >
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
