const Message = require("../models/Message");
const User = require("../models/User");

exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    });

    const uniqueUserIds = new Set();

    messages.forEach((msg) => {
      const otherUserId =
        msg.sender.toString() === currentUserId.toString()
          ? msg.receiver.toString()
          : msg.sender.toString();
      uniqueUserIds.add(otherUserId);
    });

    const users = await User.find({
      _id: { $in: Array.from(uniqueUserIds) },
    }).select("_id username profileImage");

    res.json(users);
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ msg: "Failed to fetch chat history" });
  }
};

