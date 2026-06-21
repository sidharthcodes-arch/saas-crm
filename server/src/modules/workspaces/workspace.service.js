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

  const { db } = require("../../config/db/db");
  const [
    usersCount,
    leadsCount,
    dealsCount,
    propertiesCount
  ] = await Promise.all([
    db("users").where("workspace_id", id).count("id as count").first(),
    db("leads").where("workspace_id", id).count("id as count").first(),
    db("deals").where("workspace_id", id).count("id as count").first(),
    db("properties").where("workspace_id", id).count("id as count").first(),
  ]);

  workspace.stats = {
    users: usersCount?.count || 0,
    leads: leadsCount?.count || 0,
    deals: dealsCount?.count || 0,
    properties: propertiesCount?.count || 0,
  };

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

  return getWorkspace(id);
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
