const Notification = require("../models/Notification");

// ==============================
// Get unseen notifications
// ==============================
const getUnseenNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      read: false,
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching unseen notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==============================
// Mark a single notification as read & delete
// ==============================
const markNotificationReadAndDelete = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({ _id: id, user: req.user._id });

    res.status(200).json({
      success: true,
      message: "Notification marked read and deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUnseenNotifications,
  markNotificationReadAndDelete,
};
