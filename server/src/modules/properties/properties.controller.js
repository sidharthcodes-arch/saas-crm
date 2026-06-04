const propertiesService = require("./properties.service");

async function getProperties(req, res, next) {
  try {
    const list = await propertiesService.getProperties(
      req.user.workspace_id,
      req.query
    );
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function getPropertyById(req, res, next) {
  try {
    const property = await propertiesService.getPropertyById(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
}

async function createProperty(req, res, next) {
  try {
    const property = await propertiesService.createProperty(
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const property = await propertiesService.updateProperty(
      req.params.id,
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(200).json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const result = await propertiesService.deleteProperty(
      req.params.id,
      req.user.workspace_id,
      req.user.id
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
