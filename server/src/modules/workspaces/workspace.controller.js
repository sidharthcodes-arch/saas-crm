const workspaceService = require("./workspace.service");

// POST /api/v1/workspaces
async function createWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.createWorkspace({ name: req.body.name });
    return res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/workspaces/:id
async function getWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.getWorkspace(req.params.id);
    return res.status(200).json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/workspaces/:id
async function updateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.id, req.body);
    return res.status(200).json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

module.exports = { createWorkspace, getWorkspace, updateWorkspace };
