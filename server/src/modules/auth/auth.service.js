const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Workspace = require("../../models/Workspace");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── Register ─────────────────────────────────────────────────────────────
// Creates a new workspace + the first admin user in one transaction.
// Used for the SaaS onboarding flow (new tenant sign-up).

async function register({ workspaceName, name, email, password, role_id }) {
  if (!workspaceName || workspaceName.trim() === "") {
    const err = new Error("workspaceName is required");
    err.statusCode = 400;
    throw err;
  }

  // Create workspace first
  const workspaceId = await Workspace.create({ name: workspaceName });

  // Create the owner user inside that workspace
  const userId = await User.create(
    { name, email, password, role_id, is_super_admin: false },
    workspaceId
  );

  const user = await User.findById(userId);

  const token = generateToken({
    id: user.id,
    workspace_id: user.workspace_id,
    role_id: user.role_id,
    is_super_admin: user.is_super_admin,
  });

  return { token, user: User.sanitize(user) };
}

// ─── Login ────────────────────────────────────────────────────────────────

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByEmail(email.trim().toLowerCase());

  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error("Your account has been deactivated");
    err.statusCode = 403;
    throw err;
  }

  // Check workspace is still active (skip for super admins — no workspace)
  if (user.workspace_id) {
    const workspaceActive = await Workspace.isActive(user.workspace_id);
    if (!workspaceActive) {
      const err = new Error("Workspace is disabled");
      err.statusCode = 403;
      throw err;
    }
  }

  const passwordMatch = await User.verifyPassword(password, user.password);
  if (!passwordMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({
    id: user.id,
    workspace_id: user.workspace_id,
    role_id: user.role_id,
    is_super_admin: user.is_super_admin,
  });

  return { token, user: User.sanitize(user) };
}

// ─── Logout ───────────────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by discarding the token.
// This function exists as a hook for any future server-side logic
// (e.g. token blocklist / Redis blacklist).

async function logout(userId) {
  // No server-side state to clear for now.
  // Future: add token to a Redis blacklist here.
  return true;
}

module.exports = { register, login, logout };
