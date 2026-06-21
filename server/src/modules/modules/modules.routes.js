const express = require("express");
const router = express.Router();
const modulesController = require("./modules.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// Require authentication for modules
router.use(requireAuth);

// GET /api/v1/modules
router.get("/", modulesController.getModules);

module.exports = router;
