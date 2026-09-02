const Issue = require("../models/Issue");
const User = require("../models/User");
const uploadToS3 = require("../utils/s3Upload"); // <-- Add this
const axios = require("axios");

const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      coordinates,
      address,
      state,
      districtName,
      department,
    } = req.body;

    if (!title || !description || !coordinates || !state || !districtName) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let coords = coordinates;
    if (typeof coordinates === "string") {
      try {
        coords = JSON.parse(coordinates);
      } catch (err) {
        return res.status(400).json({ message: "Invalid coordinates format" });
      }
    }

    // Ensure user is authenticated
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    // Find admin based on state + districtName
    const admin = await User.findOne({
      role: "admin",
      state: state,
      districtName,
      department: department || "Others",
    });

    if (!admin) {
      return res.status(404).json({
        message: `No admin found for ${districtName}, ${state}. Cannot create issue.`,
      });
    }

    // Upload images to S3
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToS3(file));
      imageUrls = await Promise.all(uploadPromises);
    }

    const newIssue = new Issue({
      title,
      description,
      images: imageUrls,
      location: {
        type: "Point",
        coordinates: coords,
        address: address || "",
      },
      state,
      districtName,
      // You should also save the admin's districtCode to the issue so it matches the admin dashboard filters!
      districtCode: admin.districtCode,
      createdBy: user._id,
      department: department || "Others",
      status: "unsolved", // explicitly defining it for clarity
    });

    // Save the new issue to the database
    await newIssue.save();

    // 🔥 Update Counts for User and Admin
    // Increase the unsolved count by 1 for the reporter
    await User.findByIdAndUpdate(user._id, {
      $inc: { unsolvedCount: 1 },
    });

    // Populate for the frontend response
    await newIssue.populate("createdBy", "username email");

    res.status(201).json({
      message: "Issue reported successfully",
      issue: newIssue,
    });
  } catch (error) {
    console.error("Create issue error:", error);
    res.status(500).json({
      message: "Server error while creating issue",
      error: error.message,
    });
  }
};

// Get all issues for public display (Unsolved & Re-Reported only, sorted by distance if lat/lng provided, and paginated)
const getAllIssues = async (req, res) => {
  try {
    const { state, districtName, lat, lng, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const matchQuery = {
      status: { $in: ["unsolved", "re-reported"] }
    };
    if (state) matchQuery.state = state;
    if (districtName) matchQuery.districtName = districtName;

    const totalIssues = await Issue.countDocuments(matchQuery);
    let issues = [];

    if (lat && lng) {
      // Geospatial aggregation
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance",
            query: matchQuery,
            spherical: true
          }
        },
        { $skip: skipNum },
        { $limit: limitNum }
      ];

      issues = await Issue.aggregate(pipeline);
      issues = await Issue.populate(issues, { path: "createdBy", select: "username" });
    } else {
      // Normal find sorted by newest
      issues = await Issue.find(matchQuery)
        .populate("createdBy", "username")
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);
    }

    res.status(200).json({
      issues,
      currentPage: pageNum,
      totalPages: Math.ceil(totalIssues / limitNum),
      totalIssues
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("createdBy", "username email _id")
      .populate("assignedWorker", "username email _id department")
      .populate({
        path: "comments.user",
        select: "username email _id",
      });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text required" });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    // Add to issue
    issue.comments.push(comment);
    await issue.save();

    // Add to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        comments: { issue: issue._id, text, createdAt: comment.createdAt },
      },
    });

    // Populate the user field for the new comment
    await issue.populate({
      path: "comments.user",
      select: "username email _id",
    });

    res
      .status(201)
      .json({ comment: issue.comments[issue.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const toggleUpvote = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const upvoteIndex = issue.upvotes.indexOf(req.user._id);

    if (upvoteIndex === -1) {
      // Add upvote
      issue.upvotes.push(req.user._id);
    } else {
      // Remove upvote
      issue.upvotes.splice(upvoteIndex, 1);
    }

    await issue.save();
    res.json({ upvotes: issue.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createIssue,
  getAllIssues, // Public issues
  getIssueById,
  addComment,
  toggleUpvote,
};
