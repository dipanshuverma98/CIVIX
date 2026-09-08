import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar"; // Ensure correct path
import "./UserProfile.css";
import { getUserProfile } from "../../services/api";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("issues");

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    if (userId) fetchUserProfile();
  }, [userId]);

  const handleChatClick = () => {
    if (!currentUser || !profile) return;
    navigate("/chat", {
      state: {
        currentUser,
        receiverUser: profile,
      },
    });
  };

  // --- RENDER ---
  return (
    <>
      <Navbar /> {/* Navbar is always visible now */}
      <div className="profile-page-wrapper">
        {!profile ? (
          /* Loading State centered below Navbar */
          <div className="profile-loading-state">
            <div className="spinner"></div>
            <p>Loading Profile...</p>
          </div>
        ) : (
          /* Main Content */
          <div className="user-profile-container">
            {/* Header Section */}
            <div className="profile-header-card">
              <div className="profile-header-top">
                <div className="avatar-section">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="default-avatar">
                      {profile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="info-section">
                  <div className="name-row">
                    <h2>{profile.username}</h2>
                    {currentUser?._id !== profile._id && (
                      <button className="chat-btn" onClick={handleChatClick}>
                        Message
                      </button>
                    )}
                  </div>
                  <p className="profile-bio">
                    {profile?.bio || "CivicTracker Member"}
                  </p>
                  <span className="joined-date">
                    Joined {new Date(profile.joined).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="profile-stats-row">
                <div className="stat-item">
                  <strong>{profile.issuesReported || 0}</strong>
                  <span>Issues</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <strong>{profile.totalUpvotes || 0}</strong>
                  <span>Upvotes</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
              <button
                onClick={() => setTab("issues")}
                className={`tab-btn ${tab === "issues" ? "active" : ""}`}
              >
                Reported Issues
              </button>
            </div>

            {/* Content Area */}
            <div className="profile-content-area">
              {tab === "issues" && (
                <div className="list-grid">
                  {profile.reportedIssues?.length > 0 ? (
                    profile.reportedIssues.map((issue) => (
                      <div key={issue._id} className="item-card issue">
                        <div className="card-header">
                          <span className={`status-badge ${issue.status}`}>
                            {issue.status}
                          </span>
                          <span className="card-date">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link to={`/issue/${issue._id}`} className="card-title">
                          {issue.title}
                        </Link>
                        <div className="card-footer">
                          <span>👍 {issue.upvotes?.length || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No issues reported yet.</div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfile;
