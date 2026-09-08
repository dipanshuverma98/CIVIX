import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";
import {
  getUserProfile,
  updateprofilepic,
  updateUserBio,
} from "../../services/api";
import { toast } from "react-toastify";
import { disconnectSocket } from "../../socket";
import {
  FaCamera,
  FaPen,
  FaSignOutAlt,
  FaBuilding,
  FaMapMarkerAlt,
} from "react-icons/fa";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser?._id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
        const total =
          (res.data.unsolvedCount || 0) +
          (res.data.inProgressCount || 0) +
          (res.data.solvedCount || 0);
        setTotalCount(total);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    if (userId) fetchUserProfile();
  }, [userId]);

  // --- Handlers ---
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const toastid = toast.info("Updating profile picture...", {
        autoClose: false,
      });
      setAvatar(URL.createObjectURL(file));

      updateprofilepic(file)
        .then(() => {
          toast.dismiss(toastid);
          toast.success("Profile picture updated successfully!");
        })
        .catch(() => {
          toast.dismiss(toastid);
          toast.error("Failed to update profile picture");
        });
    }
  };

  const handleBioChange = () => {
    const newBio = prompt("Enter your new bio:", profile.bio || "");
    if (newBio !== null) {
      const toastid = toast.info("Updating bio...", { autoClose: false });
      updateUserBio(newBio)
        .then(() => {
          toast.dismiss(toastid);
          setProfile((prev) => ({ ...prev, bio: newBio }));
          toast.success("Bio updated successfully!");
        })
        .catch(() => {
          toast.dismiss(toastid);
          toast.error("Failed to update bio");
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    navigate("/");
    toast.success("Logged out successfully!");
  };

  return (
    <>
      <Navbar />
      {/* Changed class name to prevent conflict */}
      <div className="admin-page-wrapper">
        {!profile ? (
          <div className="admin-loading-state">
            <div className="admin-spinner"></div>
            <p>Loading Worker Profile...</p>
          </div>
        ) : (
          /* Changed class name to prevent conflict */
          <div className="admin-profile-container">
            {/* Header Card */}
            <div className="admin-header-card">
              <div className="admin-header-top">
                {/* Avatar Section */}
                <div className="admin-avatar-section">
                  <div className="admin-avatar-wrapper">
                    {profile.profileImage || avatar ? (
                      <img
                        src={avatar || profile.profileImage}
                        alt="Profile"
                        className="admin-profile-avatar"
                      />
                    ) : (
                      <div className="admin-default-avatar">
                        {profile.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="admin-avatar-edit-btn">
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
                <div className="admin-info-section">
                  <div className="admin-name-row">
                    <h2>
                      {profile.username}{" "}
                      <span className="admin-role-badge">Admin</span>
                    </h2>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>

                  <div className="admin-bio-container">
                    <p className="admin-profile-bio">
                      {profile.bio ||
                        "Managing civic issues for a better community."}
                    </p>
                    <button
                      className="admin-edit-bio-btn"
                      onClick={handleBioChange}
                    >
                      <FaPen />
                    </button>
                  </div>

                  <div className="admin-location-info">
                    <span>
                      <FaMapMarkerAlt /> {profile.districtName || "District"},{" "}
                      {profile.state || "State"}
                    </span>
                    <span>
                      <FaBuilding /> Joined{" "}
                      {new Date(profile.joined).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="admin-stats-row">
                <div className="admin-stat-item">
                  <strong>{totalCount}</strong>
                  <span>Total Issues</span>
                </div>
                <div className="admin-stat-divider"></div>
                <div className="admin-stat-item text-red">
                  <strong>{profile.unsolvedCount || 0}</strong>
                  <span>Unsolved</span>
                </div>
                <div className="admin-stat-divider"></div>
                <div className="admin-stat-item text-green">
                  <strong>{profile.inProgressCount || 0}</strong>
                  <span>In Progress</span>
                </div>
                <div className="admin-stat-divider"></div>
                <div className="admin-stat-item text-red">
                  <strong>{profile.re_reportedCount || 0}</strong>
                  <span>Re reported</span>
                </div>
                <div className="admin-stat-divider"></div>
                <div className="admin-stat-item text-red">
                  <strong>{profile.solvedCount || 0}</strong>
                  <span>solved</span>
                </div>

              </div>
            </div>

            {/* Detailed Stats Section */}
            <div className="admin-details-card">
              <h3>District Performance Overview</h3>
              <div className="admin-details-grid">
                <div className="admin-detail-row">
                  <span className="label">State</span>
                  <span className="value">{profile.state}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="label">District</span>
                  <span className="value">{profile.districtName}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="label">Resolution Rate</span>
                  <span className="value">
                    {totalCount > 0
                      ? ((profile.solvedCount / totalCount) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProfile;
