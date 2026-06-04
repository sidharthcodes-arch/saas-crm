const { db } = require("../config/db/db");

class Property {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    property_type_id: { type: "BIGINT", required: true },
    parent_property_id: { type: "BIGINT", required: false, default: null },
    status_id: { type: "BIGINT", required: true },
    name: { type: "VARCHAR", required: true },
    code: { type: "VARCHAR", required: true },
    area_sqft: { type: "DECIMAL", required: true },
    price: { type: "DECIMAL", required: true },
    is_sellable: { type: "BOOLEAN", required: false, default: true },
    created_at: { type: "TIMESTAMP", required: false },
    updated_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim() === "") errors.push("name is required");
    if (!data.code || data.code.trim() === "") errors.push("code is required");
    if (!data.property_type_id) errors.push("property_type_id is required");
    if (!data.status_id) errors.push("status_id is required");

    if (data.price !== undefined && data.price !== null) {
      if (isNaN(data.price)) errors.push("price must be a number");
      else if (data.price < 0) errors.push("price cannot be negative");
    } else {
      errors.push("price is required");
    }

    if (data.area_sqft !== undefined && data.area_sqft !== null) {
      if (isNaN(data.area_sqft)) errors.push("area_sqft must be a number");
      else if (data.area_sqft <= 0) errors.push("area_sqft must be greater than 0");
    } else {
      errors.push("area_sqft is required");
    }

    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────
  static async findById(id, workspaceId) {
    return db("properties")
      .where("properties.id", id)
      .where("properties.workspace_id", workspaceId)
      .join("property_types", "properties.property_type_id", "property_types.id")
      .join("statuses", "properties.status_id", "statuses.id")
      .select(
        "properties.*",
        "property_types.name as property_type_name",
        "statuses.name as status_name"
      )
      .first();
  }

  static async create(workspaceId, data) {
    const errors = Property.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("properties").insert({
      workspace_id: workspaceId,
      property_type_id: data.property_type_id,
      parent_property_id: data.parent_property_id || null,
      status_id: data.status_id,
      name: data.name.trim(),
      code: data.code.trim(),
      area_sqft: data.area_sqft,
      price: data.price,
      is_sellable: data.is_sellable !== undefined ? data.is_sellable : true,
    });
    return id;
  }

  static async update(id, workspaceId, data) {
    const errors = Property.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    return db("properties")
      .where({ id, workspace_id: workspaceId })
      .update({
        property_type_id: data.property_type_id,
        parent_property_id: data.parent_property_id || null,
        name: data.name.trim(),
        code: data.code.trim(),
        area_sqft: data.area_sqft,
        price: data.price,
        is_sellable: data.is_sellable !== undefined ? data.is_sellable : true,
      });
  }

  static async delete(id, workspaceId) {
    return db("properties").where({ id, workspace_id: workspaceId }).delete();
  }
}

module.exports = Property;
