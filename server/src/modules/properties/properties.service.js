const Property = require("../../models/Property");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

async function getProperties(workspaceId, filters = {}) {
  const query = db("properties")
    .where("properties.workspace_id", workspaceId)
    .join("property_types", "properties.property_type_id", "property_types.id")
    .join("statuses", "properties.status_id", "statuses.id")
    .select(
      "properties.*",
      "property_types.name as property_type_name",
      "statuses.name as status_name"
    )
    .orderBy("properties.created_at", "desc");

  if (filters.status) {
    query.where("statuses.name", filters.status);
  }

  if (filters.property_type_id) {
    query.where("properties.property_type_id", filters.property_type_id);
  }

  if (filters.min_price !== undefined && filters.min_price !== null && filters.min_price !== "") {
    query.where("properties.price", ">=", filters.min_price);
  }

  if (filters.max_price !== undefined && filters.max_price !== null && filters.max_price !== "") {
    query.where("properties.price", "<=", filters.max_price);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query.where((builder) => {
      builder.where("properties.name", "LIKE", term)
             .orWhere("properties.code", "LIKE", term);
    });
  }

  return query;
}

async function getPropertyById(id, workspaceId) {
  const property = await Property.findById(id, workspaceId);
  if (!property) {
    const err = new Error("Property not found");
    err.statusCode = 404;
    throw err;
  }

  // Fetch linked deals where this property appears
  const deals = await db("deal_items")
    .where("deal_items.property_id", id)
    .join("deals", "deal_items.deal_id", "deals.id")
    .join("contacts", "deals.contact_id", "contacts.id")
    .join("statuses", "deals.status_id", "statuses.id")
    .select(
      "deals.id as deal_id",
      "deals.total_amount",
      "deals.created_at",
      "contacts.name as contact_name",
      "statuses.name as status_name",
      "deal_items.price as deal_price"
    );

  return { ...property, deals };
}

async function createProperty(workspaceId, userId, data) {
  // Default status to "Available" automatically
  const availableStatus = await db("statuses")
    .where({ name: "Available", context: "property" })
    .first();

  if (!availableStatus) {
    const err = new Error("Default property status 'Available' not found");
    err.statusCode = 500;
    throw err;
  }

  // Ensure property type exists in workspace
  if (data.property_type_id) {
    const propType = await db("property_types")
      .where({ id: data.property_type_id, workspace_id: workspaceId })
      .first();
    if (!propType) {
      const err = new Error("Property type not found");
      err.statusCode = 400;
      throw err;
    }
  }

  const propertyData = {
    property_type_id: data.property_type_id,
    parent_property_id: data.parent_property_id || null,
    status_id: availableStatus.id,
    name: data.name,
    code: data.code,
    area_sqft: data.area_sqft,
    price: data.price,
    is_sellable: data.is_sellable !== undefined ? data.is_sellable : true,
  };

  try {
    const id = await Property.create(workspaceId, propertyData);
    const property = await Property.findById(id, workspaceId);

    await logAudit({
      workspaceId,
      userId,
      entityType: "property",
      entityId: id,
      action: "created",
      after: property,
    });

    return property;
  } catch (err) {
    if (err.message.includes("required") || err.message.includes("must be") || err.message.includes("cannot be")) {
      err.statusCode = 400;
    }
    throw err;
  }
}

async function updateProperty(id, workspaceId, userId, data) {
  const before = await Property.findById(id, workspaceId);
  if (!before) {
    const err = new Error("Property not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure property type exists in workspace if updating it
  if (data.property_type_id) {
    const propType = await db("property_types")
      .where({ id: data.property_type_id, workspace_id: workspaceId })
      .first();
    if (!propType) {
      const err = new Error("Property type not found");
      err.statusCode = 400;
      throw err;
    }
  }

  const updatedData = {
    property_type_id: data.property_type_id ?? before.property_type_id,
    parent_property_id: data.parent_property_id !== undefined ? data.parent_property_id : before.parent_property_id,
    name: data.name ?? before.name,
    code: data.code ?? before.code,
    area_sqft: data.area_sqft ?? before.area_sqft,
    price: data.price ?? before.price,
    is_sellable: data.is_sellable !== undefined ? data.is_sellable : before.is_sellable,
    status_id: before.status_id, // do NOT allow manual status updates here
  };

  try {
    await Property.update(id, workspaceId, updatedData);
    const after = await Property.findById(id, workspaceId);

    await logAudit({
      workspaceId,
      userId,
      entityType: "property",
      entityId: id,
      action: "updated",
      before,
      after,
    });

    return after;
  } catch (err) {
    if (err.message.includes("required") || err.message.includes("must be") || err.message.includes("cannot be")) {
      err.statusCode = 400;
    }
    throw err;
  }
}

async function deleteProperty(id, workspaceId, userId) {
  const property = await Property.findById(id, workspaceId);
  if (!property) {
    const err = new Error("Property not found");
    err.statusCode = 404;
    throw err;
  }

  // Only allow delete if status is "Available"
  if (property.status_name !== "Available") {
    const err = new Error("Cannot delete a reserved or sold property");
    err.statusCode = 400;
    throw err;
  }

  await Property.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "property",
    entityId: id,
    action: "deleted",
    before: property,
  });

  return { message: "Property deleted successfully" };
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
