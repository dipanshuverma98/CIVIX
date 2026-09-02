import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamation, FaSpinner, FaCheck, FaRedo } from "react-icons/fa"; // Added FaRedo
import axios from "axios";
import { autoAssignIssues } from "../../services/api";
import "./AdminDashboard.css";
import Navbar from "../Navbar/Navbar";

const AdminDashboard = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null") || {};
  console.log("Current User in AdminDashboard:", currentUser);
  const isSuperAdmin = currentUser.role === "superadmin";
  const isAdmin = currentUser.role === "admin";

  const [issues, setIssues] = useState({
    unsolved: [],
    inProgress: [],
    solved: [],
    reReported: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("unsolved");

  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const navigate = useNavigate();

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/district/issues`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
    
        setIssues({
          ...response.data.data,
          reReported: response.data.data.reReported || [],
        });
      } else {
        setError(response.data.message || "Failed to fetch problems");
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowHeatmap = () => {
    // Combine all issues into one array, including reReported
    const allIssues = [
      ...issues.unsolved,
      ...issues.inProgress,
      ...issues.solved,
      ...issues.reReported,
    ];

    const heatmapData = allIssues
      .filter((issue) => issue.location)
      .map((issue) => ({
        id: issue._id,
        location: issue.location,
        status: issue.status,
        title: issue.title,
      }));

    navigate("/admin/heatmap", { state: { heatmapData } });
  };

  const handleAutoAssign = async () => {
    if (
      !window.confirm("Auto-assign unsolved and re-reported issues to workers?")
    )
      return;
    try {
      setLoading(true);
      setError(null);
      const res = await autoAssignIssues();
      if (res.data && res.data.success) {
        await fetchIssues();
        alert(res.data.message || "Auto-assign completed");
      } else {
        setError(res.data?.message || "Auto-assign failed");
      }
    } catch (err) {
      console.error("Auto-assign error:", err);
      setError(
        err.response?.data?.message || err.message || "Auto-assign failed",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleIssueClick = (issueId) => {
    navigate(`/admin/issue/${issueId}`);
  };

  const CircularProgress = ({ percentage, color, label, count, total }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-container">
        <svg className="circular-progress" width="180" height="180">
          <circle
            className="circle-bg"
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <circle
            className="circle-progress"
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
          <text
            x="90"
            y="80"
            textAnchor="middle"
            className="progress-count"
            fill={color}
          >
            {count}
          </text>
          <text
            x="90"
            y="105"
            textAnchor="middle"
            className="progress-total"
            fill="#6b7280"
          >
            of {total}
          </text>
        </svg>
        <p className="progress-label" style={{ color }}>
          {label}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-state">
            <FaSpinner className="spin-icon" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // 🔥 FILTERING RULES BASED ON SELECTED DEPARTMENT
  // ----------------------------------------------------------

  const filteredUnsolved = isSuperAdmin
    ? selectedDepartment === "all"
      ? issues.unsolved
      : issues.unsolved.filter((i) => i.department === selectedDepartment)
    : issues.unsolved;

  const filteredInProgress = isSuperAdmin
    ? selectedDepartment === "all"
      ? issues.inProgress
      : issues.inProgress.filter((i) => i.department === selectedDepartment)
    : issues.inProgress;

  const filteredSolved = isSuperAdmin
    ? selectedDepartment === "all"
      ? issues.solved
      : issues.solved.filter((i) => i.department === selectedDepartment)
    : issues.solved;

  // Filter re-reported array
  const filteredReReported = isSuperAdmin
    ? selectedDepartment === "all"
      ? issues.reReported
      : issues.reReported.filter((i) => i.department === selectedDepartment)
    : issues.reReported;

  // Total filtered issues
  const filteredTotal =
    filteredUnsolved.length +
    filteredInProgress.length +
    filteredSolved.length +
    filteredReReported.length;

  // Percentages for progress circles
  const unsolvedPercentage =
    filteredTotal > 0 ? (filteredUnsolved.length / filteredTotal) * 100 : 0;
  const inProgressPercentage =
    filteredTotal > 0 ? (filteredInProgress.length / filteredTotal) * 100 : 0;
  const solvedPercentage =
    filteredTotal > 0 ? (filteredSolved.length / filteredTotal) * 100 : 0;
  const reReportedPercentage =
    filteredTotal > 0 ? (filteredReReported.length / filteredTotal) * 100 : 0;

  // Set issues shown in the list
  const currentIssues =
    activeTab === "unsolved"
      ? filteredUnsolved
      : activeTab === "inProgress"
        ? filteredInProgress
        : activeTab === "solved"
          ? filteredSolved
          : filteredReReported;

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="total-issues">
            Total Issues: <strong>{filteredTotal}</strong>
          </p>

          {isAdmin ? (
            <div className="filter-container">
              <label className="filter-label">Department:</label>
              <div
                className="department-filter"
                style={{ padding: "10px 14px" }}
              >
                {currentUser.department || "Not assigned"}
              </div>
            </div>
          ) : (
            <div className="filter-container">
              <label className="filter-label">Filter By Department:</label>
              <select
                className="department-filter"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="Roads & Transport">Roads & Transport</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Electricity">Electricity</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Drainage & Sewerage">Drainage & Sewerage</option>
                <option value="Streetlights">Streetlights</option>
                <option value="Public Health & Sanitation">
                  Public Health & Sanitation
                </option>
                <option value="Parks & Trees">Parks & Trees</option>
                <option value="Pollution Control">Pollution Control</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Building & Construction">
                  Building & Construction
                </option>
                <option value="Others">Others</option>
              </select>
            </div>
          )}

          <div style={{ marginLeft: 16, display: "flex", gap: "10px" }}>
            {isSuperAdmin && (
              <button
                className="auth-button"
                onClick={() => navigate("/superadmin/manage-accounts")}
                style={{ backgroundColor: "#8b5cf6" }}
              >
                Manage Accounts
              </button>
            )}
            <button className="auth-button" onClick={handleAutoAssign}>
              Auto Assign
            </button>
            <button
              className="auth-button"
              onClick={handleShowHeatmap}
              style={{ backgroundColor: "#3b82f6" }}
            >
              Show Heatmap
            </button>
          </div>
        </div>

        {/* STATISTICS WITH FILTERING */}
        <div
          className="statistics-section"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            percentage={unsolvedPercentage}
            color="#ef4444"
            label="Unsolved"
            count={filteredUnsolved.length}
            total={filteredTotal}
          />
          <CircularProgress
            percentage={reReportedPercentage}
            color="#8b5cf6" // Purple for re-reported
            label="Re-Reported"
            count={filteredReReported.length}
            total={filteredTotal}
          />
          <CircularProgress
            percentage={inProgressPercentage}
            color="#f59e0b"
            label="In Progress"
            count={filteredInProgress.length}
            total={filteredTotal}
          />
          <CircularProgress
            percentage={solvedPercentage}
            color="#10b981"
            label="Solved"
            count={filteredSolved.length}
            total={filteredTotal}
          />
        </div>

        {/* ISSUE LIST */}
        <div className="issues-section">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "unsolved" ? "active" : ""}`}
              onClick={() => setActiveTab("unsolved")}
            >
              <FaExclamation />
              <span>Unsolved ({filteredUnsolved.length})</span>
            </button>

            <button
              className={`tab-button ${activeTab === "reReported" ? "active" : ""}`}
              onClick={() => setActiveTab("reReported")}
            >
              <FaRedo />
              <span>Re-Reported ({filteredReReported.length})</span>
            </button>

            <button
              className={`tab-button ${activeTab === "inProgress" ? "active" : ""}`}
              onClick={() => setActiveTab("inProgress")}
            >
              <FaSpinner />
              <span>In Progress ({filteredInProgress.length})</span>
            </button>

            <button
              className={`tab-button ${activeTab === "solved" ? "active" : ""}`}
              onClick={() => setActiveTab("solved")}
            >
              <FaCheck />
              <span>Solved ({filteredSolved.length})</span>
            </button>
          </div>

          <div className="issues-content">
            {currentIssues.length === 0 ? (
              <div className="empty-state">
                <p>No issues found for this filter.</p>
              </div>
            ) : (
              <div className="issues-grid">
                {currentIssues.map((issue, index) => (
                  <div
                    key={issue._id}
                    className="issue-card"
                    onClick={() => handleIssueClick(issue._id)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="issue-header">
                      <h3>{issue.title}</h3>
                      <span className={`status-badge ${activeTab}`}>
                        {activeTab === "inProgress"
                          ? "In Progress"
                          : activeTab === "reReported"
                            ? "Re-Reported"
                            : activeTab}
                      </span>
                    </div>

                    <p className="issue-description">
                      {issue.description?.substring(0, 150)}...
                    </p>

                    <div className="issue-footer">
                      <span className="issue-author">
                        By: {issue.createdBy?.username || "Unknown"}
                      </span>
                      <span className="issue-date">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
