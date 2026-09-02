import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { getWorkerProfile, updateWorkerLiveStatus } from "../../services/api";
import { FaExclamation, FaCheck, FaSpinner, FaRedo } from "react-icons/fa"; // 🔥 Added FaRedo
import { toast } from "react-toastify";
import "./WorkerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("unsolved");
  const [isLive, setIsLive] = useState(false);

  const handleToggleLive = async () => {
    try {
      const newStatus = !isLive;
      await updateWorkerLiveStatus(newStatus);
      setIsLive(newStatus);
      toast.success(newStatus ? "You are now ONLINE / Ready for tasks" : "You are now OFFLINE / Inactive");
      
      const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
      cachedUser.isLive = newStatus;
      localStorage.setItem("user", JSON.stringify(cachedUser));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update attendance status");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getWorkerProfile();
        setProfile(res.data);
        setIsLive(res.data.isLive || false);
      } catch (err) {
        console.error("Error fetching worker profile:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleIssueClick = (issueId) => {
    navigate(`/worker/issue/${issueId}`);
  };

  const handleShowHeatmap = () => {
    // 🔥 NEW: Included reReported issues in heatmap data
    const allIssues = [
      ...(profile?.unsolved || []),
      ...(profile?.solved || []),
      ...(profile?.reReported || []) 
    ];

    const heatmapData = allIssues
      .filter((issue) => issue.location) // Ensure issue has location data
      .map((issue) => ({
        id: issue._id,
        location: issue.location,
        status: issue.status,
        title: issue.title
      }));

    // Navigate to the heatmap route for workers
    navigate("/worker/heatmap", { state: { heatmapData } });
  };

  // Helper Component for Stats
  const CircularProgress = ({ percentage, color, label, count, total }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-container">
        <svg className="circular-progress" width="160" height="160">
          <circle
            className="circle-bg"
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            className="circle-progress"
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
          <text
            x="80"
            y="75"
            textAnchor="middle"
            className="progress-count"
            fill={color}
          >
            {count}
          </text>
          <text
            x="80"
            y="95"
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
      <>
        <Navbar />
        <div className="worker-loading-state">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="worker-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  // Data Processing
  const unsolved = profile?.unsolved || [];
  const solved = profile?.solved || [];
  const reReported = profile?.reReported || []; // 🔥 NEW: Extracted reReported issues
  const totalAssigned = profile?.totalAssigned || 0;

  // Calculate Percentages
  const unsolvedPercentage = totalAssigned > 0 ? (unsolved.length / totalAssigned) * 100 : 0;
  const solvedPercentage = totalAssigned > 0 ? (solved.length / totalAssigned) * 100 : 0;
  const reReportedPercentage = totalAssigned > 0 ? (reReported.length / totalAssigned) * 100 : 0; // 🔥 NEW

  // Determine current list based on tab
  const currentIssues = 
    activeTab === "unsolved" ? unsolved : 
    activeTab === "reReported" ? reReported : // 🔥 NEW
    solved;

  return (
    <div className="worker-dashboard-layout">
      <Navbar />

      <div className="worker-dashboard-container">
        {/* Header */}
        <div className="worker-header">
          <div>
            <h1>Worker Dashboard</h1>
            <p className="subtitle">
              Welcome back, <strong>{profile?.username}</strong>
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Live Attendance Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "8px 16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isLive ? "#10b981" : "#64748b" }}>
                {isLive ? "🟢 ONLINE" : "⚪ OFFLINE"}
              </span>
              <button
                type="button"
                onClick={handleToggleLive}
                style={{
                  position: "relative",
                  width: "50px",
                  height: "26px",
                  borderRadius: "15px",
                  background: isLive ? "#10b981" : "#cbd5e1",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  padding: 0
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: isLive ? "27px" : "3px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>
            <div className="total-badge">
              Total Assigned: <strong>{totalAssigned}</strong>
            </div>
            <button 
              onClick={handleShowHeatmap}
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              Show Heatmap
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="worker-statistics-section" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          <CircularProgress
            percentage={unsolvedPercentage}
            color="#ef4444" 
            label="Pending Issues"
            count={unsolved.length}
            total={totalAssigned}
          />
          {/* 🔥 NEW: Re-Reported Progress Circle */}
          <CircularProgress
            percentage={reReportedPercentage}
            color="#8b5cf6" 
            label="Re-Reported"
            count={reReported.length}
            total={totalAssigned}
          />
          <CircularProgress
            percentage={solvedPercentage}
            color="#10b981" 
            label="Issues Solved"
            count={solved.length}
            total={totalAssigned}
          />
        </div>

        {/* Tabs & List Section */}
        <div className="worker-issues-section">
          <div className="worker-tabs-container">
            <button
              className={`worker-tab-button ${activeTab === "unsolved" ? "active" : ""}`}
              onClick={() => setActiveTab("unsolved")}
            >
              <FaExclamation />
              <span>Unsolved ({unsolved.length})</span>
            </button>

            {/* 🔥 NEW: Re-Reported Tab */}
            <button
              className={`worker-tab-button ${activeTab === "reReported" ? "active" : ""}`}
              onClick={() => setActiveTab("reReported")}
            >
              <FaRedo />
              <span>Re-Reported ({reReported.length})</span>
            </button>

            <button
              className={`worker-tab-button ${activeTab === "solved" ? "active" : ""}`}
              onClick={() => setActiveTab("solved")}
            >
              <FaCheck />
              <span>Solved ({solved.length})</span>
            </button>
          </div>

          <div className="worker-issues-grid">
            {currentIssues.length === 0 ? (
              <div className="worker-empty-state">
                <p>No {activeTab === "reReported" ? "re-reported" : activeTab} issues found.</p>
              </div>
            ) : (
              currentIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="worker-issue-card"
                  onClick={() => handleIssueClick(issue._id)}
                >
                  <div className="worker-card-header">
                    <h3>{issue.title}</h3>
                    <span className={`worker-status-badge ${activeTab}`}>
                      {/* 🔥 NEW: Added condition for Re-Reported badge */}
                      {activeTab === "unsolved" ? "Pending" : 
                       activeTab === "reReported" ? "Re-Reported" : "Solved"}
                    </span>
                  </div>

                  <p className="worker-issue-description">
                    {issue.description?.substring(0, 100)}...
                  </p>

                  <div className="worker-card-footer">
                    <span className="worker-date">
                      Assigned: {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;