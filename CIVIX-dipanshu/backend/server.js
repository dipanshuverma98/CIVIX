require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const Message = require("./models/Message");
const User = require("./models/User"); // adjust path
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.frontendurl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to controllers
const socketHelper = require("./socket");
socketHelper.setIO(io);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", ({ userId }) => {
    socket.join(userId); // Each user joins their personal room
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId); // Join the private chat room
  });

  socket.on("send_message", async ({ sender, receiver, content, roomId }) => {
    if (!sender || !receiver || !content || !roomId) {
      console.warn("Missing required fields in message");
      return;
    }


    try {
      const newMessage = new Message({
        sender,
        receiver,
        content,
      });
      await newMessage.save();

      // 🟢 Fetch sender's username (so the receiver sees "New message from X")
      const senderUser = await User.findById(sender).select("username");

      const msgData = {
        sender,
        senderName: senderUser?.username || "Unknown User",
        receiver,
        content,
        timestamp: newMessage.createdAt,
      };

      // Emit to receiver
      io.to(receiver).emit("new_chat_message", msgData);

      // Emit to room for live chat
      io.to(roomId).emit("receive_message", msgData);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("messages_seen", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, seen: false },
        { $set: { seen: true } }
      );

      // Notify sender that their messages were seen
      io.to(senderId).emit("messages_seen_by_receiver", {
        senderId,
        receiverId,
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
