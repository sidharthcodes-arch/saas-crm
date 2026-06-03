const Deal = require("../../models/Deal");
const DealItem = require("../../models/DealItems");
const Contact = require("../../models/Contact");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

// ─── Get All Deals ──────────────────────────────────────────────────────────

async function getDeals(workspaceId, filters = {}) {
  const query = db("deals")
    .where("deals.workspace_id", workspaceId)
    .join("contacts", "deals.contact_id", "contacts.id")
    .join("statuses", "deals.status_id", "statuses.id")
    .select(
      "deals.*",
      "contacts.name as contact_name",
      "contacts.phone as contact_phone",
      "statuses.name as status_name"
    )
    .orderBy("deals.created_at", "desc");

  if (filters.status_id) {
    query.where("deals.status_id", filters.status_id);
  }

  if (filters.contact_id) {
    query.where("deals.contact_id", filters.contact_id);
  }

  if (filters.min_amount !== undefined && filters.min_amount !== null && filters.min_amount !== "") {
    query.where("deals.total_amount", ">=", filters.min_amount);
  }

  if (filters.max_amount !== undefined && filters.max_amount !== null && filters.max_amount !== "") {
    query.where("deals.total_amount", "<=", filters.max_amount);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query.where("contacts.name", "LIKE", term);
  }

  return query;
}

// ─── Get Single Deal ─────────────────────────────────────────────────────────

async function getDealById(id, workspaceId) {
  const deal = await Deal.findById(id, workspaceId);

  if (!deal) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  const items = await DealItem.findByDeal(id);

  return { ...deal, items };
}

// ─── Create Deal ────────────────────────────────────────────────────────────

async function createDeal(workspaceId, userId, data) {
  if (!data.contact_id) {
    const err = new Error("contact_id is required");
    err.statusCode = 400;
    throw err;
  }
  if (!data.status_id) {
    const err = new Error("status_id is required");
    err.statusCode = 400;
    throw err;
  }

  // Ensure contact exists and belongs to workspace
  const contact = await Contact.findById(data.contact_id, workspaceId);
  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  const dealId = await Deal.create(workspaceId, {
    contact_id: data.contact_id,
    status_id: data.status_id,
  });

  const deal = await Deal.findById(dealId, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: dealId,
    action: "created",
    after: deal,
  });

  return deal;
}

// ─── Update Deal ────────────────────────────────────────────────────────────

async function updateDeal(id, workspaceId, userId, data) {
  const before = await Deal.findById(id, workspaceId);

  if (!before) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  const updatedData = {
    contact_id: data.contact_id ?? before.contact_id,
    status_id: data.status_id ?? before.status_id,
    closed_at: data.closed_at !== undefined ? data.closed_at : before.closed_at,
  };

  // If updating contact, verify it belongs to workspace
  if (data.contact_id) {
    const contact = await Contact.findById(data.contact_id, workspaceId);
    if (!contact) {
      const err = new Error("Contact not found");
      err.statusCode = 404;
      throw err;
    }
  }

  const errors = Deal.validate(updatedData);
  if (errors.length) {
    const err = new Error(errors.join(", "));
    err.statusCode = 400;
    throw err;
  }

  await Deal.update(id, workspaceId, updatedData);

  const after = await Deal.findById(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: id,
    action: "updated",
    before,
    after,
  });

  return after;
}

// ─── Delete Deal ────────────────────────────────────────────────────────────

async function deleteDeal(id, workspaceId, userId) {
  const deal = await Deal.findById(id, workspaceId);

  if (!deal) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  // Delete all deal items first (explicitly, though DB has cascade)
  await DealItem.deleteByDeal(id);

  // Delete deal
  await Deal.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: id,
    action: "deleted",
    before: deal,
  });

  return { message: "Deal deleted successfully" };
}

// ─── Add Deal Item ──────────────────────────────────────────────────────────

async function addDealItem(dealId, workspaceId, userId, data) {
  const before = await Deal.findById(dealId, workspaceId);
  if (!before) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  if (!data.property_id) {
    const err = new Error("property_id is required");
    err.statusCode = 400;
    throw err;
  }

  if (data.price === undefined || data.price === null) {
    const err = new Error("price is required");
    err.statusCode = 400;
    throw err;
  }

  const priceNum = parseFloat(data.price);
  if (isNaN(priceNum)) {
    const err = new Error("price must be a number");
    err.statusCode = 400;
    throw err;
  }

  if (priceNum < 0) {
    const err = new Error("price cannot be negative");
    err.statusCode = 400;
    throw err;
  }

  // Ensure property exists in the workspace
  const property = await db("properties")
    .where({ id: data.property_id, workspace_id: workspaceId })
    .first();

  if (!property) {
    const err = new Error("Property not found");
    err.statusCode = 404;
    throw err;
  }

  // DealItem.create performs duplication checks
  try {
    const itemId = await DealItem.create(dealId, {
      property_id: data.property_id,
      price: priceNum,
    });

    // Recalculate total_amount on the deal
    await Deal.recalculateTotal(dealId, workspaceId);

    const after = await Deal.findById(dealId, workspaceId);

    // Log update on deal
    await logAudit({
      workspaceId,
      userId,
      entityType: "deal",
      entityId: dealId,
      action: "updated",
      before,
      after,
    });

    return DealItem.findById(itemId);
  } catch (err) {
    if (err.message.includes("already added")) {
      err.statusCode = 400;
    }
    throw err;
  }
}

// ─── Remove Deal Item ───────────────────────────────────────────────────────

async function deleteDealItem(dealId, itemId, workspaceId, userId) {
  const before = await Deal.findById(dealId, workspaceId);
  if (!before) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  const item = await DealItem.findById(itemId);
  if (!item || item.deal_id !== parseInt(dealId)) {
    const err = new Error("Deal item not found");
    err.statusCode = 404;
    throw err;
  }

  await DealItem.delete(itemId);

  // Recalculate total_amount on the deal
  await Deal.recalculateTotal(dealId, workspaceId);

  const after = await Deal.findById(dealId, workspaceId);

  // Log update on deal
  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: dealId,
    action: "updated",
    before,
    after,
  });

  return { message: "Deal item removed successfully" };
}

module.exports = {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  addDealItem,
  deleteDealItem,
};
