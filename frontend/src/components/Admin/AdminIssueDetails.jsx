import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getIssueById,
  getDistrictWorkers,
  assignIssueToWorker,
} from "../../services/api";
import {
  FaMapMarkerAlt,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "./AdminIssueDetails.css";

const AdminIssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Worker assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [assigningTo, setAssigningTo] = useState(null);
  const [deptFilter, setDeptFilter] = useState("All");

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

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res = await getDistrictWorkers();
      setWorkers(res.data);
      setFilteredWorkers(res.data);
    } catch (error) {
      console.error("Error fetching workers", error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    fetchWorkers();
  };

  const handleAssignWorker = async (workerId, workerName) => {
    setAssigningTo(workerName);
    try {
      const res = await assignIssueToWorker(id, workerId);
      if (res.data.success) {
        setIssue(res.data.issue);
        setShowAssignModal(false);
      } else {
        alert(res.data.message || "Failed to assign issue");
      }
    } catch (error) {
      console.error("Error assigning worker:", error);
      alert("Error assigning worker.");
    } finally {
      setAssigningTo(null);
    }
  };

  useEffect(() => {
    if (deptFilter === "All") {
      setFilteredWorkers(workers);
    } else {
      setFilteredWorkers(workers.filter((w) => w.department === deptFilter));
    }
  }, [deptFilter, workers]);

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
          <div className="issue-header-row2">
            <div className="status-section2">
              <span className={`status-badge1 ${issue.status}`}>
                {issue.status}
              </span>
              <span className="meta-item department-tag">
                🏷️ {issue.department}
              </span>
              <span className="meta-item assigned-to">
                Assigned:{" "}
                {issue.assignedWorker ? (
                  <span
                    className="assigned-user"
                    onClick={() =>
                      navigate(`/user/${issue.assignedWorker._id}`)
                    }
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {issue.assignedWorker.username}
                  </span>
                ) : (
                  "Unassigned"
                )}
              </span>

              <button
                className="view-location-btn"
                onClick={handleViewLocation}
              >
                📍 View Location
              </button>
              {!issue.assignedWorker && (
                <button
                  className="assign-worker-btn"
                  onClick={handleOpenAssignModal}
                >
                  👷 Assign Issue
                </button>
              )}
            </div>

            <span className="issue-district2">
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
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="assign-modal-overlay">
          {assigningTo ? (
            <div className="assign-modal-content loading-view">
              <div className="spinner"></div>
              <h2>Assigning issue to {assigningTo}...</h2>
            </div>
          ) : (
            <div className="assign-modal-content">
              <div className="modal-header">
                <h2>Assign Worker</h2>
                <button
                  className="close-modal-icon"
                  onClick={() => setShowAssignModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-filter">
                <label>Filter by Department:</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  {[...new Set(workers.map((w) => w.department))].map(
                    (dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="workers-list-container">
                {loadingWorkers ? (
                  <p>Loading workers...</p>
                ) : filteredWorkers.length > 0 ? (
                  <div className="workers-table">
                    <div className="workers-table-header">
                      <span>Name</span>
                      <span>Department</span>
                      <span>Solved</span>
                      <span>Unsolved</span>
                      <span>Action</span>
                    </div>
                    {filteredWorkers.map((worker) => (
                      <div key={worker.id} className="worker-row" style={{ opacity: worker.isLive ? 1 : 0.6 }}>
                        <span
                          className="worker-name"
                          onClick={() => navigate(`/user/${worker.id}`)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          {worker.name}
                          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: worker.isLive ? "#10b981" : "#64748b" }}>
                            {worker.isLive ? "🟢 Online" : "⚪ Offline"}
                          </span>
                        </span>
                        <span className="worker-dept">{worker.department}</span>
                        <span className="worker-stat solved">
                          {worker.solvedIssues}
                        </span>
                        <span className="worker-stat unsolved">
                          {worker.unsolvedIssues}
                        </span>
                        <button
                          className="assign-action-btn"
                          disabled={!worker.isLive}
                          style={{
                            backgroundColor: worker.isLive ? "#10b981" : "#e2e8f0",
                            color: worker.isLive ? "white" : "#94a3b8",
                            cursor: worker.isLive ? "pointer" : "not-allowed"
                          }}
                          onClick={() =>
                            handleAssignWorker(worker.id, worker.name)
                          }
                        >
                          {worker.isLive ? "Assign" : "Offline"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No workers found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdminIssueDetails;
