import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addComment } from "../../services/api";
import { getIssueById } from "../../services/api";
import { upvoteIssue } from "../../services/api";
import {
  FaMapMarkerAlt,
  FaThumbsUp,
  FaCommentDots,
  FaImage,
  FaRegThumbsUp,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaExclamationCircle,
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar";

const WorkerIssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showStatusModal, setShowStatusModal] = useState(false);
  // 🔥 NEW: Track if the status update is currently in progress
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await getIssueById(id);
        setIssue(res.data);
      } catch (err) {
        console.error(
          "Failed to load issue:",
          err.response?.data || err.message,
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchIssue();
  }, [id]);

  useEffect(() => {
    if (issue) {
      setHasUpvoted(issue.upvotes.includes(userId));
    }
  }, [issue, userId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await addComment(id, comment);
      const data = res.data;

      setIssue((prev) => ({
        ...prev,
        comments: [...prev.comments, data.comment],
      }));
      setComment("");
    } catch (err) {
      console.error(
        "Error submitting comment:",
        err.response?.data?.message || err.message,
      );
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await upvoteIssue(id);

      if (res.status === 200) {
        setIssue((prev) => ({
          ...prev,
          upvotes: hasUpvoted
            ? prev.upvotes.filter((uid) => uid !== userId)
            : [...prev.upvotes, userId],
        }));
        setHasUpvoted(!hasUpvoted);
      }
    } catch (error) {
      console.error("Error upvoting:", error.response?.data || error.message);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? issue.images.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === issue.images.length - 1 ? 0 : prev + 1,
    );
  };

  const handleStatusChange = async (newStatus) => {
    // 🔥 CHANGED: Set updating state to true before API call
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/worker/issues/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        setIssue((prev) => ({ ...prev, status: newStatus }));
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      // 🔥 CHANGED: Reset updating state after API call finishes (success or fail)
      setIsUpdatingStatus(false);
    }
  };

  const handleViewLocation = () => {
    const coords = issue.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    } else {
      alert("Location not available.");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <div className="spinner"></div>
          <p
            style={{ marginTop: "16px", color: "#6b7280", fontSize: "1.1rem" }}
          >
            Loading issue details...
          </p>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <Navbar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <h2 style={{ color: "#374151" }}>Issue not found</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="issue-details-container">
        {/* Status Change Modal Overlay */}
        {showStatusModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "400px",
                textAlign: "center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                Update Issue Status
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Select the current status for this issue.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* 🔥 CHANGED: Button styling, text, and disabled property based on isUpdatingStatus */}
                <button
                  onClick={() => handleStatusChange("solved")}
                  disabled={isUpdatingStatus}
                  style={{
                    padding: "12px",
                    backgroundColor: isUpdatingStatus ? "#9ca3af" : "#10b981", // Gray out if loading
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isUpdatingStatus ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isUpdatingStatus
                    ? "Updating issue status..."
                    : "Mark as Solved"}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={isUpdatingStatus}
                  style={{
                    padding: "12px",
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isUpdatingStatus ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    marginTop: "10px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="issue-main-card">
          <div className="issue-header-row2">
            <div className="status-section2">
              <span className={`status-badge1 ${issue.status}`}>
                {issue.status}
              </span>
              <span className="meta-item department-tag">
                🏷️ {issue.department}
              </span>

              {issue.status !== "solved" && (
                <button
                  className="change-status-btn"
                  onClick={() => setShowStatusModal(true)}
                >
                  <FaEdit /> Change Status
                </button>
              )}

              <button
                className="view-location-btn"
                onClick={handleViewLocation}
              >
                📍 View Location
              </button>
            </div>

            <span className="issue-district2">
              {issue.location?.address?.split(",").pop()?.trim() ||
                issue.districtCode}
            </span>
          </div>

          <h1 className="issue-title">{issue.title}</h1>

          {/* Re-Report Reason Box */}
          {issue.status === "re-reported" && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                borderLeft: "5px solid #ef4444",
                padding: "16px",
                marginBottom: "20px",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#b91c1c",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                <FaExclamationCircle style={{ marginRight: "8px" }} />
                This issue was Re-Reported
              </div>
              <p style={{ margin: 0, color: "#7f1d1d", fontSize: "0.95rem" }}>
                <strong>Reason: </strong>{" "}
                {issue.reReportReason || "No reason provided by the user."}
              </p>
            </div>
          )}

          <div className="issue-image-container issue-detail-image">
            {issue.images && issue.images.length > 0 ? (
              <>
                <div className="issue-image-large">
                  <img
                    src={issue.images[currentImageIndex]}
                    alt={issue.title}
                  />
                  {issue.images.length > 1 && (
                    <>
                      <button
                        className="image-nav-button prev"
                        onClick={handlePrevImage}
                        aria-label="Previous image"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        className="image-nav-button next"
                        onClick={handleNextImage}
                        aria-label="Next image"
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                </div>
                {issue.images.length > 1 && (
                  <div className="image-indicators">
                    {issue.images.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator-dot ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="image-placeholder">
                <FaImage />
                <span>No image available</span>
              </div>
            )}
          </div>
          <p className="issue-description">{issue.description}</p>
          <div className="issue-meta-row">
            <span className="meta-item">
              <FaMapMarkerAlt /> {issue.location?.address}
            </span>
            <span className="meta-item">
              <svg
                width="18"
                height="18"
                style={{ marginRight: 4 }}
                fill="#888"
              >
                <path d="M7 10h1V7h2v3h1v2H7v-2z" />
              </svg>
              {new Date(issue.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <hr className="issue-divider" />
          <div className="issue-footer-row">
            <div className="reporter-info">
              <div className="comment-avatar" />
              <div>
                <span
                  className="comment-user"
                  onClick={() => navigate(`/user/${issue.createdBy._id}`)}
                >
                  {issue.createdBy.username}
                </span>
                <div className="reporter-role">Reporter</div>
              </div>
            </div>
            <div className="issue-footer-stats">
              <span
                className={`upvote-button ${hasUpvoted ? "active" : ""}`}
                onClick={handleUpvote}
              >
                {hasUpvoted ? <FaThumbsUp /> : <FaRegThumbsUp />}{" "}
                {issue.upvotes?.length || 0}
              </span>
              <span>
                <FaCommentDots /> {issue.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkerIssueDetails;
