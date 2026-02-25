const { db } = require("../config/db/db");
class PropertyType {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    name: { type: "VARCHAR", required: true },
    slug: { type: "VARCHAR", required: true },
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

  // Auto generate slug from name
  static generateSlug(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  // ─── Queries ───────────────────────────────────────────────────────
  static async findByWorkspace(workspaceId) {
    return db("property_types")
      .where({ workspace_id: workspaceId })
      .orderBy("name", "asc");
  }

  static async findById(id, workspaceId) {
    return db("property_types")
      .where({ id, workspace_id: workspaceId })
      .first();
  }

  static async findBySlug(slug, workspaceId) {
    return db("property_types")
      .where({ slug, workspace_id: workspaceId })
      .first();
  }

  static async create(workspaceId, data) {
    const errors = PropertyType.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const slug = PropertyType.generateSlug(data.name);

    const existing = await PropertyType.findBySlug(slug, workspaceId);
    if (existing)
      throw new Error("Property type with this name already exists");

    const [id] = await db("property_types").insert({
      workspace_id: workspaceId,
      name: data.name.trim(),
      slug,
    });
    return id;
  }

  static async update(id, workspaceId, data) {
    const errors = PropertyType.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const slug = PropertyType.generateSlug(data.name);

    return db("property_types")
      .where({ id, workspace_id: workspaceId })
      .update({ name: data.name.trim(), slug });
  }

  static async delete(id, workspaceId) {
    return db("property_types")
      .where({ id, workspace_id: workspaceId })
      .delete();
  }
}

module.exports = PropertyType;
