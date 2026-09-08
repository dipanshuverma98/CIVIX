import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ChatHistory.css"; // You can style it similarly to Chat.css
import Navbar from "../Navbar/Navbar";
import {getChatHistory} from "../../services/api";
const ChatHistory = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!currentUser || !token) return navigate("/login");

    const fetchHistory = async () => {
      try {
        const res = await getChatHistory(); 
        setUsers(res.data);
      } catch (err) {
        console.error(
          "Failed to fetch chat history:",
          err.response?.data || err.message
        );
      }
    };
    fetchHistory();
  }, [token, currentUser, navigate]);

  const handleStartChat = (receiverUser) => {
    navigate("/chat", {
      state: {
        currentUser,
        receiverUser,
      },
    });
  };

  return (
    <div>
        <Navbar/>
    <div className="chat-history-container">
      <h2>Chats</h2>
      {users.length === 0 ? (
        <p>No chats yet.</p>
      ) : (
        <ul className="chat-user-list">
          {users.map((user) => (
            <li key={user._id} onClick={() => handleStartChat(user)}>
              <span className="chat-user-avatar">
                {user.profileImage ? (
                  <img
                  
                    src={user.profileImage}
                    alt={user.username}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  user.username[0]
                )}
              </span>
              <span className="chat-username">{user.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
    </div>
  );
};

export default ChatHistory;
