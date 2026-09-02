const Issue = require("../models/Issue");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

const getDistrictIssues = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId);

    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    // Fetch issues for the district; restrict by department for regular admins only
    const issueQuery = {
      state: admin.state,
      districtName: admin.districtName,
    };

    if (admin.role === "admin") {
      issueQuery.department = admin.department;
    }

    const allIssues = await Issue.find(issueQuery)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    // Group them manually in the controller
    const groupedIssues = {
      unsolved: allIssues.filter((issue) => issue.status === "unsolved"),
      inProgress: allIssues.filter((issue) => issue.status === "in progress"),
      solved: allIssues.filter((issue) => issue.status === "solved"),
      reReported: allIssues.filter((issue) => issue.status === "re-reported"),
      total: allIssues.length,
    };

    res.status(200).json({
      success: true,
      data: groupedIssues,
      message: "District issues retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Auto-assign unsolved issues to workers in the admin's district
const autoAssignIssues = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId);

    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    // 1. Fetch unsolved issues directly from the Issue collection
    const unsolvedIssues = await Issue.find({
      state: admin.state,
      districtName: admin.districtName,
      status: "unsolved",
    }).populate("createdBy", "username email");

    if (!unsolvedIssues.length) {
      return res
        .status(200)
        .json({ success: true, message: "No unsolved issues to assign" });
    }

    // 2. Find workers in the same district who are live/online
    const workers = await User.find({
      role: "worker",
      state: admin.state,
      districtName: admin.districtName,
      isLive: true,
    });

    if (!workers.length) {
      return res.status(400).json({
        success: false,
        message: "No workers available in this district",
      });
    }

    // Group workers by department
    const workersByDept = {};
    workers.forEach((w) => {
      const dept = w.department || "Others";
      if (!workersByDept[dept]) workersByDept[dept] = [];
      workersByDept[dept].push(w);
    });

    // Group issues by department
    const issuesByDept = {};
    unsolvedIssues.forEach((iss) => {
      const dept = iss.department || "Others";
      if (!issuesByDept[dept]) issuesByDept[dept] = [];
      issuesByDept[dept].push(iss);
    });

    const assignments = [];
    let assignedCount = 0; // Track how many issues actually get assigned

    // For each department, distribute issues among workers evenly
    for (const dept of Object.keys(issuesByDept)) {
      const deptIssues = issuesByDept[dept];
      const deptWorkers = workersByDept[dept] || [];

      if (!deptWorkers.length) {
        // skip if no workers for this department
        continue;
      }

      // Work on a shallow copy so we can mutate totalAssigned locally
      const pool = deptWorkers.map((w) => ({
        _id: w._id,
        totalAssigned: w.totalAssigned || 0,
      }));

      for (const issue of deptIssues) {
        // pick worker with smallest totalAssigned
        pool.sort((a, b) => a.totalAssigned - b.totalAssigned);
        const chosen = pool[0];

        // Update issue: assignedWorker, assignedAt, status -> in progress
        await Issue.findByIdAndUpdate(
          issue._id,
          {
            assignedWorker: chosen._id,
            assignedAt: new Date(),
            status: "in progress",
            updatedAt: new Date(),
          },
          { new: true },
        );

        // 🔥 3. Update worker counts instead of arrays
        // Increment totalAssigned and inProgressCount
        await User.findByIdAndUpdate(chosen._id, {
          $inc: {
            totalAssigned: 1,
            inProgressCount: 1,
          },
        });

        // Update local pool count
        pool[0].totalAssigned += 1;
        assignedCount++;

        // Send Email to User
        try {
          if (issue.createdBy && issue.createdBy.email) {
            await sendEmail({
              email: issue.createdBy.email,
              subject: "Update on your Issue - CIVIX",
              message: `
                <h3>Your issue "${issue.title}" has been assigned to a worker.</h3>
                <p>Status: <strong>In Progress</strong></p>
                <p>The assigned worker will visit the location soon.</p>
                <br/>
                <p>Regards,<br/>Team CIVIX</p>
              `,
            });
          }
        } catch (emailErr) {
          console.error("Email send error (auto-assign):", emailErr);
        }

        // Emit real-time assignment notification to the chosen worker
        try {
          const socketHelper = require("../socket");
          const io = socketHelper.getIO();
          const assignPayload = {
            issueId: issue._id,
            assignedAt: new Date(),
            title: issue.title,
            department: issue.department,
            message: `You have been assigned issue: ${issue.title}`,
          };
          if (io) {
            io.to(chosen._id.toString()).emit("issue_assigned", assignPayload);
          }
        } catch (emitErr) {
          console.error("Socket emit error (auto-assign):", emitErr);
        }

        assignments.push({ issueId: issue._id, workerId: chosen._id });
      }
    }


    res
      .status(200)
      .json({ success: true, message: "Auto-assign complete", assignments });
  } catch (error) {
    console.error("Auto assign error:", error);
    res.status(500).json({
      success: false,
      message: "Error during auto-assign",
      error: error.message,
    });
  }
};

