const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory for direct upload to S3

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = upload;