import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaArrowLeft,
  FaTrash,
  FaKey,
  FaClipboard,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  createAccountBySuperadmin,
  deleteAccountBySuperadmin,
  getDistrictAccounts,
  resetPasswordBySuperadmin,
} from "../../services/api";
import { statesAndDistricts } from "../../utils/statesAndDistricts";
import Navbar from "../Navbar/Navbar";
import "./Superadmin.css";

const DEPARTMENTS = [
  "Electricity",
  "Roads & Transport",
  "Public Health & Sanitation",
  "Waste Management",
  "Drainage & Sewerage",
  "Pollution Control",
  "Water Supply",
  "Parks & Trees",
  "Public Safety",
  "Streetlights",
  "Building & Construction",
  "Others",
];

const SuperadminManageAccounts = () => {
  const navigate = useNavigate();

  // Control Create Modal visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Create Form State
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "worker",
    employeeId: "",
    state: "",
    districtName: "",
    department: "",
  });

  // Generated Account Modal
  const [createdUser, setCreatedUser] = useState(null);

  // Delete Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null);

  // Reset Password Modal
  const [userToReset, setUserToReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Find selected state object
  const selectedState = statesAndDistricts.find(
    (item) => item.state === formData.state,
  );

  // Fetch accounts in district
  const fetchAccounts = async () => {
    try {
      const res = await getDistrictAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load district accounts");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextState = {
      ...formData,
      [name]: value,
      ...(name === "state" && { districtName: "" }),
    };

    if (name === "role") {
      if (value === "user") {
        nextState.employeeId = "";
        nextState.state = "";
        nextState.districtName = "";
        nextState.department = "";
      }
      if (value === "worker") {
        nextState.employeeId = "";
      }
      if (value === "admin") {
        nextState.department = "";
      }
    }

    setFormData(nextState);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataPayload = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "admin") {
        dataPayload.employeeId = formData.employeeId;
        dataPayload.state = formData.state;
        dataPayload.districtName = formData.districtName;
        dataPayload.department = formData.department;
      }

      if (formData.role === "worker") {
        dataPayload.state = formData.state;
        dataPayload.districtName = formData.districtName;
        dataPayload.department = formData.department;
      }

      const res = await createAccountBySuperadmin(dataPayload);
      toast.success("Account created successfully!");
      
      // Close creation modal first
      setShowCreateModal(false);

      // Show success modal with copyable password
      setCreatedUser({
        ...res.data.user,
        password: formData.password,
      });

      // Clear form except location details for ease of reuse
      setFormData({
        ...formData,
        username: "",
        fullName: "",
        email: "",
        password: "",
        employeeId: "",
      });

      // Refresh directory list
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteAccountBySuperadmin(userToDelete._id);
      toast.success("Account deleted successfully!");
      setUserToDelete(null);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!userToReset || !newPassword) return;
    try {
      await resetPasswordBySuperadmin(userToReset._id, newPassword);
      toast.success("Password reset successfully!");
      setUserToReset(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info("Copied to clipboard!");
  };

  const currentUserDetails = JSON.parse(localStorage.getItem("user") || "{}");

  // Group accounts by department. Default group is "Unassigned" for users without a department
  const groupedAccounts = React.useMemo(() => {
    const groups = {};
    DEPARTMENTS.forEach((dept) => {
      groups[dept] = [];
    });
    groups["Unassigned / Others"] = [];

    accounts.forEach((acc) => {
      if (acc.department && DEPARTMENTS.includes(acc.department)) {
        groups[acc.department].push(acc);
      } else {
        groups["Unassigned / Others"].push(acc);
      }
    });

    // Remove empty groups to clean up display, but keep groups with entries
    return Object.fromEntries(
      Object.entries(groups).filter(([_, list]) => list.length > 0)
    );
  }, [accounts]);

  return (
    <>
      <Navbar />
      <div className="superadmin-container">
        <div className="superadmin-wrapper">
        <button onClick={() => navigate("/dashboard")} className="back-dashboard-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div className="superadmin-header">
          <div>
            <h1>Superadmin Console</h1>
            <p>
              District Staff Directory for{" "}
              <strong>
                {currentUserDetails.districtName}, {currentUserDetails.state}
              </strong>
            </p>
          </div>
          <div className="superadmin-actions-bar">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-create-trigger"
            >
              <FaPlus /> Create Account
            </button>
          </div>
        </div>

        {Object.keys(groupedAccounts).length === 0 ? (
          <div className="department-group-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div className="no-data">No admins or workers registered in your district.</div>
          </div>
        ) : (
          Object.entries(groupedAccounts).map(([dept, members]) => (
            <div key={dept} className="department-group-card">
              <div className="department-group-header">
                <span>{dept} Department</span>
                <span className="department-badge-count">
                  {members.length} {members.length === 1 ? "Member" : "Members"}
                </span>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Employee ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((acc) => (
                      <tr key={acc._id}>
                        <td><strong>{acc.fullName || "-"}</strong></td>
                        <td>{acc.username}</td>
                        <td>{acc.email}</td>
                        <td>
                          <span className={`role-badge ${acc.role}`}>
                            {acc.role}
                          </span>
                        </td>
                        <td>{acc.employeeId || "N/A"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              title="Reset Password"
                              className="btn-icon reset"
                              onClick={() => {
                                setUserToReset(acc);
                                setNewPassword("");
                              }}
                            >
                              <FaKey />
                            </button>
                            <button
                              title="Remove Account"
                              className="btn-icon delete"
                              onClick={() => setUserToDelete(acc)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Account Popup Modal */}
      {showCreateModal && (
        <div className="superadmin-modal-overlay">
          <div className="superadmin-modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Create Credentials</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#64748b" }}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="form-grid">
              {/* Full Name */}
              <div className="form-group-full">
                <label className="form-label">Full Name</label>
                <div className="form-input-wrapper">
                  <FaUser />
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    placeholder="Enter Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="form-label">Username</label>
                <div className="form-input-wrapper">
                  <FaUser />
                  <input
                    type="text"
                    name="username"
                    className="form-input"
                    placeholder="Enter Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <FaEnvelope />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Temporary Password</label>
                <div className="form-input-wrapper">
                  <FaLock />
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    placeholder="Set Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="form-label">Role</label>
                <div className="form-input-wrapper">
                  <FaUser />
                  <select
                    name="role"
                    className="form-input"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                    <option value="user">Normal User</option>
                  </select>
                </div>
              </div>

              {/* Admin & Worker Specific Fields */}
              {(formData.role === "admin" || formData.role === "worker") && (
                <>
                  {/* State */}
                  <div>
                    <label className="form-label">State</label>
                    <div className="form-input-wrapper">
                      <FaBuilding />
                      <select
                        name="state"
                        className="form-input"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select State</option>
                        {statesAndDistricts.map((item) => (
                          <option key={item.state} value={item.state}>
                            {item.state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* District */}
                  <div>
                    <label className="form-label">District</label>
                    <div className="form-input-wrapper">
                      <FaBuilding />
                      <select
                        name="districtName"
                        className="form-input"
                        value={formData.districtName}
                        onChange={handleChange}
                        required
                        disabled={!formData.state}
                      >
                        <option value="">Select District</option>
                        {selectedState?.districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="form-label">Department</label>
                    <div className="form-input-wrapper">
                      <FaBuilding />
                      <select
                        name="department"
                        className="form-input"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Admin Only Fields */}
              {formData.role === "admin" && (
                <div>
                  <label className="form-label">Employee ID</label>
                  <div className="form-input-wrapper">
                    <FaBuilding />
                    <input
                      type="text"
                      name="employeeId"
                      className="form-input"
                      placeholder="Enter Employee ID"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group-full">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Generating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated User Info Modal */}
      {createdUser && (
        <div className="superadmin-modal-overlay">
          <div className="superadmin-modal-content">
            <h3>Account Generated Successfully!</h3>
            <p>Please copy the login credentials below for the new member.</p>
            <div className="credential-box">
              <div className="credential-item">
                <span className="credential-label">Name:</span>
                <span className="credential-value">{createdUser.fullName}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Username:</span>
                <span className="credential-value">{createdUser.username}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Email:</span>
                <span className="credential-value">{createdUser.email}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Password:</span>
                <span className="credential-value">
                  {createdUser.password}
                  <button
                    onClick={() => copyToClipboard(createdUser.password)}
                    className="btn-icon"
                    style={{ display: "inline-flex", marginLeft: "8px", padding: "4px" }}
                  >
                    <FaClipboard size={12} />
                  </button>
                </span>
              </div>
            </div>
            <button className="btn-close" onClick={() => setCreatedUser(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="superadmin-modal-overlay">
          <div className="superadmin-modal-content">
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to delete the account for <strong>{userToDelete.fullName || userToDelete.username}</strong>?</p>
            <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              This action is permanent and cannot be undone.
            </p>
            <div className="superadmin-modal-actions">
              <button className="btn-cancel" onClick={() => setUserToDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {userToReset && (
        <div className="superadmin-modal-overlay">
          <div className="superadmin-modal-content">
            <h3>Reset Password</h3>
            <p>Enter a new password for <strong>{userToReset.fullName || userToReset.username}</strong>:</p>
            <form onSubmit={handleResetPassword}>
              <div className="form-input-wrapper" style={{ marginTop: "1rem" }}>
                <FaLock />
                <input
                  type="password"
                  className="form-input"
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="superadmin-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setUserToReset(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ margin: 0, flex: 1 }}>
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default SuperadminManageAccounts;
