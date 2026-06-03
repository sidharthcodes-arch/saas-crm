const Contact = require("../../models/Contact");
const Activity = require("../../models/Activity");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

// ─── Get All Contacts ───────────────────────────────────────────────────────

async function getContacts(workspaceId, filters = {}) {
  const query = db("contacts")
    .where("contacts.workspace_id", workspaceId)
    .leftJoin("leads", "contacts.created_from_lead_id", "leads.id")
    .select("contacts.*", "leads.name as original_lead_name")
    .orderBy("contacts.created_at", "desc");

  if (filters.created_from_lead_id) {
    query.where("contacts.created_from_lead_id", filters.created_from_lead_id);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query.where((builder) => {
      builder
        .whereRaw("contacts.name LIKE ?", [term])
        .orWhereRaw("contacts.email LIKE ?", [term])
        .orWhereRaw("contacts.phone LIKE ?", [term]);
    });
  }

  return query;
}

// ─── Get Single Contact ─────────────────────────────────────────────────────

async function getContactById(id, workspaceId) {
  const contact = await Contact.findById(id, workspaceId);

  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  // Fetch activities for this contact
  const activities = await db("activities")
    .where({ workspace_id: workspaceId, entity_type: "contact", entity_id: id })
    .leftJoin("users", "activities.created_by", "users.id")
    .select("activities.*", "users.name as performed_by")
    .orderBy("activities.created_at", "desc");

  return { ...contact, activities };
}

// ─── Create Contact ─────────────────────────────────────────────────────────

async function createContact(workspaceId, userId, data) {
  if (!data.name || data.name.trim() === "") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }

  // We let Contact.validate perform email checks if present
  const errors = Contact.validate(data);
  if (errors.length) {
    const err = new Error(errors.join(", "));
    err.statusCode = 400;
    throw err;
  }

  const contactId = await Contact.create(workspaceId, {
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    created_from_lead_id: data.created_from_lead_id || null,
  });

  const contact = await Contact.findById(contactId, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "contact",
    entityId: contactId,
    action: "created",
    after: contact,
  });

  return contact;
}

// ─── Update Contact ─────────────────────────────────────────────────────────

async function updateContact(id, workspaceId, userId, data) {
  const before = await Contact.findById(id, workspaceId);

  if (!before) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  const updatedData = {
    name: data.name ?? before.name,
    phone: data.phone !== undefined ? data.phone : before.phone,
    email: data.email !== undefined ? data.email : before.email,
  };

  if (!updatedData.name || updatedData.name.trim() === "") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }

  const errors = Contact.validate(updatedData);
  if (errors.length) {
    const err = new Error(errors.join(", "));
    err.statusCode = 400;
    throw err;
  }

  await Contact.update(id, workspaceId, updatedData);

  const after = await Contact.findById(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "contact",
    entityId: id,
    action: "updated",
    before,
    after,
  });

  return after;
}

// ─── Delete Contact ─────────────────────────────────────────────────────────

async function deleteContact(id, workspaceId, userId) {
  const contact = await Contact.findById(id, workspaceId);

  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  await Contact.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "contact",
    entityId: id,
    action: "deleted",
    before: contact,
  });

  return { message: "Contact deleted successfully" };
}

// ─── Add Activity to Contact ────────────────────────────────────────────────

async function addActivity(id, workspaceId, userId, data) {
  const contact = await Contact.findById(id, workspaceId);

  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  return Activity.create(workspaceId, userId, {
    entity_type: "contact",
    entity_id: id,
    type: data.type,
    description: data.description || null,
    activity_at: data.activity_at || null,
  });
}

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  addActivity,
};
