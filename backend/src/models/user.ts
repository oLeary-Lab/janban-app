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

// Remove Mongoose properties on response to frontend
UserSchema.set("toJSON", {
  transform: (_, returned) => {
    delete returned._id;
    delete returned.__v;
    return returned;
  },
});

const User = mongoose.model("User", UserSchema);

export default User;
