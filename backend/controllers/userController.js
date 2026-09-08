const User = require("../models/User");
const Issue = require("../models/Issue");
const uploadtos3 = require("../utils/s3Upload"); // Assuming this is a utility function to handle S3 uploads
// Make sure you have imported the Issue model at the top of your controller file
// const Issue = require("../models/Issue");

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Fetch user WITHOUT selecting the 'reports' array to save memory
    const user = await User.findById(userId).select(
      "role _id username email createdAt comments bio profileImage unsolvedIssues inProgressIssues solvedIssues state districtName unsolvedCount inProgressCount solvedCount re_reportedCount department",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Query reported issues only for citizen users
    let reportedIssues = [];
    if (user.role === "user") {
      reportedIssues = await Issue.find({ createdBy: userId }).sort({
        createdAt: -1,
      });
    }

    // 3. Calculate total upvotes from the directly queried issues
    const totalUpvotes = reportedIssues.reduce(
      (sum, issue) => sum + (issue.upvotes?.length || 0),
      0,
    );

    // 5. Send the response
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      joined: user.createdAt,
      issuesReported: reportedIssues.length,
      totalUpvotes: totalUpvotes,
      reportedIssues: reportedIssues,
      comments: user.comments, // 🔥 Sending the directly queried issues here
      bio: user.bio || "",
      profileImage: user.profileImage,
      unsolvedCount: user.unsolvedCount || 0,
      inProgressCount: user.inProgressCount || 0,
      solvedCount: user.solvedCount || 0,
      re_reportedCount: user.re_reportedCount || 0,
      state: user.state || null,
      districtName: user.districtName || null,
      department: user.department || null,
    });
  } catch (err) {
    console.error("Error in getUserProfile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getUserProfile }; // Or export const getUserProfile if using ES modules

const updateProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("Received file:", req.file);
    if (req.file) {
      user.profileImage = await uploadtos3(req.file);
    }

    await user.save();
    res.json({ message: "Profile picture updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateUserBio = async (req, res) => {
  try {
    const { bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bio = bio;
    await user.save();

    res.json({ message: "Bio updated successfully", bio: user.bio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const reReportIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!reason) {
      return res
        .status(400)
        .json({ message: "A reason is required to re-report an issue." });
    }

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    if (issue.status !== "solved") {
      return res.status(400).json({
        message:
          "Only solved issues can be re-reported. Current status is: " +
          issue.status,
      });
    }

    // Update the status and overwrite the re-report fields with the latest data
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      {
        status: "re-reported",
        reReportReason: reason,
        reReportedAt: new Date(),
        reReportedBy: userId,
      },
      { new: true },
    );

    // 🔥 1. Update the User (Reporter) Counts
    // Decrease solved count, increase re-reported count
    if (issue.createdBy) {
      await User.findByIdAndUpdate(issue.createdBy, {
        $inc: { solvedCount: -1, re_reportedCount: 1 },
      });
    }

    // 🔥 2. Update the Worker Counts
    // If a worker was assigned, update their metrics
    if (issue.assignedWorker) {
      await User.findByIdAndUpdate(issue.assignedWorker, {
        $inc: { solvedCount: -1, re_reportedCount: 1 },
      });
    }

    // 🔥 3. Update the Admin Counts
    // Find the admin responsible for this specific state and district
    const admin = await User.findOne({
      role: "admin",
      state: issue.state,
      districtCode: issue.districtCode,
    });

    if (admin) {
      await User.findByIdAndUpdate(admin._id, {
        $inc: { solvedCount: -1, re_reportedCount: 1 },
      });
    }

    return res.status(200).json({
      message: "Issue successfully re-reported.",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Re-report issue error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = { reReportIssue };

module.exports = {
  getUserProfile,
  updateProfilePic,
  updateUserBio,
  reReportIssue,
};
