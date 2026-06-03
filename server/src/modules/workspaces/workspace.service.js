const Workspace = require("../../models/Workspace");

// ─── Create Workspace ─────────────────────────────────────────────────────

async function createWorkspace({ name }) {
  if (!name || name.trim() === "") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }

  const id = await Workspace.create({ name });
  const workspace = await Workspace.findById(id);
  return workspace;
}

// ─── Get Workspace ────────────────────────────────────────────────────────

async function getWorkspace(id) {
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    const err = new Error("Workspace not found");
    err.statusCode = 404;
    throw err;
  }

  return workspace;
}

// ─── Update Workspace ─────────────────────────────────────────────────────
// Only allows updating the name.
// is_active is intentionally excluded — use setActiveStatus() for that,
// which should only be called by super admin routes.

async function updateWorkspace(id, { name }) {
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    const err = new Error("Workspace not found");
    err.statusCode = 404;
    throw err;
  }

  await Workspace.update(id, {
    name: name ?? workspace.name,
    is_active: workspace.is_active, // always preserve existing value, never trust client
  });

  return Workspace.findById(id);
}

// ─── Set Active Status (super admin only) ─────────────────────────────────

async function setActiveStatus(id, is_active) {
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    const err = new Error("Workspace not found");
    err.statusCode = 404;
    throw err;
  }

  await Workspace.update(id, {
    name: workspace.name,
    is_active,
  });

  return Workspace.findById(id);
}

module.exports = { createWorkspace, getWorkspace, updateWorkspace, setActiveStatus };
