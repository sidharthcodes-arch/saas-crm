const express = require("express");
const router = express.Router();
const rolesController = require("./roles.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// Require authentication for roles
router.use(requireAuth);

// GET /api/v1/roles
router.get("/", rolesController.getRoles);

module.exports = router;
