const { db } = require("../config/db");

const VALID_TYPES = ["call", "meeting", "note"];
const VALID_RELATED_TYPES = ["lead", "contact", "property", "deal"];

class Activity {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    type: { type: "ENUM", required: true, values: VALID_TYPES },
    related_type: { type: "ENUM", required: true, values: VALID_RELATED_TYPES },
    related_id: { type: "BIGINT", required: true },
    description: { type: "TEXT", required: false },
    user_id: { type: "BIGINT", required: true },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.type) errors.push("type is required");
    if (data.type && !VALID_TYPES.includes(data.type)) {
      errors.push(`type must be one of: ${VALID_TYPES.join(", ")}`);
    }
    if (!data.related_type) errors.push("related_type is required");
    if (data.related_type && !VALID_RELATED_TYPES.includes(data.related_type)) {
      errors.push(
        `related_type must be one of: ${VALID_RELATED_TYPES.join(", ")}`,
      );
    }
    if (!data.related_id) errors.push("related_id is required");
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All activities for workspace (timeline)
  static async findByWorkspace(workspaceId) {
    return db("activities")
      .where("activities.workspace_id", workspaceId)
      .join("users", "activities.user_id", "users.id")
      .select("activities.*", "users.name as performed_by")
      .orderBy("activities.created_at", "desc");
  }

  // Activities for a specific record (lead, contact, property, deal)
  static async findByRelated(workspaceId, relatedType, relatedId) {
    return db("activities")
      .where({
        workspace_id: workspaceId,
        related_type: relatedType,
        related_id: relatedId,
      })
      .join("users", "activities.user_id", "users.id")
      .select("activities.*", "users.name as performed_by")
      .orderBy("activities.created_at", "desc");
  }

  static async findById(id, workspaceId) {
    return db("activities").where({ id, workspace_id: workspaceId }).first();
  }

  static async create(workspaceId, userId, data) {
    const errors = Activity.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("activities").insert({
      workspace_id: workspaceId,
      type: data.type,
      related_type: data.related_type,
      related_id: data.related_id,
      description: data.description || null,
      user_id: userId,
    });
    return id;
  }

  static async delete(id, workspaceId) {
    return db("activities").where({ id, workspace_id: workspaceId }).delete();
  }
}

module.exports = Activity;
