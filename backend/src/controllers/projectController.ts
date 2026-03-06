import { Request, Response } from "express";

import Project from "../models/project";
import Issue from "../models/issue";
import { validationResult } from "express-validator";

// "/api/projects/create-project"
export const createProject = async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const allProjects = await Project.find({});
    let count = allProjects.length;
    let isInDb = false;

    const project = new Project(req.body);

    do {
      project.projectId = generateProjectId(count);
      isInDb = await checkDatabaseForProjectId(project.projectId);
      count++;
    } while (isInDb);

    // Add creator to project's users array
    project.users = [req.userId as any];

    await project.save();

    return res.status(201).json(project);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "/api/projects"
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ users: req.userId });
    return res.status(200).json(projects);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "api/projects/:projectId"
export const getProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access
    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId,
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(project);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const existingProject = await Project.findOne({ projectId });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access
    const hasAccess = existingProject.users.some(
      (userId) => userId.toString() === req.userId,
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    existingProject.name = name;
    existingProject.description = description;

    await existingProject.save();

    return res.status(200).json(existingProject);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access
    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId,
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Count issues for this project
    const deletedIssueCount = await Issue.countDocuments({
      project: project._id,
    });

    // Delete all issues belonging to this project
    await Issue.deleteMany({ project: project._id });

    // Delete the project
    await Project.findOneAndDelete({ projectId });

    return res.status(200).json({
      message: "Project deleted successfully",
      deletedIssueCount,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "api/projects/:projectId/issue-count"
export const getProjectIssueCount = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access
    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId,
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const issueCount = await Issue.countDocuments({ project: project._id });

    return res.status(200).json({ issueCount });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const generateProjectId = (count: number) => {
  if (count === 0) {
    return "JP000001";
  }

  const prefix = "JP";
  const suffix = count.toString().padStart(6, "0");
  return `${prefix}${suffix}`;
};

const checkDatabaseForProjectId = async (projectId: string) => {
  const existingProject = await Project.findOne({ projectId });
  return !!existingProject;
};
