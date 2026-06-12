const express = require("express");
const router = express.Router();
const statusesController = require("./statuses.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// Require authentication for statuses
router.use(requireAuth);

router.get("/", statusesController.getStatuses);

module.exports = router;
