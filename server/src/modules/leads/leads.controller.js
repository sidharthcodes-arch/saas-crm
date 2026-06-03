const leadsService = require("./leads.service");

// GET /api/v1/leads
async function getLeads(req, res, next) {
  try {
    const { status_id, assigned_to, source, search } = req.query;
    const leads = await leadsService.getLeads(req.user.workspace_id, {
      status_id,
      assigned_to,
      source,
      search,
    });
    return res.status(200).json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/leads/:id
async function getLeadById(req, res, next) {
  try {
    const lead = await leadsService.getLeadById(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/leads
async function createLead(req, res, next) {
  try {
    const lead = await leadsService.createLead(
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/leads/:id
async function updateLead(req, res, next) {
  try {
    const lead = await leadsService.updateLead(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/leads/:id
async function deleteLead(req, res, next) {
  try {
    const result = await leadsService.deleteLead(
      req.params.id,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/leads/:id/assign
async function assignLead(req, res, next) {
  try {
    const lead = await leadsService.assignLead(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body.user_id
    );
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/leads/:id/convert
async function convertLead(req, res, next) {
  try {
    const contact = await leadsService.convertLead(
      req.params.id,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/leads/:id/activities
async function addActivity(req, res, next) {
  try {
    const activity = await leadsService.addActivity(
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
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  convertLead,
  addActivity,
};
