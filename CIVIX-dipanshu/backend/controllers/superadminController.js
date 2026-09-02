const User = require("../models/User");

// Create a User/Admin/Worker account
exports.createAccount = async (req, res) => {
  try {
    const {
      username,
      email,
      fullName,
      password,
      role,
      employeeId,
      state,
      districtName,
      department,
    } = req.body;

    if (!username || !email || !password || !role || !fullName) {
      return res.status(400).json({
        message: "Username, email, full name, password, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Validation based on roles
    if (role === "admin") {
      if (!employeeId || !state || !districtName || !department) {
        return res.status(400).json({
          message: "Employee ID, state, district, and department are required for admins",
        });
      }


      // Check if another admin already exists for this district & department
      const existingAdmin = await User.findOne({
        role: "admin",
        state,
        districtName,
        department,
      });
      if (existingAdmin) {
        return res.status(400).json({
          message: `An admin already exists for ${districtName}, ${state} in department: ${department}`,
        });
      }
    }

    if (role === "worker") {
      if (!state || !districtName || !department) {
        return res.status(400).json({
          message: "State, district, and department are required for workers",
        });
      }
    }

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

    if (role === "worker") {
      newUserData.state = state;
      newUserData.districtName = districtName;
      newUserData.department = department;
    }

    const newUser = new User(newUserData);
    await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        state: newUser.state || null,
        districtName: newUser.districtName || null,
        department: newUser.department || null,
      },
    });
  } catch (error) {
    console.error("Account creation error:", error);
    res.status(500).json({
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Delete a User/Admin/Worker account
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Do not allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} account deleted successfully`,
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Get admins and workers of the same district & state as the superadmin
exports.getDistrictAccounts = async (req, res) => {
  try {
    const { state, districtName } = req.user;

    if (!state || !districtName) {
      return res.status(400).json({
        message: "Superadmin must have state and district configured to view district accounts",
      });
    }

    // Fetch admins and workers matching state & districtName
    const users = await User.find({
      role: { $in: ["admin", "worker"] },
      state,
      districtName,
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch district accounts error:", error);
    res.status(500).json({
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};

// Reset password for any account
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password is required and must be at least 6 characters long",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Failed to reset password",
      error: error.message,
    });
  }
};
