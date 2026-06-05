const express = require("express");
const router = express.Router();
const activitiesController = require("./activities.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All activities routes require authentication
router.use(requireAuth);

router.get("/", activitiesController.getActivities);
router.get("/:id", activitiesController.getActivityById);

module.exports = router;
