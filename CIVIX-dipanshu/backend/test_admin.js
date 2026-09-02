const adminController = require("./controllers/adminController");
console.log(
  "Successfully loaded adminController:",
  Object.keys(adminController),
);
const adminRoutes = require("./routes/adminRoutes");
console.log("Successfully loaded adminRoutes");
