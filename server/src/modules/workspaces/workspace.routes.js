const express = require("express");
const router = express.Router();
const workspaceController = require("./workspace.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All workspace routes require authentication
router.use(requireAuth);

router.post("/", workspaceController.createWorkspace);
router.get("/:id", workspaceController.getWorkspace);
router.put("/:id", workspaceController.updateWorkspace);

module.exports = router;
