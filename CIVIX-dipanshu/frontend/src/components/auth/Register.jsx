import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { register } from "../../services/api";
import { statesAndDistricts } from "../../utils/statesAndDistricts";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    employeeId: "",
    state: "",
    districtName: "",
    department: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Find selected state object
  const selectedState = statesAndDistricts.find(
    (item) => item.state === formData.state,
  );

  // Handle form changes
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

      if (value === "admin") {
        nextState.department = "";
      }

      if (value === "superadmin") {
        nextState.department = "";
      }

      if (value === "worker") {
        nextState.employeeId = "";
      }
    }

    setFormData(nextState);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const requestBody = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "admin") {
        requestBody.employeeId = formData.employeeId;
        requestBody.state = formData.state;
        requestBody.districtName = formData.districtName;
        requestBody.department = formData.department;
      }

      if (formData.role === "superadmin") {
        requestBody.employeeId = formData.employeeId;
        requestBody.state = formData.state;
        requestBody.districtName = formData.districtName;
      }

      if (formData.role === "worker") {
        requestBody.state = formData.state;
        requestBody.districtName = formData.districtName;
        requestBody.department = formData.department;
      }

      const response = await register(requestBody);
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("details", JSON.stringify(data.details));

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to register. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button onClick={() => navigate("/")} className="back-home">
        <FaArrowLeft /> Back to Home
      </button>

      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to start reporting issues</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="user">User</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Admin / Super Admin Fields */}
          {(formData.role === "admin" || formData.role === "superadmin") && (
            <>
              {/* Employee ID */}
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="Employee ID"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* State */}
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="state"
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
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="districtName"
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

              {/* Department - Admin only */}
              {formData.role === "admin" && (
                <div className="form-group">
                  <div className="input-icon">
                    <FaBuilding />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Roads & Transport">
                        Roads & Transport
                      </option>
                      <option value="Public Health & Sanitation">
                        Public Health & Sanitation
                      </option>
                      <option value="Waste Management">Waste Management</option>
                      <option value="Drainage & Sewerage">
                        Drainage & Sewerage
                      </option>
                      <option value="Pollution Control">
                        Pollution Control
                      </option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Parks & Trees">Parks & Trees</option>
                      <option value="Public Safety">Public Safety</option>
                      <option value="Streetlights">Streetlights</option>
                      <option value="Building & Construction">
                        Building & Construction
                      </option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {formData.role === "worker" && (
            <>
              {/* State */}
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="state"
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
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="districtName"
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
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Roads & Transport">Roads & Transport</option>
                    <option value="Public Health & Sanitation">
                      Public Health & Sanitation
                    </option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Drainage & Sewerage">
                      Drainage & Sewerage
                    </option>
                    <option value="Pollution Control">Pollution Control</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Parks & Trees">Parks & Trees</option>
                    <option value="Public Safety">Public Safety</option>
                    <option value="Streetlights">Streetlights</option>
                    <option value="Building & Construction">
                      Building & Construction
                    </option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
