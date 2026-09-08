import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaComments, FaUser, FaBell } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          CiviX
        </Link>

        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""
              }`}
          >
            <FaHome /> Issues
          </Link>
          {user.role === "user" && (
            <Link
              to="/report"
              className={`nav-link ${location.pathname === "/report" ? "active" : ""
                }`}
            >
              <FaPlus /> Report
            </Link>
          )}
          <Link
            to="/chat-history"
            className={`nav-link ${location.pathname === "/chat-history" ? "active" : ""
              }`}
          >
            <FaComments /> Chat
          </Link>
        </div>

        <div className="user-profile">
          {/* Notification button */}
          <button
            onClick={() => navigate("/notifications")}
            className="notification-button"
          >
            <FaBell />
          </button>

          {/* Profile button */}
          <button
            onClick={() => {
              if (user.role === "user") {
                navigate("/profile");
              } else if (user.role === "admin" || user.role === "superadmin") navigate("/admin/profile");
              else {
                navigate("/worker/profile");
              }
            }}
            className="profile-button"
          >
            <FaUser />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
