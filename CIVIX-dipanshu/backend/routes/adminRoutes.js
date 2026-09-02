const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDistrictIssues,
  getDistrictStats,
  getDistrictWorkers,
  assignIssueToWorker,
} = require("../controllers/adminController");

const { autoAssignIssues } = require("../controllers/adminController");

// Admin routes
router.get("/district/issues", protect, getDistrictIssues);
router.get("/district/workers", protect, getDistrictWorkers);
router.post("/issues/auto-assign", protect, autoAssignIssues);
router.post("/issues/assign", protect, assignIssueToWorker);

module.exports = router;
