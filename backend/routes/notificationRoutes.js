const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUnseenNotifications,
  markNotificationReadAndDelete,
} = require("../controllers/issue_notification");

// Protected routes
router.get("/unseen", protect, getUnseenNotifications);
router.delete("/:id/read", protect, markNotificationReadAndDelete);

module.exports = router;
