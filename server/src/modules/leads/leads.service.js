const Lead = require("../../models/Lead");
const Contact = require("../../models/Contact");
const Activity = require("../../models/Activity");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

// ─── Get All Leads ────────────────────────────────────────────────────────

async function getLeads(workspaceId, filters = {}) {
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
      "creator.name as created_by_name"
    )
    .orderBy("leads.created_at", "desc");

  if (filters.status_id) query.where("leads.status_id", filters.status_id);
  if (filters.assigned_to) query.where("leads.assigned_to", filters.assigned_to);
  if (filters.source) query.where("leads.source", filters.source);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query.where((builder) => {
      builder
        .whereRaw("leads.name LIKE ?", [term])
        .orWhereRaw("leads.email LIKE ?", [term])
        .orWhereRaw("leads.phone LIKE ?", [term]);
    });
  }

  return query;
}

// ─── Get Single Lead ──────────────────────────────────────────────────────

async function getLeadById(id, workspaceId) {
  const lead = await Lead.findById(id, workspaceId);

  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  // Fetch activities for this lead
  const activities = await db("activities")
    .where({
      "activities.workspace_id": workspaceId,
      "activities.entity_type": "lead",
      "activities.entity_id": id,
    })
    .leftJoin("users", "activities.created_by", "users.id")
    .select("activities.*", "users.name as performed_by")
    .orderBy("activities.created_at", "desc");

  return { ...lead, activities };
}

// ─── Create Lead ──────────────────────────────────────────────────────────

async function createLead(workspaceId, userId, data) {
  if (!data.name || data.name.trim() === "") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }
  if (!data.status_id) {
    const err = new Error("status_id is required");
    err.statusCode = 400;
    throw err;
  }
  if (!data.phone) {
    const err = new Error("phone is required");
    err.statusCode = 400;
    throw err;
  }

  const leadId = await Lead.create(workspaceId, userId, {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    status_id: data.status_id,
    source: data.source || null,
    assigned_to: data.assigned_to || null,
    property_id: data.property_id || null,
  });

  const lead = await Lead.findById(leadId, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "lead",
    entityId: leadId,
    action: "created",
    after: lead,
  });

  return lead;
}

// ─── Update Lead ──────────────────────────────────────────────────────────

async function updateLead(id, workspaceId, userId, data) {
  const before = await Lead.findById(id, workspaceId);

  if (!before) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  // Merge so partial updates don't wipe fields
  await Lead.update(id, workspaceId, {
    name: data.name ?? before.name,
    phone: data.phone ?? before.phone,
    email: data.email ?? before.email,
    status_id: data.status_id ?? before.status_id,
    source: data.source ?? before.source,
    assigned_to: data.assigned_to !== undefined ? data.assigned_to : before.assigned_to,
    property_id: data.property_id !== undefined ? data.property_id : before.property_id,
  });

  const after = await Lead.findById(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "lead",
    entityId: id,
    action: "updated",
    before,
    after,
  });

  return after;
}

// ─── Delete Lead ──────────────────────────────────────────────────────────

async function deleteLead(id, workspaceId, userId) {
  const lead = await Lead.findById(id, workspaceId);

  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  await Lead.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "lead",
    entityId: id,
    action: "deleted",
    before: lead,
  });

  return { message: "Lead deleted successfully" };
}

// ─── Assign Lead ──────────────────────────────────────────────────────────

async function assignLead(id, workspaceId, userId, assigneeId) {
  const lead = await Lead.findById(id, workspaceId);

  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  if (!assigneeId) {
    const err = new Error("user_id is required");
    err.statusCode = 400;
    throw err;
  }

  await db("leads")
    .where({ id, workspace_id: workspaceId })
    .update({ assigned_to: assigneeId });

  return Lead.findById(id, workspaceId);
}

// ─── Convert Lead to Contact ──────────────────────────────────────────────

async function convertLead(id, workspaceId, userId) {
  const lead = await Lead.findById(id, workspaceId);

  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  if (lead.converted_contact_id) {
    const err = new Error("Lead has already been converted");
    err.statusCode = 400;
    throw err;
  }

  // Create contact from lead data
  const contactId = await Contact.create(workspaceId, {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    created_from_lead_id: lead.id,
  });

  // Find the "converted" status for leads
  const convertedStatus = await db("statuses")
    .where({ context: "lead" })
    .whereRaw("LOWER(name) = ?", ["converted"])
    .first();

  // Mark lead as converted
  await Lead.markConverted(id, workspaceId, contactId);

  // Update status if a "converted" status exists
  if (convertedStatus) {
    await db("leads")
      .where({ id, workspace_id: workspaceId })
      .update({ status_id: convertedStatus.id });
  }

  const contact = await Contact.findById(contactId, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "lead",
    entityId: id,
    action: "updated",
    before: lead,
    after: { ...lead, converted_contact_id: contactId },
  });

  return contact;
}

// ─── Add Activity to Lead ─────────────────────────────────────────────────

async function addActivity(id, workspaceId, userId, data) {
  const lead = await Lead.findById(id, workspaceId);

  if (!lead) {
    const err = new Error("Lead not found");
    err.statusCode = 404;
    throw err;
  }

  // Activity.create handles type validation and throws 400 on bad input
  return Activity.create(workspaceId, userId, {
    entity_type: "lead",
    entity_id: id,
    type: data.type,
    description: data.description || null,
    activity_at: data.activity_at || null,
  });
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  convertLead,
  addActivity,
};
