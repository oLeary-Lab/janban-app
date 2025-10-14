import { Request, Response } from "express";
import { validationResult } from "express-validator";

import {
  registerUser,
  getAllUsers,
  getUser,
  updateUser,
} from "../../src/controllers/userController";
import * as controllerUtils from "../../src/utils/controllerUtils";
import User from "../../src/models/user";

// ==== DEPENDENCY MOCKS ====

jest.mock("../../src/models/user");
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("User Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();
    responseObject = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObject;
    mockRequest = {};
  });

  // ==== TESTS ====

  describe("registerUser", () => {
    it("should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: "Invalid" }],
      });
      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: [{ msg: "Invalid" }],
      });
    });

    it("should return 401 if no clerkId in request body", async () => {
      mockRequest.body = {
        clerkId: "",
        email: "test@example.com",
        name: "John Doe",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should create user, and return 201", async () => {
      const newUser = {
        _id: "user123",
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "John Doe",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        clerkId: "clerk123",
        email: "test@example.com",
        name: "John Doe",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      // Mock User.findOne to return null (user not found)
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => newUser);

      // Simulate checkDatabaseForJanbanId to return false
      jest
        .spyOn(controllerUtils, "checkDatabaseForJanbanId")
        .mockResolvedValue(false);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(newUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(newUser);
    });

    it("should return user if pre-existing with 200", async () => {
      const existingUser = {
        _id: "user123",
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "John Doe",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        clerkId: "clerk123",
        email: "test@example.com",
        name: "John Doe",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(1);

      // Mock User.findOne to return existingUser
      (User.findOne as jest.Mock).mockResolvedValue(existingUser);
      (User as unknown as jest.Mock).mockImplementation(() => existingUser);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(existingUser);
    });

    it("should regenerate racfid if duplicate is found", async () => {
      const newUser = {
        _id: "user123",
        clerkId: "clerk123",
        racfid: "J000002",
        email: "test@example.com",
        name: "John Doe",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        clerkId: "clerk123",
        email: "test@example.com",
        name: "John Doe",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => newUser);

      // Simulate checkDatabaseForJanbanId: first call returns true (duplicate), second returns false (unique)
      jest
        .spyOn(controllerUtils, "checkDatabaseForJanbanId")
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(newUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith(newUser);

      // The racfid should have been regenerated (checkDatabaseForJanbanId called twice)
      expect(controllerUtils.checkDatabaseForJanbanId).toHaveBeenCalledTimes(2);
    });

    it("should return 500 if error occurs", async () => {
      mockRequest.body = {
        clerkId: "clerk123",
        email: "test@example.com",
        name: "John Doe",
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });
      (User.countDocuments as jest.Mock).mockRejectedValue(new Error("Database error"));
      jest.spyOn(console, "log").mockImplementation(() => {});

      await registerUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong with registration",
      });
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const users = [{ _id: "user1" }, { _id: "user2" }];
      (User.find as jest.Mock).mockResolvedValue(users);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(users);
    });

    it("should return 500 if error occurs", async () => {
      (User.find as jest.Mock).mockRejectedValue(new Error("Database error"));
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong with fetching users",
      });
    });
  });

  describe("getUser", () => {
    it("should return user if found", async () => {
      const user = { _id: "user123" };
      mockRequest.userId = "user123";
      (User.findById as jest.Mock).mockResolvedValue(user);

      await getUser(mockRequest as Request, mockResponse as Response);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(user);
    });

    it("should return 404 if user not found", async () => {
      mockRequest.userId = "nonexistent";
      (User.findById as jest.Mock).mockResolvedValue(null);

      await getUser(mockRequest as Request, mockResponse as Response);

      expect(User.findById).toHaveBeenCalledWith("nonexistent");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 if error occurs", async () => {
      mockRequest.userId = "user123";
      (User.findById as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await getUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong with fetching user",
      });
    });
  });

  describe("updateUser", () => {
    it("should update and return user if found", async () => {
      const user = {
        _id: "user123",
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "John Doe",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.userId = "user123";
      mockRequest.body = {
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "New Name",
      };

      (User.findById as jest.Mock).mockResolvedValue(user);

      await updateUser(mockRequest as Request, mockResponse as Response);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(user.racfid).toBe("J000001");
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("New Name");
      expect(user.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(user);
    });

    it("should return 404 if user not found", async () => {
      mockRequest.userId = "nonexistent";
      mockRequest.body = {
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "New Name",
      };

      (User.findById as jest.Mock).mockResolvedValue(null);

      await updateUser(mockRequest as Request, mockResponse as Response);

      expect(User.findById).toHaveBeenCalledWith("nonexistent");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 if error occurs", async () => {
      mockRequest.userId = "user123";
      mockRequest.body = {
        clerkId: "clerk123",
        racfid: "J000001",
        email: "test@example.com",
        name: "New Name",
      };

      (User.findById as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );
      jest.spyOn(console, "log").mockImplementation(() => {});

      await updateUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: "Something went wrong with updating user",
      });
    });
  });
});
