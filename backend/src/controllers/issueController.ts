import express, { Request, Response } from "express";
import { validationResult } from "express-validator";

import Issue from "../models/issue";
import Project from "../models/project";
import {
  checkDatabaseForJanbanId,
  generateJanbanId,
} from "../utils/controllerUtils";

// "/api/issues/create-issue"
export const createIssue = async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const { project: projectId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ message: `Project ${projectId} not found` });
    }

    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId
    );

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: `Access denied to project ${projectId}` });
    }

    const issue = new Issue(req.body);
    let count = await Issue.countDocuments();

    do {
      issue.issueCode = generateJanbanId("JI", count);
      count++;
    } while (
      await checkDatabaseForJanbanId(Issue, "issueCode", issue.issueCode)
    );

    await issue.save();

    // Add issue to project
    project.issues.push(issue._id);
    await project.save();

    return res.status(201).json(issue);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with issue creation" });
  }
};

// "/api/issues"
export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const userProjects = await Project.find({
      users: req.userId,
    }).select("_id");

    const projectIds = userProjects.map((project) => project._id);

    const issues = await Issue.find({
      project: { $in: projectIds },
    });

    return res.status(200).json(issues);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with retrieving all issues" });
  }
};

// "/api/issues/:issueCode"
export const getIssue = async (req: Request, res: Response) => {
  const { issueCode } = req.params;

  try {
    const issue = await Issue.findOne({ issueCode });

    if (!issue) {
      return res.status(404).json({ message: `Issue ${issueCode} not found` });
    }

    return res.status(200).json(issue);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Something went wrong with retrieving issue ${issueCode}`,
    });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  const { issueCode } = req.params;

  try {
    const {
      issueCategory,
      isBacklog,
      name,
      description,
      storyPoints,
      assignee,
      columnId,
    } = req.body;

    const existingIssue = await Issue.findOne({ issueCode });

    if (!existingIssue) {
      return res.status(404).json({ message: `Issue ${issueCode} not found` });
    }

    existingIssue.issueCategory = issueCategory;
    existingIssue.isBacklog = isBacklog;
    existingIssue.name = name;
    existingIssue.description = description;
    existingIssue.storyPoints = storyPoints;
    existingIssue.assignee = assignee;
    existingIssue.columnId = columnId;
    await existingIssue.save();

    return res.status(200).json(existingIssue);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Something went wrong with updating issue ${issueCode}`,
    });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  const { issueCode } = req.params;

  try {
    const result = await Issue.findOneAndDelete({ issueCode });

    if (!result) {
      return res.status(404).json({ message: `Issue ${issueCode} not found` });
    }

    return res
      .status(200)
      .json({ message: `Issue ${issueCode} deleted successfully` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Something went wrong with deleting issue ${issueCode}`,
    });
  }
};

// "/api/projects/:projectId/issues"
export const getIssuesByProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res
        .status(404)
        .json({ message: `Project ${projectId} not found` });
    }

    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId
    );

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: `Access denied to project ${projectId}` });
    }

    const issues = await Issue.find({ project: project._id });
    return res.status(200).json(issues);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Something went wrong with retrieving all issues for project ${projectId}`,
    });
  }
};
