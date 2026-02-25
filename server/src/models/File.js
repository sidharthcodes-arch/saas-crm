const { db } = require("../config/db/db");
const VALID_ENTITY_TYPES = ["lead", "contact", "property", "deal"];

class File {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    entity_type: { type: "ENUM", required: true, values: VALID_ENTITY_TYPES },
    entity_id: { type: "BIGINT", required: true },
    file_path: { type: "VARCHAR", required: true },
    uploaded_by: { type: "BIGINT", required: true },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.entity_type) errors.push("entity_type is required");
    if (data.entity_type && !VALID_ENTITY_TYPES.includes(data.entity_type)) {
      errors.push(
        `entity_type must be one of: ${VALID_ENTITY_TYPES.join(", ")}`,
      );
    }
    if (!data.entity_id) errors.push("entity_id is required");
    if (!data.file_path) errors.push("file_path is required");
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // Files for a specific record (lead, contact, property, deal)
  static async findByEntity(workspaceId, entityType, entityId) {
    return db("files")
      .where({
        workspace_id: workspaceId,
        entity_type: entityType,
        entity_id: entityId,
      })
      .join("users", "files.uploaded_by", "users.id")
      .select("files.*", "users.name as uploaded_by_name")
      .orderBy("files.created_at", "desc");
  }

  static async findById(id, workspaceId) {
    return db("files").where({ id, workspace_id: workspaceId }).first();
  }

  static async create(workspaceId, uploadedBy, data) {
    const errors = File.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("files").insert({
      workspace_id: workspaceId,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      file_path: data.file_path,
      uploaded_by: uploadedBy,
    });
    return id;
  }

  static async delete(id, workspaceId) {
    return db("files").where({ id, workspace_id: workspaceId }).delete();
  }

  // Delete all files for a record (e.g. when a lead is deleted)
  static async deleteByEntity(workspaceId, entityType, entityId) {
    return db("files")
      .where({
        workspace_id: workspaceId,
        entity_type: entityType,
        entity_id: entityId,
      })
      .delete();
  }
}

module.exports = File;
