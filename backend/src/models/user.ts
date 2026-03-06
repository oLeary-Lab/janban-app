import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    racfid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordEnabled: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "lastUpdated" } },
);

const User = mongoose.model("User", UserSchema);

export default User;
