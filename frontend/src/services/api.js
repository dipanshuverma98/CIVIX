import axios from "axios";

// Set up the base URL for the backend API
const API = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
});

// Automatically attach token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Authentication routes
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (userData) => API.post("/auth/register", userData);

// User routes
export const getUserProfile = (userId) => API.get(`users/${userId}`);

// Issues
export const addIssue = (data) => API.post("/issues", data);

// Issue details
export const addComment = (issueId, commentText) =>
  API.post(`/issues/${issueId}/comments`, { text: commentText });
export const getIssueById = (id) => API.get(`/issues/${id}`);
export const upvoteIssue = (id) => API.post(`/issues/${id}/upvote`);
export const getAllIssues = (filters = {}) =>
  API.get("/issues/all", { params: filters });
export const getWorkerProfile = () => API.get(`/worker/profile`);

// Chats
export const getChatHistory = () => API.get("/chat-history");
export const getChatMessages = (senderId, receiverId) =>
  API.get(`/messages/${senderId}/${receiverId}`);

// Admin - now protected
export const updateIssueStatus = (id, status) =>
  API.patch(`/worker/issues/${id}/status`, { status });

// Admin auto-assign
export const autoAssignIssues = () => API.post(`/admin/issues/auto-assign`);
export const getDistrictWorkers = () => API.get(`/admin/district/workers`);
export const assignIssueToWorker = (issueId, workerId) =>
  API.post("/admin/issues/assign", { issueId, workerId });

// Profile
export const updateprofilepic = (file) => {
  console.log("Updating profile picture with file:", file);
  const formData = new FormData();
  formData.append("profilePic", file);
  return API.post("/users/updateProfilePic", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateUserBio = (bio) => {
  return API.patch("/users/updateBio", { bio });
};
export const reReportIssue = (issueId, reason) => {
  return API.patch(`/users/reReport/${issueId}`, { reason });
};

export const getUnseenNotifications = () => API.get("/notifications/unseen");
export const markNotificationRead = (id) =>
  API.delete(`/notifications/${id}/read`);

// Superadmin functions
export const createAccountBySuperadmin = (data) =>
  API.post("/superadmin/create-user", data);
export const deleteAccountBySuperadmin = (id) =>
  API.delete(`/superadmin/delete-user/${id}`);
export const getDistrictAccounts = () =>
  API.get("/superadmin/district-accounts");
export const resetPasswordBySuperadmin = (id, password) =>
  API.patch(`/superadmin/reset-password/${id}`, { password });

export const updateWorkerLiveStatus = (isLive) =>
  API.patch("/worker/live-status", { isLive });

export default {
  login,
  register,
  getUserProfile,
  addIssue,
  addComment,
  getIssueById,
  upvoteIssue,
  getAllIssues,
  getChatHistory,
  getChatMessages,
  updateIssueStatus, // also export here for convenience
  updateprofilepic,
  updateUserBio,
  getUnseenNotifications,
  autoAssignIssues,
  createAccountBySuperadmin,
  deleteAccountBySuperadmin,
  getDistrictAccounts,
  resetPasswordBySuperadmin,
  updateWorkerLiveStatus,
};
