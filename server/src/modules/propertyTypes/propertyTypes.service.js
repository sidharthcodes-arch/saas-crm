const PropertyType = require("../../models/PropertyType");
const { db } = require("../../config/db/db");
const { logAudit } = require("../../utils/audit");

async function getPropertyTypes(workspaceId) {
  return PropertyType.findByWorkspace(workspaceId);
}

async function createPropertyType(workspaceId, userId, data) {
  if (!data.name || data.name.trim() === "") {
    const err = new Error("name is required");
    err.statusCode = 400;
    throw err;
  }

  try {
    const id = await PropertyType.create(workspaceId, {
      name: data.name,
    });

    const propertyType = await PropertyType.findById(id, workspaceId);

    await logAudit({
      workspaceId,
      userId,
      entityType: "property_type",
      entityId: id,
      action: "created",
      after: propertyType,
    });

    return propertyType;
  } catch (err) {
    if (err.message.includes("already exists") || err.message.includes("required")) {
      err.statusCode = 400;
    }
    throw err;
  }
}

async function deletePropertyType(id, workspaceId, userId) {
  const propertyType = await PropertyType.findById(id, workspaceId);
  if (!propertyType) {
    const err = new Error("Property type not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if any properties are referencing this type
  const countRes = await db("properties")
    .where({ property_type_id: id, workspace_id: workspaceId })
    .count("id as count")
    .first();

  if (countRes && countRes.count > 0) {
    const err = new Error("Cannot delete property type because properties are referencing it");
    err.statusCode = 400;
    throw err;
  }

  await PropertyType.delete(id, workspaceId);

  await logAudit({
    workspaceId,
    userId,
    entityType: "property_type",
    entityId: id,
    action: "deleted",
    before: propertyType,
  });

  return { message: "Property type deleted successfully" };
}

module.exports = {
  getPropertyTypes,
  createPropertyType,
  deletePropertyType,
};
