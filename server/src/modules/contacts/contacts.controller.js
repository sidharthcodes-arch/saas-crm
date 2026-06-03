const contactsService = require("./contacts.service");

// GET /api/v1/contacts
async function getContacts(req, res, next) {
  try {
    const { created_from_lead_id, search } = req.query;
    const contacts = await contactsService.getContacts(req.user.workspace_id, {
      created_from_lead_id,
      search,
    });
    return res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/contacts/:id
async function getContactById(req, res, next) {
  try {
    const contact = await contactsService.getContactById(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/contacts
async function createContact(req, res, next) {
  try {
    const contact = await contactsService.createContact(
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/contacts/:id
async function updateContact(req, res, next) {
  try {
    const contact = await contactsService.updateContact(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(200).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/contacts/:id
async function deleteContact(req, res, next) {
  try {
    const result = await contactsService.deleteContact(
      req.params.id,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/contacts/:id/activities
async function addActivity(req, res, next) {
  try {
    const activity = await contactsService.addActivity(
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
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  addActivity,
};
