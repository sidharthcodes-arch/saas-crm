const { db } = require("../config/db");

class DealItem {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    deal_id: { type: "BIGINT", required: true },
    property_id: { type: "BIGINT", required: true },
    price: { type: "DECIMAL", required: true },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];

    if (!data.property_id) {
      errors.push("property_id is required");
    }
    if (data.price === undefined || data.price === null) {
      errors.push("price is required");
    }
    if (data.price !== undefined && isNaN(data.price)) {
      errors.push("price must be a number");
    }
    if (data.price !== undefined && data.price < 0) {
      errors.push("price cannot be negative");
    }

    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All items in a deal with full property details
  static async findByDeal(dealId) {
    return db("deal_items")
      .where("deal_items.deal_id", dealId)
      .join("properties", "deal_items.property_id", "properties.id")
      .join(
        "property_types",
        "properties.property_type_id",
        "property_types.id",
      )
      .join("statuses", "properties.status_id", "statuses.id")
      .select(
        "deal_items.*",
        "properties.name as property_name",
        "properties.code as property_code",
        "properties.area_sqft",
        "properties.price as original_price", // original vs deal price
        "property_types.name as property_type",
        "statuses.name as property_status",
      )
      .orderBy("deal_items.created_at", "asc");
  }

  static async findById(id) {
    return db("deal_items")
      .where("deal_items.id", id)
      .join("properties", "deal_items.property_id", "properties.id")
      .select("deal_items.*", "properties.name as property_name")
      .first();
  }

  // Check if a property is already added to this deal
  static async existsInDeal(dealId, propertyId) {
    const item = await db("deal_items")
      .where({ deal_id: dealId, property_id: propertyId })
      .first();
    return !!item;
  }

  static async create(dealId, data) {
    const errors = DealItem.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    // Prevent duplicate property in same deal
    const duplicate = await DealItem.existsInDeal(dealId, data.property_id);
    if (duplicate)
      throw new Error("This property is already added to the deal");

    const [id] = await db("deal_items").insert({
      deal_id: dealId,
      property_id: data.property_id,
      price: data.price,
    });
    return id;
  }

  static async update(id, data) {
    if (data.price === undefined || data.price === null) {
      throw new Error("price is required");
    }
    if (isNaN(data.price)) throw new Error("price must be a number");
    if (data.price < 0) throw new Error("price cannot be negative");

    return db("deal_items").where({ id }).update({ price: data.price });
  }

  static async delete(id) {
    return db("deal_items").where({ id }).delete();
  }

  // Delete all items when a deal is deleted
  static async deleteByDeal(dealId) {
    return db("deal_items").where({ deal_id: dealId }).delete();
  }

  // Sum of all item prices in a deal (used to update deals.total_amount)
  static async sumByDeal(dealId) {
    const result = await db("deal_items")
      .where({ deal_id: dealId })
      .sum("price as total")
      .first();
    return parseFloat(result?.total) || 0;
  }
}

module.exports = DealItem;
