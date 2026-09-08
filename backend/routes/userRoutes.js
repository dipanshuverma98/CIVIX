const express = require("express");
const { getUserProfile } = require("../controllers/userController");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/upload");
const { updateProfilePic } = require("../controllers/userController");
const { updateUserBio } = require("../controllers/userController");
const { reReportIssue } = require("../controllers/userController");

router.get("/:userId", protect, getUserProfile);
router.post("/updateProfilePic", protect,upload.single("profilePic"), updateProfilePic);
router.patch("/updateBio", protect, updateUserBio);
router.patch("/reReport/:issueId", protect, reReportIssue);
module.exports = router;