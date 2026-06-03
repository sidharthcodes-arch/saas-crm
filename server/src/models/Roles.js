const { db } = require("../config/db/db");
class Role {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
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
  static async findAll() {
    return db("roles").orderBy("created_at", "desc");
  }

  static async findById(id) {
    return db("roles").where({ id }).first();
  }

  static async create(data) {
    const errors = Role.validate(data);
    if (errors.length) throw new Error(errors.join(", "));
    const [id] = await db("roles").insert({ name: data.name.trim() });
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
