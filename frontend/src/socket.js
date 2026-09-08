// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;

let socket = null; // single instance

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket.off();
    socket = null; // clear reference
    console.log(" Socket disconnected manually");
  }
};

// Optional: lazy-init default instance
export const socketref = getSocket();
