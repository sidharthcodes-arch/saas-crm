const { db } = require("../config/db/db");

const VALID_TYPES = ["call", "email", "meeting", "note", "task"];
const VALID_ENTITY_TYPES = ["lead", "contact", "property", "deal"];

class Activity {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    entity_type: { type: "ENUM", required: true, values: VALID_ENTITY_TYPES },
    entity_id: { type: "BIGINT", required: true },
    type: { type: "ENUM", required: true, values: VALID_TYPES },
    description: { type: "TEXT", required: false },
    created_by: { type: "BIGINT", required: true },
    activity_at: { type: "TIMESTAMP", required: false },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];

    if (!data.type) errors.push("type is required");
    if (data.type && !VALID_TYPES.includes(data.type)) {
      errors.push(`type must be one of: ${VALID_TYPES.join(", ")}`);
    }
    if (!data.entity_type) errors.push("entity_type is required");
    if (data.entity_type && !VALID_ENTITY_TYPES.includes(data.entity_type)) {
      errors.push(`entity_type must be one of: ${VALID_ENTITY_TYPES.join(", ")}`);
    }
    if (!data.entity_id) errors.push("entity_id is required");

    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All activities for a workspace (timeline)
  static async findByWorkspace(workspaceId) {
    return db("activities")
      .where("activities.workspace_id", workspaceId)
      .leftJoin("users", "activities.created_by", "users.id")
      .select("activities.*", "users.name as performed_by")
      .orderBy("activities.created_at", "desc");
  }

  // Activities for a specific entity (lead, contact, property, deal)
  static async findByEntity(workspaceId, entityType, entityId) {
    return db("activities")
      .where({
        "activities.workspace_id": workspaceId,
        "activities.entity_type": entityType,
        "activities.entity_id": entityId,
      })
      .leftJoin("users", "activities.created_by", "users.id")
      .select("activities.*", "users.name as performed_by")
      .orderBy("activities.created_at", "desc");
  }

  static async findById(id, workspaceId) {
    return db("activities").where({ id, workspace_id: workspaceId }).first();
  }

  static async create(workspaceId, userId, data) {
    const errors = Activity.validate(data);
    if (errors.length) {
      const err = new Error(errors.join(", "));
      err.statusCode = 400;
      throw err;
    }

    const [id] = await db("activities").insert({
      workspace_id: workspaceId,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      type: data.type,
      description: data.description || null,
      activity_at: data.activity_at ? new Date(data.activity_at) : null,
      created_by: userId,
    });

    return db("activities")
      .where("activities.id", id)
      .leftJoin("users", "activities.created_by", "users.id")
      .select("activities.*", "users.name as performed_by")
      .first();
  }

  static async delete(id, workspaceId) {
    return db("activities").where({ id, workspace_id: workspaceId }).delete();
  }
}

module.exports = Activity;
