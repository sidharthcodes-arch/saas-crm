const rolesService = require("./roles.service");

// GET /api/v1/roles
async function getRoles(req, res, next) {
  try {
    const roles = await rolesService.getRoles();
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoles };
