const User = require("../models/User");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");
const socketHelper = require("../socket");
const sendEmail = require("../utils/sendEmail");



const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.params.workerId || req.user._id;

    // 1. Get ONLY the worker's basic info
    const worker = await User.findById(workerId)
      .select("_id username email createdAt bio profileImage state districtName department totalAssigned isLive");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // 2. Fetch issues: Combine 'unsolved' and 'in-progress' into a single query
    const [unsolved, solved, reReported] = await Promise.all([
      
      // Grabs both statuses, but we assign it to the 'unsolved' variable
      Issue.find({ 
        assignedWorker: workerId, 
        status: { $in: ["unsolved", "in progress"] } 
      })
        .select("title status department createdAt assignedAt location")
        .sort({ updatedAt: -1 }), 
        
      Issue.find({ assignedWorker: workerId, status: "solved" })
        .select("title status department createdAt solvedAt location")
        .sort({ solvedAt: -1 }),
        
      Issue.find({ assignedWorker: workerId, status: "re-reported" }) 
        .select("title status department createdAt reReports location")
        .sort({ updatedAt: -1 })
    ]);

    // 3. Return the combined data exactly how your frontend expects it
    res.json({
      _id: worker._id,
      username: worker.username,
      email: worker.email,
      joined: worker.createdAt,
      bio: worker.bio || "",
      profileImage: worker.profileImage || "",
      state: worker.state || null,
      districtName: worker.districtName || null,
      department: worker.department || null,
      totalAssigned: worker.totalAssigned || 0,
      isLive: worker.isLive || false,
      
      unsolved,   // Now contains BOTH unsolved and in-progress issues!
      solved,
      reReported  
    });

  } catch (err) {
    console.error("Get worker profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Worker updates status of an assigned issue (primarily to mark solved)
const update_issue_status = async (req, res) => {
  try {
    const issueId = req.params.issueId || req.params.id;
    const { status } = req.body;

    // Only allow workers to call this
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Worker access required" });
    }

    const workerId = req.user._id;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Ensure the issue is assigned to this worker
    if (
      !issue.assignedWorker ||
      issue.assignedWorker.toString() !== workerId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Issue not assigned to this worker" });
    }

    // Only support marking as solved via this endpoint for now
    if (status !== "solved") {
      return res.status(400).json({
        message:
          "Invalid status change. Workers may only mark issues as 'solved' here.",
      });
    }

    // 🔥 Capture the previous status BEFORE saving the new one
    const previousStatus = issue.status;

    // Update issue
    issue.status = "solved";
    issue.solvedAt = new Date();
    issue.updatedAt = new Date();
    await issue.save();

    // 🔥 Dynamically figure out which count to decrease
    let decrementField = "inProgressCount"; // default assumption
    if (previousStatus === "re-reported") {
      decrementField = "re_reportedCount";
    } else if (previousStatus === "in progress") {
      decrementField = "inProgressCount"; // just in case it was never marked in-progress
    }

    // Build the dynamic increment object
    const countUpdate = {
      [decrementField]: -1,
      solvedCount: 1,
    };

    // 🔥 1. Update Worker Counts
    await User.findByIdAndUpdate(workerId, {
      $inc: countUpdate,
    });

    // 🔥 2. Update Admin Counts
    const admin = await User.findOne({
      role: "admin",
      state: issue.state,
      districtCode: issue.districtCode,
    });
    if (admin) {
      await User.findByIdAndUpdate(admin._id, {
        $inc: countUpdate,
      });
    }

    // 🔥 3. Update User (Reporter) Counts
    if (issue.createdBy) {
      await User.findByIdAndUpdate(issue.createdBy, {
        $inc: countUpdate,
      });
    }

    // Notification to reporter
    await Notification.create({
      user: issue.createdBy,
      type: "issue",
      referenceId: issue._id,
      message: `Issue "${issue.title}" has been marked solved by the worker.`,
    });

    // Send Email to Reporter
    try {
      const user = await User.findById(issue.createdBy);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: "Issue Solved! - CIVIX",
          message: `
            <h3>Great news! Your issue "${issue.title}" has been resolved.</h3>
            <p>The assigned worker has marked this issue as <strong>Solved</strong>.</p>
            <p>Thank you for helping us improve our community.</p>
            <br/>
            <p>CIVIX Team</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email send error (issue solved):", emailErr);
    }

    // Emit real-time update to reporter and admin
    try {
      const io = socketHelper.getIO();
      const payload = {
        message: `Issue "${issue.title}" has been marked solved by the worker.`,
      };
      if (io) {
        // Notify reporter
        io.to(issue.createdBy.toString()).emit("issue_status_changed", payload);
      }
    } catch (emitErr) {
      console.error("Socket emit error (worker update):", emitErr);
    }

    res.json({ success: true, message: "Issue marked as solved", issue });
  } catch (err) {
    console.error("Worker update issue status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateLiveStatus = async (req, res) => {
  try {
    const { isLive } = req.body;
    if (typeof isLive !== "boolean") {
      return res.status(400).json({ message: "isLive parameter must be a boolean" });
    }

    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Only workers can set attendance status" });
    }

    const updatedWorker = await User.findByIdAndUpdate(
      req.user._id,
      { isLive },
      { new: true }
    ).select("_id username email role isLive");

    res.status(200).json({
      message: `Attendance marked ${isLive ? "Online" : "Offline"}`,
      user: updatedWorker,
    });
  } catch (err) {
    console.error("Update live status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getWorkerProfile,
  update_issue_status,
  updateLiveStatus,
};