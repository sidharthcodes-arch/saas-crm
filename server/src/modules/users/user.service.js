const User = require("../../models/User");

// ─── Get All Users in Workspace ───────────────────────────────────────────

async function getUsers(workspaceId) {
  const users = await User.findByWorkspace(workspaceId);
  return users.map(User.sanitize);
}

// ─── Create User ──────────────────────────────────────────────────────────

async function createUser(workspaceId, { name, email, role_id, password }) {
  if (!email || email.trim() === "") {
    const err = new Error("email is required");
    err.statusCode = 400;
    throw err;
  }
  if (!role_id) {
    const err = new Error("role_id is required");
    err.statusCode = 400;
    throw err;
  }

  // Use a generated temp password if none is provided
  const tempPassword = password || Math.random().toString(36).slice(-10) + "A1!";

  const userId = await User.create(
    { name: name || email, email, password: tempPassword, role_id },
    workspaceId
  );

  const user = await User.findById(userId);
  return User.sanitize(user);
}

// ─── Update User ──────────────────────────────────────────────────────────

async function updateUser(id, workspaceId, data) {
  const user = await User.findById(id);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure the user belongs to the caller's workspace
  if (user.workspace_id !== workspaceId) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  await User.update(id, {
    name: data.name ?? user.name,
    role_id: data.role_id ?? user.role_id,
    is_active: data.is_active ?? user.is_active,
    password: data.password, // undefined = no change (User.update handles this)
  });

  const updated = await User.findById(id);
  return User.sanitize(updated);
}

// ─── Deactivate User (soft delete) ────────────────────────────────────────

async function deactivateUser(id, workspaceId) {
  const user = await User.findById(id);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.workspace_id !== workspaceId) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  await User.delete(id); // sets is_active = false, deleted_at = now
  return { message: "User deactivated successfully" };
}

module.exports = { getUsers, createUser, updateUser, deactivateUser };
