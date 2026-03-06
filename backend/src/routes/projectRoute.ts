import express from "express";
import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectIssueCount,
} from "../controllers/projectController";
import { getIssuesByProject } from "../controllers/issueController";
import { verifyAccessToken } from "../middleware/auth";
import { validateProjectCreation } from "../middleware/project";

const router = express.Router();

// "/api/projects"
router.post(
  "/create-project",
  verifyAccessToken,
  validateProjectCreation,
  createProject,
);
router.get("/", verifyAccessToken, getAllProjects);
router.get("/:projectId", verifyAccessToken, getProject);
router.get("/:projectId/issues", verifyAccessToken, getIssuesByProject);
router.get("/:projectId/issue-count", verifyAccessToken, getProjectIssueCount);
router.put("/:projectId", verifyAccessToken, updateProject);
router.delete("/:projectId", verifyAccessToken, deleteProject);

export default router;
