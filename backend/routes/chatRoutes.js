const express = require("express");
const router = express.Router();
const { getChatHistory } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// GET /chat-history - Get all users the current user has chatted with
router.get("/", protect, getChatHistory);

module.exports = router;
