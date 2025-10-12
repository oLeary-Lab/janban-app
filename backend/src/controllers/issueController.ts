import express, { Request, Response } from "express";
import { validationResult } from "express-validator";

import Issue from "../models/issue";
import Project from "../models/project";
import { checkDatabaseForIssueCode, generateIssueCode } from "../utils/issue";

// "/api/issues/create-issue"
export const createIssue = async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const { project: projectId } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access to project
    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to project" });
    }

    const allIssues = await Issue.find({});
    let arrayLength = allIssues.length;

    const issue = new Issue(req.body);
    issue.issueCode = generateIssueCode(arrayLength);

    while (await checkDatabaseForIssueCode(Issue, issue.issueCode)) {
      arrayLength += 1;
      issue.issueCode = generateIssueCode(arrayLength);
    }

    await issue.save();

    // Add issue to project
    project.issues.push(issue._id);
    await project.save();

    return res.status(201).json(issue);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "/api/issues"
export const getAllIssues = async (req: Request, res: Response) => {
  try {
    // Get all projects user has access to
    const userProjects = await Project.find({
      users: req.userId,
    }).select("_id");

    const projectIds = userProjects.map((p) => p._id);

    // Only return issues from user's projects
    const issues = await Issue.find({
      project: { $in: projectIds },
    });

    return res.status(200).json(issues);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "/api/issues/:issueCode"
export const getIssue = async (req: Request, res: Response) => {
  try {
    const { issueCode } = req.params;

    const issue = await Issue.findOne({ issueCode });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    return res.status(200).json(issue);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { issueCode } = req.params;
    const { issueCategory, isBacklog, name, description, storyPoints, assignee, columnId } = req.body;

    const existingIssue = await Issue.findOne({ issueCode });

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
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
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { issueCode } = req.params;

    const result = await Issue.findOneAndDelete({ issueCode });

    if (!result) {
      return res.status(404).json({ message: "Issue not found" });
    }

    return res.status(200).json({ message: "Issue deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// "/api/projects/:projectId/issues"
export const getIssuesByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify user has access
    const hasAccess = project.users.some(
      (userId) => userId.toString() === req.userId
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch issues for this project
    const issues = await Issue.find({ project: project._id });
    return res.status(200).json(issues);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
