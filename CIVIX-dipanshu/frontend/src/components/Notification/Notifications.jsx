import React, { useEffect, useState } from "react";
import { socketref as socket } from "../../socket"; 
import {
  getUnseenNotifications,
  markNotificationRead,
} from "../../services/api";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await getUnseenNotifications();
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for live notifications
    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const goToIssue = (notification) => {
    navigate(`/issue/${notification.referenceId}`);
  };

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="notifications-container">
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <p>No new notifications</p>
        ) : (
          <ul className="notifications-list">
            {notifications.map((n) => {
              // Optional: truncate message if too long
              const displayMessage = n.message;

              return (
                <li key={n._id} className="notification-item">
                  <span className="notification-text">{displayMessage}</span>
                  <div className="notification-buttons">
                    <button
                      className="mark-read-btn"
                      onClick={() => markAsRead(n._id)}
                    >
                      Mark Read
                    </button>
                    {n.referenceId && (
                      <button
                        className="view-issue-btn"
                        onClick={() => goToIssue(n)}
                      >
                        View Issue
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
