import { Request, Response } from "express";
import { validationResult } from "express-validator";

import User from "../models/user";
import {
  checkDatabaseForJanbanId,
  generateJanbanId,
} from "../utils/controllerUtils";

// "/api/user/register"
export const registerUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const { clerkId, email } = req.body;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let count = await User.countDocuments();
    let user = await User.findOne({ email });

    if (user) {
      return res.status(200).json(user);
    }

    user = new User(req.body);

    do {
      user.racfid = generateJanbanId("J", count);
      count++;
    } while (await checkDatabaseForJanbanId(User, "racfid", user.racfid));

    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with registration" });
  }
};

// "/api/user/users"
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with fetching users" });
  }
};

// "/api/user/profile"
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with fetching user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name } = req.body;
    user.name = name;
    await user.save();
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong with updating user" });
  }
};
