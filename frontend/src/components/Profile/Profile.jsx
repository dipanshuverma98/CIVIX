import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import "./Profile.css";
import {
  getUserProfile,
  updateprofilepic,
  updateUserBio,
  reReportIssue,
} from "../../services/api";
import { disconnectSocket } from "../../socket";
import { toast } from "react-toastify";
import { FaCamera, FaPen, FaSignOutAlt } from "react-icons/fa";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("issues");
  const [avatar, setAvatar] = useState(null);
  const [reReportModal, setReReportModal] = useState({
    open: false,
    issueId: null,
    reason: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser?._id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
        console.log("Fetched user profile:", res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    if (userId) fetchUserProfile();
  }, [userId]);

  const handlebiochange = () => {
    const newBio = prompt("Enter your new bio:", profile.bio || "");
    if (newBio !== null) {
      const toastid = toast.info("Updating bio...", { autoClose: false });

      updateUserBio(newBio)
        .then((res) => {
          toast.dismiss(toastid);
          setProfile((prev) => ({ ...prev, bio: newBio }));
          toast.success("Bio updated successfully!");
        })
        .catch((err) => {
          toast.dismiss(toastid);
          toast.error("Failed to update bio");
        });
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      const toastid = toast.info("Updating profile picture...", {
        autoClose: false,
      });

      updateprofilepic(file)
        .then((res) => {
          toast.dismiss(toastid);
          toast.success("Profile picture updated successfully!");
        })
        .catch((err) => {
          toast.dismiss(toastid);
          toast.error("Failed to update profile picture");
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    disconnectSocket();
    navigate("/");
  };

  const openReReportModal = (issueId) => {
    setReReportModal({ open: true, issueId, reason: "" });
  };

  const closeReReportModal = () => {
    setReReportModal({ open: false, issueId: null, reason: "" });
  };

  const submitReReport = async () => {
    const { issueId, reason } = reReportModal;
    if (!reason.trim()) {
      toast.error("Please provide a reason for re-reporting.");
      return;
    }
    const toastid = toast.info("Submitting re-report...", { autoClose: false });
    try {
      await reReportIssue(issueId, reason);
      toast.dismiss(toastid);
      toast.success("Re-report submitted successfully!");
      closeReReportModal();
    } catch (err) {
      toast.dismiss(toastid);
      toast.error("Failed to submit re-report.");
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />

      <div className="profile-page-wrapper">
        {!profile ? (
          /* Loading State */
          <div className="profile-loading-state">
            <div className="spinner"></div>
            <p>Loading Profile...</p>
          </div>
        ) : (
          /* Main Content */
          <div className="user-profile-container">
            {/* Header Card */}
            <div className="profile-header-card">
              <div className="profile-header-top">
                {/* Avatar Section */}
                <div className="avatar-section">
                  <div className="avatar-wrapper">
                    {profile.profileImage || avatar ? (
                      <img
                        src={avatar || profile.profileImage}
                        alt="Profile"
                        className="profile-avatar"
                      />
                    ) : (
                      <div className="default-avatar">
                        {profile.username?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Camera Overlay Button */}
                    <label className="avatar-edit-btn">
                      <FaCamera />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleProfilePicChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Info Section */}
                <div className="info-section">
                  <div className="name-row">
                    <h2>{profile.username}</h2>
                    <button className="logout-btn" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>

                  <div className="bio-container">
                    <p className="profile-bio">
                      {profile?.bio || "No bio yet. Tell us about yourself!"}
                    </p>
                    <button className="edit-bio-btn" onClick={handlebiochange}>
                      <FaPen />
                    </button>
                  </div>

                  <span className="joined-date">
                    Joined {new Date(profile.joined).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="profile-stats-row">
                <div className="stat-item">
                  <strong>{profile.unsolvedCount+profile.inProgressCount+profile.solvedCount+profile.re_reportedCount || 0}</strong>
                  <span>Total Issues</span>
                </div>
                <div className="stat-item">
                  <strong>{profile.unsolvedCount || 0}</strong>
                  <span>unsolved</span>
                </div>
                <div className="stat-item">
                  <strong>{profile.inProgressCount || 0}</strong>
                  <span>in progress</span>
                </div>
                <div className="stat-item">
                  <strong>{profile.solvedCount || 0}</strong>
                  <span>solved</span>
                </div>
                <div className="stat-item">
                  <strong>{profile.re_reportedCount || 0}</strong>
                  <span>re-reported</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <strong>{profile.comments.length || 0}</strong>
                  <span>Comments</span>
                </div>
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
              <button
                onClick={() => setTab("comments")}
                className={`tab-btn ${tab === "comments" ? "active" : ""}`}
              >
                Recent Comments
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
                          <div className="stats">
                            <span>👍 {issue.upvotes?.length || 0}</span>
                            <span>💬 {issue.comments?.length || 0}</span>
                          </div>
                          {issue.status === "solved" && (
                            <button 
                              className="rereport-btn"
                              onClick={() => openReReportModal(issue._id)}
                            >
                              Re-report
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No issues reported yet.</div>
                  )}
                </div>
              )}

{tab === "comments" && (
                <div className="list-grid">
                  {profile.comments && profile.comments.length > 0 ? (
                    profile.comments.map((comment) => (
                      <div key={comment._id} className="item-card comment">
                        <div className="card-header">
                          <span className="comment-badge">Comment</span>
                          <span className="card-date">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link 
                          to={`/issue/${comment.issue?._id || comment.issueId}`} 
                          className="card-title comment-title"
                        >
                          On: {comment.issue?.title || "Issue"}
                        </Link>
                        <p className="comment-text">"{comment.text}"</p>
                        <div className="card-footer">
                          <Link 
                            to={`/issue/${comment.issue?._id || comment.issueId}`}
                            className="view-issue-link"
                          >
                            View Issue →
                            </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No comments yet.</div>
                  )}
                </div>
              )}

            </div>

            {/* Re-Report Modal */}
            {reReportModal.open && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-card">
                  <h3>Re-report Issue</h3>
                  <p>Please provide a reason for re-reporting this issue:</p>
                  <textarea
                    value={reReportModal.reason}
                    onChange={(e) =>
                      setReReportModal((s) => ({ ...s, reason: e.target.value }))
                    }
                    placeholder="Enter your reason here..."
                    rows={4}
                    className="rereport-textarea"
                  />
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeReReportModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={submitReReport}>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;