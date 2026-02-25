const { db } = require("../config/db/db");
class Workspace {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false }, // auto increment
    name: { type: "VARCHAR", required: true },
    is_active: { type: "BOOLEAN", required: false, default: true },
    created_at: { type: "TIMESTAMP", required: false }, // auto
    updated_at: { type: "TIMESTAMP", required: false }, // auto
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("name is required");
    }
    if (data.name && data.name.length > 150) {
      errors.push("name must be under 150 characters");
    }
    if (data.is_active !== undefined && typeof data.is_active !== "boolean") {
      errors.push("is_active must be a boolean");
    }

    return errors; // empty = valid
  }

  // ─── Queries ───────────────────────────────────────────────────────

  static async findAll() {
    return db("workspaces").orderBy("created_at", "desc");
  }

  static async findById(id) {
    return db("workspaces").where({ id }).first();
  }

  static async create(data) {
    const errors = Workspace.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("workspaces").insert({
      name: data.name.trim(),
      is_active: true,
    });
    return id;
  }

  static async update(id, data) {
    const errors = Workspace.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    return db("workspaces").where({ id }).update({
      name: data.name.trim(),
      is_active: data.is_active,
    });
  }

  static async delete(id) {
    return db("workspaces").where({ id }).delete();
  }

  // Used in auth — block login if workspace is disabled
  static async isActive(id) {
    const workspace = await db("workspaces")
      .where({ id })
      .select("is_active")
      .first();
    return workspace?.is_active === 1;
  }
}

module.exports = Workspace;
