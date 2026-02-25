const { db } = require('../config/db');

class Deal {

  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id:           { type: 'BIGINT',    required: false },
    workspace_id: { type: 'BIGINT',    required: true  },
    contact_id:   { type: 'BIGINT',    required: true  },
    status_id:    { type: 'BIGINT',    required: true  },
    total_amount: { type: 'DECIMAL',   required: false, default: 0 },
    closed_at:    { type: 'TIMESTAMP', required: false, default: null },
    created_at:   { type: 'TIMESTAMP', required: false },
    updated_at:   { type: 'TIMESTAMP', required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.contact_id) errors.push('contact_id is required');
    if (!data.status_id)  errors.push('status_id is required');
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  static async findByWorkspace(workspaceId, filters = {}) {
    const query = db('deals')
      .where('deals.workspace_id', workspaceId)
      .join('contacts', 'deals.contact_id', 'contacts.id')
      .join('statuses', 'deals.status_id', 'statuses.id')
      .select(
        'deals.*',
        'contacts.name as contact_name',
        'contacts.phone as contact_phone',
        'statuses.name as status_name'
      )
      .orderBy('deals.created_at', 'desc');

    if (filters.status_id)  query.where('deals.status_id', filters.status_id);
    if (filters.contact_id) query.where('deals.contact_id', filters.contact_id);

    return query;
  }

  static async findById(id, workspaceId) {
    return db('deals')
      .where('deals.id', id)
      .where('deals.workspace_id', workspaceId)
      .join('contacts', 'deals.contact_id', 'contacts.id')
      .join('statuses', 'deals.status_id', 'statuses.id')
      .select(
        'deals.*',
        'contacts.name as contact_name',
        'contacts.phone as contact_phone',
        'statuses.name as status_name'
      )
      .first();
  }

  static async create(workspaceId, data) {
    const errors = Deal.validate(data);
    if (errors.length) throw new Error(errors.join(', '));

    const [id] = await db('deals').insert({
      workspace_id: workspaceId,
      contact_id:   data.contact_id,
      status_id:    data.status_id,
      total_amount: 0, // calculated after deal_items are added
      closed_at:    null,
    });
    return id;
  }

  static async update(id, workspaceId, data) {
    const errors = Deal.validate(data);
    if (errors.length) throw new Error(errors.join(', '));

    return db('deals')
      .where({ id, workspace_id: workspaceId })
      .update({
        contact_id: data.contact_id,
        status_id:  data.status_id,
        closed_at:  data.closed_at || null,
      });
  }

  // Recalculate total_amount from deal_items (called after items are added/removed)
  static async recalculateTotal(id, workspaceId) {
    const result = await db('deal_items')
      .where({ deal_id: id })
      .sum('price as total')
      .first();

    const total = result?.total || 0;

    await db('deals')
      .where({ id, workspace_id: workspaceId })
      .update({ total_amount: total });

    return total;
  }

  static async delete(id, workspaceId) {
    return db('deals').where({ id, workspace_id: workspaceId }).delete();
  }
}

class DealItem {

  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id:          { type: 'BIGINT',    required: false },
    deal_id:     { type: 'BIGINT',    required: true  },
    property_id: { type: 'BIGINT',    required: true  },
    price:       { type: 'DECIMAL',   required: true  },
    created_at:  { type: 'TIMESTAMP', required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.property_id) errors.push('property_id is required');
    if (!data.price && data.price !== 0) errors.push('price is required');
    if (isNaN(data.price)) errors.push('price must be a number');
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All items in a deal with property details
  static async findByDeal(dealId) {
    return db('deal_items')
      .where('deal_items.deal_id', dealId)
      .join('properties', 'deal_items.property_id', 'properties.id')
      .select(
        'deal_items.*',
        'properties.name as property_name',
        'properties.code as property_code',
        'properties.area_sqft'
      )
      .orderBy('deal_items.created_at', 'asc');
  }

  static async findById(id) {
    return db('deal_items').where({ id }).first();
  }

  static async create(dealId, data) {
    const errors = DealItem.validate(data);
    if (errors.length) throw new Error(errors.join(', '));

    const [id] = await db('deal_items').insert({
      deal_id:     dealId,
      property_id: data.property_id,
      price:       data.price,
    });
    return id;
  }

  static async delete(id) {
    return db('deal_items').where({ id }).delete();
  }

  static async deleteByDeal(dealId) {
    return db('deal_items').where({ deal_id: dealId }).delete();
  }
}

module.exports = { Deal, DealItem };