const getDistrictWorkers = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const workers = await User.find({
      role: "worker",
      districtName: admin.districtName,
    });

    const workersData = await Promise.all(
      workers.map(async (worker) => {
        const solvedCount = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: "solved",
        });

        const unsolvedCount = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: { $ne: "solved" },
        });

        return {
          id: worker._id,
          name: worker.username,
          department: worker.department,
          solvedIssues: solvedCount,
          unsolvedIssues: unsolvedCount,
          isLive: worker.isLive || false,
        };
      }),
    );

    res.status(200).json(workersData);
  } catch (error) {
    console.error("Error fetching district workers:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const assignIssueToWorker = async (req, res) => {
  try {
    const { issueId, workerId } = req.body;
    const adminId = req.user._id;

    if (!issueId || !workerId) {
      return res.status(400).json({
        success: false,
        message: "Issue ID and Worker ID are required",
      });
    }

    // 1. Find the issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // 2. Find the worker
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res
        .status(404)
        .json({ success: false, message: "Worker not found" });
    }

    if (!worker.isLive) {
      return res.status(400).json({
        success: false,
        message: "Worker is currently offline/inactive and cannot be assigned tasks."
      });
    }

    // 3. Update Issue
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      {
        assignedWorker: workerId,
        status: "in progress",
        assignedAt: new Date(),
      },
      { new: true },
    );


    // 🔥 5. Update Worker Counts
    // Increase their total assigned count and in-progress count
    await User.findByIdAndUpdate(workerId, {
      $inc: {
        totalAssigned: 1,
        inProgressCount: 1,
      },
    });

    // 🔥 6. Update User (Reporter) Counts
    // Decrease unsolvedCount by 1, increase inProgressCount by 1
    if (issue.createdBy) {
      await User.findByIdAndUpdate(issue.createdBy, {
        $inc: {
          unsolvedCount: -1,
          inProgressCount: 1,
        },
      });
    }

    // 7. Notify Worker via Socket
    try {
      const socketHelper = require("../socket");
      const io = socketHelper.getIO();
      if (io) {
        io.to(workerId).emit("issue_assigned", {
          issueId: updatedIssue._id,
          title: updatedIssue.title,
          message: `You have been assigned a new issue: ${updatedIssue.title}`,
          assignedAt: updatedIssue.assignedAt,
        });
      }
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    // 8. Send Email to Issue Creator
    try {
      const user = await User.findById(issue.createdBy);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: "Issue Assigned - CIVIX",
          message: `
            <h3>Your issue "${issue.title}" has been assigned.</h3>
            <p>Worker <strong>${worker.username}</strong> has been assigned to resolve your issue.</p>
            <p>Status: <strong>In Progress</strong></p>
            <br/>
            <p>Thank you for using CIVIX.</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email send error (manual assign):", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Issue assigned successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error assigning issue:", error);
    res.status(500).json({
      success: false,
      message: "Server error during assignment",
    });
  }
};

module.exports = {
  getDistrictIssues,
  autoAssignIssues,
  getDistrictWorkers,
  assignIssueToWorker,
};
