import { Request, Response } from "express";
import { validationResult } from "express-validator";

import {
  createIssue,
  getAllIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  getIssuesByProject,
} from "../../src/controllers/issueController";
import Issue from "../../src/models/issue";
import Project from "../../src/models/project";
import * as issueUtils from "../../src/utils/issue";

// ==== DEPENDENCY MOCKS ====

jest.mock("../../src/models/issue");
jest.mock("../../src/models/project");
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("Issue Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();
    responseObject = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObject;
    mockRequest = {
      body: {},
      params: {},
    };
  });

  // ==== TESTS ====

  describe("createIssue", () => {
    it("should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: "Invalid" }],
      });

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: [{ msg: "Invalid" }],
      });
    });

    it("should create an issue and return 201 with issue data", async () => {
      const mockProject = {
        _id: "project123",
        users: ["user123"],
        issues: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const newIssue = {
        _id: "issue123",
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        issueCode: "JI000001",
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockResolvedValue(mockProject);
      (Issue.find as jest.Mock).mockResolvedValue([]);
      (Issue as unknown as jest.Mock).mockImplementation(() => newIssue);

      // Simulate checkDatabaseForIssueCode to return false
      jest
        .spyOn(issueUtils, "checkDatabaseForIssueCode")
        .mockResolvedValue(false);

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(newIssue.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(newIssue);
    });

    it("should regenerate issueCode if duplicate is found", async () => {
      const mockProject = {
        _id: "project123",
        users: ["user123"],
        issues: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const newIssue = {
        _id: "issue123",
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        issueCode: "JI000002",
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockResolvedValue(mockProject);
      (Issue.find as jest.Mock).mockResolvedValue([]);
      (Issue as unknown as jest.Mock).mockImplementation(() => newIssue);

      // Simulate checkDatabaseForIssueCode: first call returns true (duplicate), second returns false (unique)
      jest
        .spyOn(issueUtils, "checkDatabaseForIssueCode")
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(newIssue.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(newIssue);

      // The issueCode should have been regenerated (checkDatabaseForRacfid called twice)
      expect(issueUtils.checkDatabaseForIssueCode).toHaveBeenCalledTimes(2);
    });

    it("should verify project exists and user has access before creating issue", async () => {
      const mockProject = {
        _id: "project123",
        projectId: "JP000001",
        users: ["user123"],
        issues: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const newIssue = {
        _id: "issue123",
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        issueCode: "JI000001",
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockResolvedValue(mockProject);
      (Issue.find as jest.Mock).mockResolvedValue([]);
      (Issue as unknown as jest.Mock).mockImplementation(() => newIssue);
      jest.spyOn(issueUtils, "checkDatabaseForIssueCode").mockResolvedValue(false);

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(Project.findById).toHaveBeenCalledWith("project123");
      expect(mockProject.issues).toContain("issue123");
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should return 404 if project does not exist", async () => {
      mockRequest.body = { project: "invalidProject" };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockResolvedValue(null);

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project not found",
      });
    });

    it("should return 403 if user does not have access to project", async () => {
      const mockProject = {
        _id: "project123",
        users: ["otherUser456"],
      };

      mockRequest.body = { project: "project123" };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockResolvedValue(mockProject);

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Access denied to project",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.body = {
        project: "project123",
        issueCategory: "Story",
        isBacklog: false,
        name: "Test Issue",
        description: "Test description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.findById as jest.Mock).mockRejectedValue(new Error("Database error"));
      jest.spyOn(console, "log").mockImplementation(() => {});

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("getAllIssues", () => {
    it("should return only issues from user's projects", async () => {
      const mockProjects = [
        { _id: "project123" },
        { _id: "project456" },
      ];

      const issues = [
        { _id: "issue1", issueCode: "JI000001", project: "project123" },
        { _id: "issue2", issueCode: "JI000002", project: "project456" },
      ];

      mockRequest.userId = "user123";

      (Project.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProjects),
      });
      (Issue.find as jest.Mock).mockResolvedValue(issues);

      await getAllIssues(mockRequest as Request, mockResponse as Response);

      expect(Project.find).toHaveBeenCalledWith({ users: "user123" });
      expect(Issue.find).toHaveBeenCalledWith({
        project: { $in: ["project123", "project456"] },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(issues);
    });

    it("should return 500 if an error occurs", async () => {
      (Project.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getAllIssues(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("getIssue", () => {
    it("should return the issue if found", async () => {
      const issue = { _id: "issue1", issueCode: "JI000001" };
      mockRequest.params = { issueCode: "JI000001" };

      (Issue.findOne as jest.Mock).mockResolvedValue(issue);

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOne).toHaveBeenCalledWith({ issueCode: "JI000001" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(issue);
    });

    it("should return 404 if issue not found", async () => {
      mockRequest.params = { issueCode: "nonexistent" };

      (Issue.findOne as jest.Mock).mockResolvedValue(null);

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOne).toHaveBeenCalledWith({ issueCode: "nonexistent" });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Issue not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { issueCode: "JI000001" };

      (Issue.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("updateIssue", () => {
    it("should update and return issue if found", async () => {
      const issue = {
        _id: "issue1",
        issueCode: "JI000001",
        issueCategory: "Story",
        isBacklog: false,
        name: "Original Issue",
        description: "Original description",
        storyPoints: 3,
        assignee: "User123",
        columnId: "playReady",
        lastUpdated: new Date("2023-01-01"),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.params = { issueCode: "JI000001" };
      mockRequest.body = {
        issueCategory: "Bug",
        isBacklog: true,
        name: "Updated Issue",
        description: "Updated description",
        storyPoints: 5,
        assignee: "User456",
        columnId: "inProgress",
      };

      (Issue.findOne as jest.Mock).mockResolvedValue(issue);

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOne).toHaveBeenCalledWith({ issueCode: "JI000001" });
      expect(issue.issueCategory).toBe("Bug");
      expect(issue.isBacklog).toBe(true);
      expect(issue.name).toBe("Updated Issue");
      expect(issue.description).toBe("Updated description");
      expect(issue.storyPoints).toBe(5);
      expect(issue.assignee).toBe("User456");
      expect(issue.columnId).toBe("inProgress");
      expect(issue.lastUpdated).toBeInstanceOf(Date);
      expect(issue.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(issue);
    });

    it("should return 404 if issue not found", async () => {
      mockRequest.params = { issueCode: "nonexistent" };
      mockRequest.body = {
        issueCategory: "Bug",
        isBacklog: true,
        name: "Updated Issue",
        description: "Updated description",
        storyPoints: 5,
        assignee: "User456",
        columnId: "inProgress",
      };

      (Issue.findOne as jest.Mock).mockResolvedValue(null);

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOne).toHaveBeenCalledWith({ issueCode: "nonexistent" });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Issue not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { issueCode: "JI000001" };
      mockRequest.body = {
        issueCategory: "Bug",
        isBacklog: true,
        name: "Updated Issue",
        description: "Updated description",
        storyPoints: 5,
        assignee: "User456",
        columnId: "inProgress",
      };

      (Issue.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("deleteIssue", () => {
    it("should delete issue and return success message", async () => {
      mockRequest.params = { issueCode: "JI000001" };

      const deletedIssue = { _id: "issue1", issueCode: "JI000001" };
      (Issue.findOneAndDelete as jest.Mock).mockResolvedValue(deletedIssue);

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOneAndDelete).toHaveBeenCalledWith({
        issueCode: "JI000001",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Issue deleted successfully",
      });
    });

    it("should return 404 if issue not found", async () => {
      mockRequest.params = { issueCode: "nonexistent" };

      (Issue.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(Issue.findOneAndDelete).toHaveBeenCalledWith({
        issueCode: "nonexistent",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Issue not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { issueCode: "JI000001" };

      (Issue.findOneAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("getIssuesByProject", () => {
    it("should return issues for a project if user has access", async () => {
      const mockProject = {
        _id: "project123",
        projectId: "JP000001",
        users: ["user123"],
      };

      const mockIssues = [
        { issueCode: "JI000001", project: "project123", name: "Issue 1" },
        { issueCode: "JI000002", project: "project123", name: "Issue 2" },
      ];

      mockRequest.params = { projectId: "JP000001" };
      mockRequest.userId = "user123";

      (Project.findOne as jest.Mock).mockResolvedValue(mockProject);
      (Issue.find as jest.Mock).mockResolvedValue(mockIssues);

      await getIssuesByProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
      expect(Issue.find).toHaveBeenCalledWith({ project: "project123" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockIssues);
    });

    it("should return 404 if project not found", async () => {
      mockRequest.params = { projectId: "JP999999" };

      (Project.findOne as jest.Mock).mockResolvedValue(null);

      await getIssuesByProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project not found",
      });
    });

    it("should return 403 if user does not have access to project", async () => {
      const mockProject = {
        _id: "project123",
        projectId: "JP000001",
        users: ["otherUser456"],
      };

      mockRequest.params = { projectId: "JP000001" };
      mockRequest.userId = "user123";

      (Project.findOne as jest.Mock).mockResolvedValue(mockProject);

      await getIssuesByProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Access denied",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { projectId: "JP000001" };

      (Project.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getIssuesByProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });
});
