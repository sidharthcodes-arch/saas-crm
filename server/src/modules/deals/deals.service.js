const Deal = require("../../models/Deal");
const DealItem = require("../../models/DealItems");
const Contact = require("../../models/Contact");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getStatusId(context, name) {
  const status = await db("statuses").where({ context, name }).first();
  return status ? status.id : null;
}

async function getStatusName(statusId) {
  const status = await db("statuses").where({ id: statusId }).first();
  return status ? status.name : null;
}

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
      "statuses.name as status_name",
    )
    .orderBy("deals.created_at", "desc");

  if (filters.status_id) {
    query.where("deals.status_id", filters.status_id);
  }

  if (filters.contact_id) {
    query.where("deals.contact_id", filters.contact_id);
  }

  if (
    filters.min_amount !== undefined &&
    filters.min_amount !== null &&
    filters.min_amount !== ""
  ) {
    query.where("deals.total_amount", ">=", filters.min_amount);
  }

  if (
    filters.max_amount !== undefined &&
    filters.max_amount !== null &&
    filters.max_amount !== ""
  ) {
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

  // 1. Validate contact exists in workspace
  const contact = await Contact.findById(data.contact_id, workspaceId);
  if (!contact) {
    const err = new Error("Contact not found");
    err.statusCode = 404;
    throw err;
  }

  // 2. Create the deal with contact_id and status_id (initial total_amount = 0)
  const dealId = await Deal.create(workspaceId, {
    contact_id: data.contact_id,
    status_id: data.status_id,
  });

  // 3. Check if property_id exists in request body
  if (data.property_id) {
    // Validate price is also provided
    if (data.price === undefined || data.price === null) {
      const err = new Error("price is required when property_id is provided");
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

    // Find property in workspace
    const property = await db("properties")
      .where({ id: data.property_id, workspace_id: workspaceId })
      .first();

    if (!property) {
      const err = new Error("Property not found");
      err.statusCode = 404;
      throw err;
    }

    // Check property status is "Available"
    const availableStatusId = await getStatusId("property", "Available");
    if (property.status_id !== availableStatusId) {
      const err = new Error("Property is not available");
      err.statusCode = 400;
      throw err;
    }

    // Create deal_item
    await DealItem.create(dealId, {
      property_id: data.property_id,
      price: priceNum,
    });

    // Recalculate deal total_amount
    await Deal.recalculateTotal(dealId, workspaceId);

    // Update property status to "Reserved"
    const reservedStatusId = await getStatusId("property", "Reserved");
    await db("properties")
      .where({ id: data.property_id })
      .update({ status_id: reservedStatusId });
  }

  // Fetch final deal with joined fields and items
  const deal = await Deal.findById(dealId, workspaceId);
  const items = await DealItem.findByDeal(dealId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: dealId,
    action: "created",
    after: { ...deal, items },
  });

  return { ...deal, items };
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

  // If status is changing, handle property status updates (Won, Lost, Open, Negotiation)
  if (data.status_id && data.status_id !== before.status_id) {
    const newStatusName = await getStatusName(data.status_id);
    const oldStatusName = before.status_name;
    const items = await DealItem.findByDeal(id);

    if (newStatusName === "Won") {
      // Won deal → properties become Sold
      const soldStatusId = await getStatusId("property", "Sold");
      for (const item of items) {
        await db("properties")
          .where({ id: item.property_id })
          .update({ status_id: soldStatusId });
      }
    } else if (newStatusName === "Lost") {
      // Lost deal → properties back to Available
      const availableStatusId = await getStatusId("property", "Available");
      for (const item of items) {
        await db("properties")
          .where({ id: item.property_id })
          .update({ status_id: availableStatusId });
      }
    } else if (
      (oldStatusName === "Won" || oldStatusName === "Lost") &&
      (newStatusName === "Open" || newStatusName === "Negotiation")
    ) {
      // Transitioning back to active deal state → properties become Reserved
      const reservedStatusId = await getStatusId("property", "Reserved");
      for (const item of items) {
        await db("properties")
          .where({ id: item.property_id })
          .update({ status_id: reservedStatusId });
      }
    }
  }

  const after = await Deal.findById(id, workspaceId);
  const items = await DealItem.findByDeal(id);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: id,
    action: "updated",
    before,
    after: { ...after, items },
  });

  return { ...after, items };
}

// ─── Delete Deal ────────────────────────────────────────────────────────────

async function deleteDeal(id, workspaceId, userId) {
  const deal = await Deal.findById(id, workspaceId);

  if (!deal) {
    const err = new Error("Deal not found");
    err.statusCode = 404;
    throw err;
  }

  // Get items to mark properties back to Available
  const items = await DealItem.findByDeal(id);
  const availableStatusId = await getStatusId("property", "Available");

  for (const item of items) {
    await db("properties")
      .where({ id: item.property_id })
      .update({ status_id: availableStatusId });
  }

  // Delete all deal items (explicitly, though DB has cascade)
  await DealItem.deleteByDeal(id);

  // Delete deal
  await Deal.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: id,
    action: "deleted",
    before: { ...deal, items },
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

  // Adding items still validates property is Available
  const availableStatusId = await getStatusId("property", "Available");
  if (property.status_id !== availableStatusId) {
    const err = new Error("Property is not available");
    err.statusCode = 400;
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

    // Update property status to "Reserved"
    const reservedStatusId = await getStatusId("property", "Reserved");
    await db("properties")
      .where({ id: data.property_id })
      .update({ status_id: reservedStatusId });

    const after = await Deal.findById(dealId, workspaceId);
    const items = await DealItem.findByDeal(dealId);

    // Log update on deal
    await logAudit({
      workspaceId,
      userId,
      entityType: "deal",
      entityId: dealId,
      action: "updated",
      before,
      after: { ...after, items },
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

  // Delete deal item
  await DealItem.delete(itemId);

  // Recalculate total_amount on the deal
  await Deal.recalculateTotal(dealId, workspaceId);

  // Mark property back to Available
  const availableStatusId = await getStatusId("property", "Available");
  await db("properties")
    .where({ id: item.property_id })
    .update({ status_id: availableStatusId });

  const after = await Deal.findById(dealId, workspaceId);
  const items = await DealItem.findByDeal(dealId);

  // Log update on deal
  await logAudit({
    workspaceId,
    userId,
    entityType: "deal",
    entityId: dealId,
    action: "updated",
    before,
    after: { ...after, items },
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
