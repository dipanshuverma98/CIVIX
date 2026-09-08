const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const workerRoutes = require("./routes/workerRoutes");
const app = express();
app.use(
  cors({
    origin: process.env.frontendurl,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", require("./routes/messages"));
app.use("/api/chat-history", chatRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/superadmin", require("./routes/superadminRoutes"));

app.get("/", (req, res) => {
  res.send("Backend is running and HTTPS is working!");
});

module.exports = app;
