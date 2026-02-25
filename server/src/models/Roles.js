const { db } = require("../config/db");

class Role {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: false, default: null }, // NULL = platform role
    name: { type: "VARCHAR", required: true },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim() === "") errors.push("name is required");
    if (data.name && data.name.length > 100)
      errors.push("name must be under 100 characters");
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────
  static async findPlatformRoles() {
    return db("roles").whereNull("workspace_id").orderBy("created_at", "desc");
  }

  static async findByWorkspace(workspaceId) {
    return db("roles")
      .where({ workspace_id: workspaceId })
      .orderBy("created_at", "desc");
  }

  static async findById(id) {
    return db("roles").where({ id }).first();
  }

  static async createPlatformRole(data) {
    const errors = Role.validate(data);
    if (errors.length) throw new Error(errors.join(", "));
    const [id] = await db("roles").insert({
      name: data.name.trim(),
      workspace_id: null,
    });
    return id;
  }

  static async createWorkspaceRole(workspaceId, data) {
    const errors = Role.validate(data);
    if (errors.length) throw new Error(errors.join(", "));
    const [id] = await db("roles").insert({
      name: data.name.trim(),
      workspace_id: workspaceId,
    });
    return id;
  }

  static async update(id, data) {
    const errors = Role.validate(data);
    if (errors.length) throw new Error(errors.join(", "));
    return db("roles").where({ id }).update({ name: data.name.trim() });
  }

  static async delete(id) {
    return db("roles").where({ id }).delete();
  }
}

module.exports = Role;
