import {
  generateJanbanId,
  checkDatabaseForJanbanId,
} from "../../src/utils/controllerUtils";

describe("generateJanbanId", () => {
  it("should return correct format when count is 0", () => {
    expect(generateJanbanId("JP", 0)).toBe("JP000001");
    expect(generateJanbanId("JI", 0)).toBe("JI000001");
    expect(generateJanbanId("J", 0)).toBe("J000001");
  });

  it("should return correct format for positive counts", () => {
    expect(generateJanbanId("JP", 1)).toBe("JP000001");
    expect(generateJanbanId("JP", 42)).toBe("JP000042");
    expect(generateJanbanId("JP", 123456)).toBe("JP123456");
    
    expect(generateJanbanId("JI", 1)).toBe("JI000001");
    expect(generateJanbanId("JI", 99)).toBe("JI000099");
    
    expect(generateJanbanId("J", 1)).toBe("J000001");
    expect(generateJanbanId("J", 5)).toBe("J000005");
  });

  it("should pad numbers correctly with 6 digits", () => {
    expect(generateJanbanId("JP", 1)).toBe("JP000001");
    expect(generateJanbanId("JP", 10)).toBe("JP000010");
    expect(generateJanbanId("JP", 100)).toBe("JP000100");
    expect(generateJanbanId("JP", 1000)).toBe("JP001000");
    expect(generateJanbanId("JP", 10000)).toBe("JP010000");
    expect(generateJanbanId("JP", 100000)).toBe("JP100000");
  });
});

describe("checkDatabaseForJanbanId", () => {
  const mockModel = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false if no document with the specified field value exists", async () => {
    mockModel.findOne.mockResolvedValue(null);

    const result = await checkDatabaseForJanbanId(
      mockModel,
      "projectId",
      "JP000001"
    );

    expect(mockModel.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
    expect(result).toBe(false);
  });

  it("should return true if document with the specified field value exists", async () => {
    mockModel.findOne.mockResolvedValue({ projectId: "JP000001" });

    const result = await checkDatabaseForJanbanId(
      mockModel,
      "projectId",
      "JP000001"
    );

    expect(mockModel.findOne).toHaveBeenCalledWith({ projectId: "JP000001" });
    expect(result).toBe(true);
  });

  it("should work with different field names", async () => {
    mockModel.findOne.mockResolvedValue(null);

    await checkDatabaseForJanbanId(mockModel, "issueCode", "JI000001");
    expect(mockModel.findOne).toHaveBeenCalledWith({ issueCode: "JI000001" });

    await checkDatabaseForJanbanId(mockModel, "racfid", "J000001");
    expect(mockModel.findOne).toHaveBeenCalledWith({ racfid: "J000001" });
  });

  it("should handle different models correctly", async () => {
    const mockProjectModel = { findOne: jest.fn().mockResolvedValue(null) };
    const mockIssueModel = { findOne: jest.fn().mockResolvedValue({ issueCode: "JI000001" }) };

    const projectResult = await checkDatabaseForJanbanId(
      mockProjectModel,
      "projectId",
      "JP000001"
    );
    const issueResult = await checkDatabaseForJanbanId(
      mockIssueModel,
      "issueCode",
      "JI000001"
    );

    expect(projectResult).toBe(false);
    expect(issueResult).toBe(true);
  });
});
