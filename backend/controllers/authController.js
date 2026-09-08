const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET;

//const validDistricts = ["MH24", "2", "3"];
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      fullName,
      password,
      role = "user",
      employeeId,
      state,
      districtName,
      department,
    } = req.body;

    // Reject direct registration of admins and workers
    if (role === "admin" || role === "worker") {
      return res.status(403).json({
        message: "Registration for admin and worker roles is restricted. Please contact your Superadmin.",
      });
    }

    // Basic validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Admin-specific validation
    if (role === "admin") {
      if (!employeeId || !state || !districtName || !department) {
        return res.status(400).json({
          message:
            "Employee ID, state, district name, and department are required for admins",
        });
      }

      // Validate government email
      if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
        return res.status(403).json({
          message: "Only official government emails are allowed for admins",
        });
      }

      // Check if another admin already exists for this district
      const existingAdmin = await User.findOne({
        role: "admin",
        state,
        districtName,
        department,
      });
      if (existingAdmin) {
        return res.status(400).json({
          message: `An admin already exists for ${districtName}, ${state}`,
        });
      }
    }

    // Superadmin-specific validation
    if (role === "superadmin") {
      if (!employeeId || !state || !districtName) {
        return res.status(400).json({
          message:
            "Employee ID, state, and district name are required for superadmins",
        });
      }

      if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
        return res.status(403).json({
          message:
            "Only official government emails are allowed for superadmins",
        });
      }
    }

    // Worker-specific validation
    if (role === "worker") {
      if (!state || !districtName || !department) {
        return res.status(400).json({
          message:
            "State, district name and department are required for workers",
        });
      }
    }

    // Create new user (for user, admin, and worker)
    const newUserData = {
      username,
      email,
      fullName,
      password,
      role,
    };

    if (role === "admin") {
      newUserData.employeeId = employeeId;
      newUserData.state = state;
      newUserData.districtName = districtName;
      newUserData.department = department;
    }

    if (role === "superadmin") {
      newUserData.employeeId = employeeId;
      newUserData.state = state;
      newUserData.districtName = districtName;
    }

    if (role === "worker") {
      newUserData.state = state;
      newUserData.districtName = districtName;
      newUserData.department = department;
    }

    const newUser = new User(newUserData);
    await newUser.save();

    // Generate token using helper (includes role)
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        state: newUser.state || null,
        districtName: newUser.districtName || null,
        department: newUser.department || null,
      },
      details: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);

      res.status(200).json({
        message: "User logged in successfully",
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          state: user.state || null,
          districtName: user.districtName || null,
          department: user.department || null,
        },
        details: user,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};
