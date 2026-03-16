import { check } from "express-validator";

export const validateProjectCreation = [
  check("name", "Project name must be a non-empty string")
    .notEmpty()
    .isString(),
  check("description", "Project description must be a non-emptny string")
    .notEmpty()
    .isString(),
];
