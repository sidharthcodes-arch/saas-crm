const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All dashboard routes require authentication
router.use(requireAuth);

router.get("/stats", dashboardController.getStats);

module.exports = router;
