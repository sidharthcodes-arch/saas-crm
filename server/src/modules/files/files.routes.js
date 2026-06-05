const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const filesController = require("./files.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// Ensure upload directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    // Sanitize filename to avoid weird character issues
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${sanitizedOriginalName}`);
  },
});

// File Type Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error("Allowed file types are: pdf, jpg, jpeg, png, doc, docx");
    err.statusCode = 400;
    cb(err, false);
  }
};

// Multer Upload Configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require authentication
router.use(requireAuth);

router.post("/upload", (req, res, next) => {
  // Use multer's upload.single('file') and handle errors gracefully
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        err.message = "File size cannot exceed 10MB";
        err.statusCode = 400;
      } else if (!err.statusCode) {
        err.statusCode = 400;
      }
      return next(err);
    }
    next();
  });
}, filesController.uploadFile);

router.get("/:entity_type/:entity_id", filesController.getFiles);
router.delete("/:id", filesController.deleteFile);

module.exports = router;
