const dealsService = require("./deals.service");

// GET /api/v1/deals
async function getDeals(req, res, next) {
  try {
    const { status_id, contact_id, min_amount, max_amount, search } = req.query;
    const deals = await dealsService.getDeals(req.user.workspace_id, {
      status_id,
      contact_id,
      min_amount,
      max_amount,
      search,
    });
    return res.status(200).json({ success: true, data: deals });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/deals/:id
async function getDealById(req, res, next) {
  try {
    const deal = await dealsService.getDealById(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, data: deal });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/deals
async function createDeal(req, res, next) {
  try {
    const deal = await dealsService.createDeal(
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: deal });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/deals/:id
async function updateDeal(req, res, next) {
  try {
    const deal = await dealsService.updateDeal(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(200).json({ success: true, data: deal });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/deals/:id
async function deleteDeal(req, res, next) {
  try {
    const result = await dealsService.deleteDeal(
      req.params.id,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/deals/:id/items
async function addDealItem(req, res, next) {
  try {
    const item = await dealsService.addDealItem(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/deals/:id/items/:itemId
async function deleteDealItem(req, res, next) {
  try {
    const result = await dealsService.deleteDealItem(
      req.params.id,
      req.params.itemId,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/deals/:id/activities
async function addActivity(req, res, next) {
  try {
    const activity = await dealsService.addActivity(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  addDealItem,
  deleteDealItem,
  addActivity,
};
