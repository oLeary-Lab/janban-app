import { check } from "express-validator";
import { issueCategoryEnum, issueColumnIdEnum } from "../models/issue";

export const validateIssueCreation = [
  check("issueCategory", "Issue category must be an non-empty string")
    .notEmpty()
    .isString(),
  check("issueCategory", "Issue category is not an allowed enum").isIn(
    issueCategoryEnum,
  ),
  check("isBacklog", "Issue backlog status must be a boolean")
    .exists()
    .isBoolean(),
  check("name", "Issue name must be an non-empty string").notEmpty().isString(),
  check("description", "Issue description must be an non-empty string")
    .notEmpty()
    .isString(),
  check(
    "storyPoints",
    "Story point data type must be a number if a value is provided",
  )
    .optional()
    .isNumeric(),
  check(
    "assignee",
    "Assignee data type must be an non-empty string if a value is provided",
  )
    .optional()
    .notEmpty()
    .isString(),
  check("columnId", "Issue status (columnId) must be an non-empty string")
    .notEmpty()
    .isString(),
  check("columnId", "Issue status (columnId) is not an allowed enum").isIn(
    issueColumnIdEnum,
  ),
];
