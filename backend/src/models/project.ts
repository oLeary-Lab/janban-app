import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    projectId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "lastUpdated" } },
);

// Validate at least one user on create
ProjectSchema.pre("save", function (next) {
  if (this.users.length < 1) {
    next(new Error("A project must have at least one user"));
  } else {
    next();
  }
});

// Validate at least one user on update operations
ProjectSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;

  // Only validate if users array is being modified
  if (update.users && Array.isArray(update.users) && update.users.length < 1) {
    next(new Error("A project must have at least one user"));
  } else {
    next();
  }
});

// Remove Mongoose properties on response to frontend
ProjectSchema.set("toJSON", {
  transform: (_, returned) => {
    delete returned._id;
    delete returned.__v;
    return returned;
  },
});

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
