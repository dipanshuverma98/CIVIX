import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "leaflet/dist/leaflet.css"; 
import React from "react";

import Landing from "./components/Home1/Landing";
import Home from "./components/Homepage/Home";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminIssueDetails from "./components/Admin/AdminIssueDetails";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import WorkerDashboard from "./components/Worker/WorkerDashboard";
import Report from "./components/Report/Report";
import IssueDetails from "./components/IssueDetails/IssueDetails";
import UserProfile from "./components/UserProfile/UserProfile";
import AboutUs from "./components/About/AboutUs";
import Chat from "./components/Chat/Chat";
import ChatHistory from "./components/Chat/ChatHistory";
import Profile from "./components/Profile/Profile";
import AdminProfile from "./components/Profile/AdminProfile";
import Notifications from "./components/Notification/Notifications";
import WorkerIssueDetails from "./components/Worker/WorkerIssueDetails";
import HeatmapPage from "./components/Admin/HeatmapPage";
import Worker_profile from "./components/Profile/Worker_Profile";
import SuperadminManageAccounts from "./components/Superadmin/SuperadminManageAccounts";
import { getSocket } from "./socket";

/* -------------------- */
/* Auth Utilities */
/* -------------------- */
const getUser = () => JSON.parse(localStorage.getItem("user") || "{}");

const isAuthenticated = () => Boolean(localStorage.getItem("token"));

/* -------------------- */
/* Protected Route */
/* -------------------- */
const ProtectedRoute = ({ children, roles }) => {
  const user = getUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/* -------------------- */
/* Dashboard Resolver */
/* -------------------- */
const DashboardRoute = () => {
  const user = getUser();
  if (user.role === "admin" || user.role === "superadmin") return <AdminDashboard />;
  if (user.role === "worker") return <WorkerDashboard />;
  return <Home />;
};

/* -------------------- */
/* App Content */
/* -------------------- */
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = getSocket();
  useEffect(() => {
    // Ensure socket joins the user's personal room so server emits reach this client
    const currentUser = getUser();
    if (currentUser && currentUser._id) {
      if (socket && socket.connected) {
        socket.emit("join", { userId: currentUser._id });
      } else if (socket) {
        socket.on("connect", () => {
          socket.emit("join", { userId: currentUser._id });
        });
      }
    }

    const handleNewMessage = (data) => {
      const onChatPage = location.pathname.endsWith("/chat");
      if (onChatPage) return;

      toast.info(`New message from ${data.senderName}`, {
        autoClose: 4000,
        progressStyle: {
          background: "#ef4444", // Bright Red Progress Bar
          height: "4px",
        },
        style: {
          background: "#ffffff", // Pure White Background
          color: "#d32f2f", // Deep Red Text
          border: "1px solid #fee2e2", // Very subtle light red border
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.15)", // Soft Red Glow
          fontSize: "15px",
          fontWeight: "600",
          letterSpacing: "0.5px",
          padding: "16px",
        },
        icon: false,
        onClick: () =>
          navigate("/chat", {
            state: {
              currentUser: getUser(),
              receiverUser: {
                _id: data.sender,
                username: data.senderName,
              },
            },
          }),
      });
    };
    const handleNewupdate = (data) => {
      toast.info(`${data.message}`, {
        autoClose: 4000,
        progressStyle: {
          background: "#ef4444", // Bright Red Progress Bar
          height: "4px",
        },
        style: {
          background: "#ffffff", // Pure White Background
          color: "#d32f2f", // Deep Red Text
          border: "1px solid #fee2e2", // Very subtle light red border
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.15)", // Soft Red Glow
          fontSize: "15px",
          fontWeight: "600",
          letterSpacing: "0.5px",
          padding: "16px",
        },
        icon: false,
        onClick: () => navigate("/notifications"),
      });
    };
    const handleIssueAssigned = (data) => {
      toast.info(`${data.message}`, {
        autoClose: 5000,
        progressStyle: { background: "#3b82f6", height: "4px" }, // Blue progress bar for assignments
        style: {
          background: "#ffffff",
          color: "#1d4ed8", // Deep blue text
          border: "1px solid #dbeafe", 
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)", // Blue glow
          fontSize: "15px",
          fontWeight: "600",
          letterSpacing: "0.5px",
          padding: "16px",
        },
        icon: false,
        // Clicking the toast takes the worker directly to the issue details!
        onClick: () => navigate(`/worker/issue/${data.issueId}`), 
      });
    };

    socket.on("new_chat_message", handleNewMessage);
    socket.on("issue_status_changed", handleNewupdate);
    socket.on("issue_assigned", handleIssueAssigned);
    return () => {
      socket.off("new_chat_message", handleNewMessage);
      socket.off("issue_status_changed", handleNewupdate);
      socket.off("issue_assigned", handleIssueAssigned);
    };
  }, [location.pathname, navigate, socket]);

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["admin", "user", "worker","superadmin"]}>
              <DashboardRoute />
            </ProtectedRoute>
          }
        />

        {/* User */}
        <Route
          path="/report"
          element={
            <ProtectedRoute roles={["user"]}>
              <Report />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["user"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Shared */}
        <Route
          path="/issue/:id"
          element={
            <ProtectedRoute roles={["user", "admin", "superadmin"]}>
              <IssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute roles={["user", "admin"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:userId"
          element={
            <ProtectedRoute roles={["user", "admin","worker","superadmin"]}>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute roles={["user", "admin", "worker", "superadmin"]}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-history"
          element={
            <ProtectedRoute roles={["user", "admin", "worker", "superadmin"]}>
              <ChatHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/issue/:id"
          element={
            <ProtectedRoute roles={["admin", "superadmin", "worker"]}>
              <AdminIssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/issue/:id"
          element={
            <ProtectedRoute roles={["worker"]}>
              <WorkerIssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute roles={["admin","superadmin"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/manage-accounts"
          element={
            <ProtectedRoute roles={["superadmin"]}>
              <SuperadminManageAccounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/heatmap"
          element={
            <ProtectedRoute roles={["admin","superadmin"]}>
              <HeatmapPage />
            </ProtectedRoute>
          }
        />

<Route
          path="/worker/heatmap"
          element={
            <ProtectedRoute roles={["worker"]}>
              <HeatmapPage />
            </ProtectedRoute>
          }
        />

<Route
          path="/worker/profile"
          element={
            <ProtectedRoute roles={["worker"]}>
              <Worker_profile />
            </ProtectedRoute>
          }
        />
      </Routes>
      

      <ToastContainer
        position="top-right"
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
      />
    </>
  );
}

/* -------------------- */
/* App Wrapper */
/* -------------------- */
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
