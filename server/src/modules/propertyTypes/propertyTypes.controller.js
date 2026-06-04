const propertyTypesService = require("./propertyTypes.service");

async function getPropertyTypes(req, res, next) {
  try {
    const list = await propertyTypesService.getPropertyTypes(req.user.workspace_id);
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function createPropertyType(req, res, next) {
  try {
    const propertyType = await propertyTypesService.createPropertyType(
      req.user.workspace_id,
      req.user.id,
      req.body
    );
    return res.status(201).json({ success: true, data: propertyType });
  } catch (err) {
    next(err);
  }
}

async function deletePropertyType(req, res, next) {
  try {
    const result = await propertyTypesService.deletePropertyType(
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
  getPropertyTypes,
  createPropertyType,
  deletePropertyType,
};
