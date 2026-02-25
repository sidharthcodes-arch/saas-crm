const { db } = require("../config/db");

class Contact {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    created_from_lead_id: { type: "BIGINT", required: false, default: null },
    name: { type: "VARCHAR", required: true },
    phone: { type: "VARCHAR", required: false },
    email: { type: "VARCHAR", required: false },
    created_at: { type: "TIMESTAMP", required: false },
    updated_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim() === "") errors.push("name is required");
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("email is invalid");
    }
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  static async findByWorkspace(workspaceId) {
    return db("contacts")
      .where({ workspace_id: workspaceId })
      .leftJoin("leads", "contacts.created_from_lead_id", "leads.id")
      .select("contacts.*", "leads.name as original_lead_name")
      .orderBy("contacts.created_at", "desc");
  }

  static async findById(id, workspaceId) {
    return db("contacts")
      .where("contacts.id", id)
      .where("contacts.workspace_id", workspaceId)
      .leftJoin("leads", "contacts.created_from_lead_id", "leads.id")
      .select("contacts.*", "leads.name as original_lead_name")
      .first();
  }

  // Create contact manually (not from lead conversion)
  static async create(workspaceId, data) {
    const errors = Contact.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("contacts").insert({
      workspace_id: workspaceId,
      created_from_lead_id: data.created_from_lead_id || null,
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email?.trim().toLowerCase() || null,
    });
    return id;
  }

  static async update(id, workspaceId, data) {
    const errors = Contact.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    return db("contacts")
      .where({ id, workspace_id: workspaceId })
      .update({
        name: data.name.trim(),
        phone: data.phone || null,
        email: data.email?.trim().toLowerCase() || null,
      });
  }

  static async delete(id, workspaceId) {
    return db("contacts").where({ id, workspace_id: workspaceId }).delete();
  }
}

module.exports = Contact;
