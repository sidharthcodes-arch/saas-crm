const { db } = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: false, default: null }, // NULL = platform user
    role_id: { type: "BIGINT", required: true },
    name: { type: "VARCHAR", required: true },
    email: { type: "VARCHAR", required: true },
    password: { type: "VARCHAR", required: true },
    is_active: { type: "BOOLEAN", required: false, default: true },
    is_super_admin: { type: "BOOLEAN", required: false, default: false },
    created_at: { type: "TIMESTAMP", required: false },
    updated_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      if (!data.email || data.email.trim() === "")
        errors.push("email is required");
      if (!data.password || data.password.trim() === "")
        errors.push("password is required");
      if (!data.role_id) errors.push("role_id is required");
    }

    if (!data.name || data.name.trim() === "") errors.push("name is required");

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("email is invalid");
    }
    if (data.password && data.password.length < 6) {
      errors.push("password must be at least 6 characters");
    }

    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All users in a workspace with their role name
  static async findByWorkspace(workspaceId) {
    return db("users")
      .where("users.workspace_id", workspaceId)
      .join("roles", "users.role_id", "roles.id")
      .select("users.*", "roles.name as role_name")
      .orderBy("users.created_at", "desc");
  }

  static async findById(id) {
    return db("users")
      .where("users.id", id)
      .join("roles", "users.role_id", "roles.id")
      .select("users.*", "roles.name as role_name")
      .first();
  }

  static async findByEmail(email) {
    return db("users").where({ email }).first();
  }

  static async create(data, workspaceId = null) {
    const errors = User.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    // Check email uniqueness
    const existing = await User.findByEmail(data.email);
    if (existing) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [id] = await db("users").insert({
      workspace_id: workspaceId,
      role_id: data.role_id,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      is_active: true,
      is_super_admin: data.is_super_admin || false,
    });
    return id;
  }

  static async update(id, data) {
    const errors = User.validate(data, true);
    if (errors.length) throw new Error(errors.join(", "));

    const updateData = {
      name: data.name.trim(),
      role_id: data.role_id,
      is_active: data.is_active,
    };

    // Only update password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return db("users").where({ id }).update(updateData);
  }

  static async delete(id) {
    return db("users").where({ id }).delete();
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Strip password before sending to client
  static sanitize(user) {
    const { password, ...safe } = user;
    return safe;
  }
}

module.exports = User;
