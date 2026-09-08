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
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "./IssueDetails.css";

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await getIssueById(id);
        setIssue(res.data);
      } catch (err) {
        console.error(
          "Failed to load issue:",
          err.response?.data || err.message
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
        err.response?.data?.message || err.message
      );
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await upvoteIssue(id); // Axios sends token via interceptor

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
      prev === 0 ? issue.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === issue.images.length - 1 ? 0 : prev + 1
    );
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

  if (loading) return <div>Loading...</div>;
  if (!issue) return <div>Issue not found</div>;

  return (
    <>
      <Navbar />
      <div className="issue-details-container">
        <div className="issue-main-card">
          <div className="issue-header-row1">
            <div className="status-section1">
              <div className={`status-badge1 ${issue.status}`}>
                {issue.status}
              </div>
              <button
                className="view-location-btn"
                onClick={handleViewLocation}
              >
                📍 View Location
              </button>
            </div>
            <span className="issue-district">
              {issue.location?.address?.split(",").pop()?.trim() ||
                issue.districtCode}
            </span>
          </div>
          <h1 className="issue-title">{issue.title}</h1>
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
        <div className="issue-details-comments">
          <div className="comments-header">
            <FaCommentDots style={{ marginRight: 8 }} />
            <span>
              Comments {issue.comments ? `(${issue.comments.length})` : ""}
            </span>
          </div>
          <div className="comments-list">
            {issue.comments && issue.comments.length > 0 ? (
              issue.comments.map((c, idx) => (
                <div key={idx} className="comment-block">
                  <div className="comment-avatar" />
                  <div className="comment-content">
                    <div className="comment-meta">
                      <span
                        className="comment-user"
                        onClick={() => navigate(`/user/${c.user._id}`)}
                      >
                        {c.user.username}
                      </span>
                      <span className="comment-date">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                </div>
              ))
            ) : (
              <div>No comments yet.</div>
            )}
          </div>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              required
              rows={3}
            />
            <button type="submit">
              <span style={{ marginRight: 6, display: "inline-block" }}>
                <svg width="18" height="18" fill="currentColor">
                  <path d="M2 16l14-7L2 2v5l10 2-10 2z" />
                </svg>
              </span>
              Post Comment
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default IssueDetails;
