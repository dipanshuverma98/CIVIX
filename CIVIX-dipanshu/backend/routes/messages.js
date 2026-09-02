const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort("createdAt");

    res.json(messages);
  } catch (error) {
    console.error("Failed to load messages", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
