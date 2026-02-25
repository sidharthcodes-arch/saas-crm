const { db } = require("../config/db/db");
class Module {
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

  // All system modules (leads, deals, contacts, properties etc.)
  static async findAll() {
    return db("modules").orderBy("name", "asc");
  }

  static async findById(id) {
    return db("modules").where({ id }).first();
  }

  static async findByName(name) {
    return db("modules").where({ name }).first();
  }

  static async create(data) {
    const errors = Module.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const existing = await Module.findByName(data.name.trim());
    if (existing) throw new Error("Module with this name already exists");

    const [id] = await db("modules").insert({ name: data.name.trim() });
    return id;
  }

  static async update(id, data) {
    const errors = Module.validate(data);
    if (errors.length) throw new Error(errors.join(", "));
    return db("modules").where({ id }).update({ name: data.name.trim() });
  }

  static async delete(id) {
    return db("modules").where({ id }).delete();
  }
}

module.exports = Module;
