import { Request, Response } from "express";
import { validationResult } from "express-validator";

import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../../src/controllers/projectController";
import Project from "../../src/models/project";
import User from "../../src/models/user";

// ==== DEPENDENCY MOCKS ====

jest.mock("../../src/models/project");
jest.mock("../../src/models/user");
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("Project Controller", () => {
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

  describe("createProject", () => {
    it("should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: "Invalid" }],
      });

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: [{ msg: "Invalid" }],
      });
    });

    it("should create a project and return 201 with project data", async () => {
      const mockUser = {
        _id: "user123",
        projects: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProject = {
        _id: "project123",
        projectId: "JP000001",
        name: "Test Project",
        description: "Test Description",
        issues: [],
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        name: "Test Project",
        description: "Test Description",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.find as jest.Mock).mockResolvedValue([]);
      (Project as unknown as jest.Mock).mockImplementation(() => mockProject);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockProject.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(mockProject);
      expect(mockProject.projectId).toBe("JP000001");
      expect(mockProject.issues).toEqual([]);
    });

    it("should handle duplicate projectId and generate a new one", async () => {
      const mockUser = {
        _id: "user123",
        projects: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProject = {
        _id: "project123",
        projectId: "JP000002",
        name: "Test Project",
        description: "Test Description",
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date),
        issues: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        name: "Test Project",
        description: "Test Description",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      // Mock to simulate one existing project
      (Project.find as jest.Mock).mockResolvedValue([
        { projectId: "JP000001" },
      ]);
      (Project as unknown as jest.Mock).mockImplementation(() => mockProject);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // First check finds a duplicate, second check doesn't
      (Project.findOne as jest.Mock)
        .mockResolvedValueOnce({ projectId: "JP000001" })
        .mockResolvedValueOnce(null);

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockProject.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(mockProject);
      expect(mockProject.projectId).toBe("JP000002");
    });

    it("should return 500 if an error occurs", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      (Project.find as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });

    it("should add creator to project users and project to user projects", async () => {
      const mockUser = {
        _id: "user123",
        projects: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockProject = {
        _id: "project123",
        projectId: "JP000001",
        name: "Test Project",
        description: "Test Description",
        users: [],
        issues: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        name: "Test Project",
        description: "Test Description",
      };
      mockRequest.userId = "user123";

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (Project.find as jest.Mock).mockResolvedValue([]);
      (Project as unknown as jest.Mock).mockImplementation(() => mockProject);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockProject.users).toContain("user123");
      expect(mockUser.projects).toContain("project123");
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getAllProjects", () => {
    it("should return only projects where user is a member", async () => {
      const mockProjects = [
        { projectId: "JP000001", name: "Project 1", users: ["user123"] },
        { projectId: "JP000002", name: "Project 2", users: ["user123"] },
      ];

      mockRequest.userId = "user123";
      (Project.find as jest.Mock).mockResolvedValue(mockProjects);

      await getAllProjects(mockRequest as Request, mockResponse as Response);

      expect(Project.find).toHaveBeenCalledWith({ users: "user123" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockProjects);
    });

    it("should return 500 if an error occurs", async () => {
      (Project.find as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getAllProjects(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("getProject", () => {
    it("should return a project if found", async () => {
      const mockProject = {
        projectId: "JP000001",
        name: "Test Project",
        issues: [],
      };

      mockRequest.params = { projectId: "JP000001" };
      (Project.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject),
      });

      await getProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockProject);
    });

    it("should return 404 if project not found", async () => {
      mockRequest.params = { projectId: "JP000001" };
      (Project.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { projectId: "JP000001" };
      (Project.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database error")),
      });
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("updateProject", () => {
    it("should update and return project if found", async () => {
      const mockProject = {
        projectId: "JP000001",
        name: "Old Name",
        description: "Old Description",
        lastUpdated: new Date("2023-01-01"),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.params = { projectId: "JP000001" };
      mockRequest.body = {
        name: "New Name",
        description: "New Description",
      };

      (Project.findOne as jest.Mock).mockResolvedValue(mockProject);

      await updateProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
      expect(mockProject.name).toBe("New Name");
      expect(mockProject.description).toBe("New Description");
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockProject);
    });

    it("should return 404 if project not found", async () => {
      mockRequest.params = { projectId: "JP000001" };
      mockRequest.body = {
        name: "New Name",
        description: "New Description",
      };

      (Project.findOne as jest.Mock).mockResolvedValue(null);

      await updateProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { projectId: "JP000001" };
      mockRequest.body = {
        name: "New Name",
        description: "New Description",
      };

      (Project.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await updateProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });

  describe("deleteProject", () => {
    it("should delete and return success message if project found", async () => {
      mockRequest.params = { projectId: "JP000001" };

      (Project.findOneAndDelete as jest.Mock).mockResolvedValue({
        projectId: "JP000001",
      });

      await deleteProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOneAndDelete).toHaveBeenCalledWith({
        projectId: "JP000001",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project deleted successfully",
      });
    });

    it("should return 404 if project not found", async () => {
      mockRequest.params = { projectId: "JP000001" };

      (Project.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteProject(mockRequest as Request, mockResponse as Response);

      expect(Project.findOneAndDelete).toHaveBeenCalledWith({
        projectId: "JP000001",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Project not found",
      });
    });

    it("should return 500 if an error occurs", async () => {
      mockRequest.params = { projectId: "JP000001" };

      (Project.findOneAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await deleteProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong",
      });
    });
  });
});
