const { db } = require("../config/db/db");
class Lead {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    status_id: { type: "BIGINT", required: true },
    assigned_to: { type: "BIGINT", required: false, default: null },
    property_id: { type: "BIGINT", required: false, default: null },
    converted_contact_id: { type: "BIGINT", required: false, default: null },
    name: { type: "VARCHAR", required: true },
    phone: { type: "VARCHAR", required: false },
    email: { type: "VARCHAR", required: false },
    created_by: { type: "BIGINT", required: true },
    created_at: { type: "TIMESTAMP", required: false },
    updated_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim() === "") errors.push("name is required");
    if (!data.status_id) errors.push("status_id is required");
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("email is invalid");
    }
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  static async findByWorkspace(workspaceId, filters = {}) {
    const query = db("leads")
      .where("leads.workspace_id", workspaceId)
      .join("statuses", "leads.status_id", "statuses.id")
      .leftJoin("users as assignee", "leads.assigned_to", "assignee.id")
      .leftJoin("properties", "leads.property_id", "properties.id")
      .leftJoin("users as creator", "leads.created_by", "creator.id")
      .select(
        "leads.*",
        "statuses.name as status_name",
        "assignee.name as assigned_to_name",
        "properties.name as property_name",
        "creator.name as created_by_name",
      )
      .orderBy("leads.created_at", "desc");

    if (filters.status_id) query.where("leads.status_id", filters.status_id);
    if (filters.assigned_to)
      query.where("leads.assigned_to", filters.assigned_to);
    if (filters.converted !== undefined) {
      filters.converted
        ? query.whereNotNull("leads.converted_contact_id")
        : query.whereNull("leads.converted_contact_id");
    }

    return query;
  }

  static async findById(id, workspaceId) {
    return db("leads")
      .where("leads.id", id)
      .where("leads.workspace_id", workspaceId)
      .join("statuses", "leads.status_id", "statuses.id")
      .leftJoin("users as assignee", "leads.assigned_to", "assignee.id")
      .leftJoin("properties", "leads.property_id", "properties.id")
      .select(
        "leads.*",
        "statuses.name as status_name",
        "assignee.name as assigned_to_name",
        "properties.name as property_name",
      )
      .first();
  }

  static async create(workspaceId, createdBy, data) {
    const errors = Lead.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("leads").insert({
      workspace_id: workspaceId,
      status_id: data.status_id,
      assigned_to: data.assigned_to || null,
      property_id: data.property_id || null,
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email?.trim().toLowerCase() || null,
      created_by: createdBy,
    });
    return id;
  }

  static async update(id, workspaceId, data) {
    const errors = Lead.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    return db("leads")
      .where({ id, workspace_id: workspaceId })
      .update({
        status_id: data.status_id,
        assigned_to: data.assigned_to || null,
        property_id: data.property_id || null,
        name: data.name.trim(),
        phone: data.phone || null,
        email: data.email?.trim().toLowerCase() || null,
      });
  }

  // Mark lead as converted
  static async markConverted(id, workspaceId, contactId) {
    return db("leads")
      .where({ id, workspace_id: workspaceId })
      .update({ converted_contact_id: contactId });
  }

  static async delete(id, workspaceId) {
    return db("leads").where({ id, workspace_id: workspaceId }).delete();
  }
}

module.exports = Lead;
