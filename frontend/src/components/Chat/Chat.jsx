import React, { useState, useEffect, useRef } from "react";
import { socketref as socket } from "../../socket"; 
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { getChatMessages } from "../../services/api";
import { BsCheck2All } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import "./Chat.css";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, receiverUser } = location.state || {};

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const bottomRef = useRef(null);

  const roomId =
    currentUser && receiverUser
      ? [currentUser._id, receiverUser._id].sort().join("-")
      : "";

  useEffect(() => {
    if (!currentUser || !receiverUser) {
      navigate("/");
      return;
    }


    socket.emit("join", { userId: currentUser._id });
    socket.emit("joinRoom", { roomId });
   
    const loadHistory = async () => {
      try {
        const res = await getChatMessages(currentUser._id, receiverUser._id);
        setChat(res.data);
        // This tells the server we have seen the messages from the other person
        socket.emit("messages_seen", {
          senderId: receiverUser._id,
          receiverId: currentUser._id,
        });
      } catch (err) {
        console.error(
          "Failed to load chat history:",
          err.response?.data || err.message
        );
      }
    };
    loadHistory();

    socket.on("receive_message", (data) => {
      // If we get a message from the person we are chatting with
      if (data.sender === receiverUser._id) {
        setChat((prev) => [...prev, { ...data, seen: true }]);
        // Immediately tell the server we've seen this new message
        socket.emit("messages_seen", {
          senderId: receiverUser._id,
          receiverId: currentUser._id,
        });
      }
    });

    // --- THIS IS THE CRITICAL PART ---
    socket.on("messages_seen_by_receiver", (data) => {
      // We check if the person who saw the messages (data.receiverId)
      // is the person we are currently chatting with (receiverUser._id)
      if (receiverUser && data.receiverId === receiverUser._id) {
        setChat((prevChat) =>
          prevChat.map((msg) =>
            // If it matches, update all OUR sent messages to be 'seen'
            msg.sender === currentUser._id ? { ...msg, seen: true } : msg
          )
        );
      }
    });

    return () => {
     socket.off("receive_message");
     socket.off("messages_seen_by_receiver");
    };
  }, [currentUser, receiverUser, roomId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      sender: currentUser._id,
      receiver: receiverUser._id,
      content: message,
      timestamp: new Date().toISOString(),
      seen: false,
    };

    socket.emit("send_message", { ...msgData, roomId });
    setChat((prev) => [...prev, msgData]);
    setMessage("");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Using 24-hour format for clarity
    });
  };

  // *** DATE SEPARATOR LOGIC ***
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="chat-page-container">
      <Navbar />
      <div className="chat-container">
        <div className="chat-header">
          <img
            src={receiverUser?.profileImage || "https://via.placeholder.com/40"}
            alt="avatar"
            className="chat-avatar"
          />
          <div className="chat-user-info">
            <span
              className="chat-user-button"
              onClick={() => navigate(`/user/${receiverUser?._id}`)}
            >
              {receiverUser?.username}
            </span>
            <span className="chat-user-status">Online</span>
          </div>
        </div>

        <div className="chat-messages">
          {chat.map((msg, index) => {
            // Check if we need to show a date separator
            const showDateSeparator =
              index === 0 ||
              !isSameDay(chat[index - 1]?.timestamp, msg.timestamp);

            return (
              <React.Fragment key={index}>
                {/* Conditionally render the date separator */}
                {showDateSeparator && (
                  <div className="date-separator">
                    <span>{formatDateSeparator(msg.timestamp)}</span>
                  </div>
                )}
                {/* Render the message bubble */}
                <div
                  className={`chat-bubble-wrapper ${
                    msg.sender === currentUser._id ? "sent" : "received"
                  }`}
                >
                  <div className="chat-bubble">
                    <div className="message-content">{msg.content}</div>
                    <div className="message-meta">
                      <span className="timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      {msg.sender === currentUser._id && (
                        <BsCheck2All
                          className={`message-tick ${
                            msg.seen ? "seen" : "unseen"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-button" onClick={sendMessage}>
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
