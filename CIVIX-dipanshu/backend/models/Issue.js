const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: [String],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
      address: String,
    },
    districtCode: String,
    state: String,
    districtName: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "unsolved" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: Date,
      },
    ],
    department: String,
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedAt: Date,
    solvedAt: Date,
    reReportReason: String,
    reReportedAt: Date,
    reReportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

issueSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Issue", issueSchema);
