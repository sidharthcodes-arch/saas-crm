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

async function updateWorkspace(id, { name, is_active }) {
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    const err = new Error("Workspace not found");
    err.statusCode = 404;
    throw err;
  }

  // Merge existing values so partial updates don't wipe fields
  await Workspace.update(id, {
    name: name ?? workspace.name,
    is_active: is_active ?? workspace.is_active,
  });

  return Workspace.findById(id);
}

module.exports = { createWorkspace, getWorkspace, updateWorkspace };
