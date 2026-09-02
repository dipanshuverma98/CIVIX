const express = require("express");
const router = express.Router();
const { protect, isSuperAdmin } = require("../middleware/authMiddleware");
const {
  createAccount,
  deleteAccount,
  getDistrictAccounts,
  resetPassword,
} = require("../controllers/superadminController");

// All routes are protected and restricted to Superadmins
router.use(protect);
router.use(isSuperAdmin);

router.post("/create-user", createAccount);
router.delete("/delete-user/:id", deleteAccount);
router.get("/district-accounts", getDistrictAccounts);
router.patch("/reset-password/:id", resetPassword);

module.exports = router;
