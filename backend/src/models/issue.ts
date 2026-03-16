import mongoose from "mongoose";

export const issueCategoryEnum: string[] = ["Story", "Bug", "Task", "Spike"];
export const issueColumnIdEnum: string[] = [
  "blocked",
  "playReady",
  "inDevelopment",
  "testReady",
  "testInProgress",
  "demoReady",
  "complete",
];

const IssueSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    issueCategory: { type: String, required: true, enum: issueCategoryEnum },
    isBacklog: { type: Boolean, required: true },
    issueCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    storyPoints: { type: Number },
    assignee: { type: String },
    columnId: { type: String, required: true, enum: issueColumnIdEnum },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "lastUpdated" } },
);

// Remove Mongoose properties on response to frontend
IssueSchema.set("toJSON", {
  transform: (_, returned) => {
    delete returned._id;
    delete returned.__v;
    return returned;
  },
});

const Issue = mongoose.model("Issue", IssueSchema);

export default Issue;
