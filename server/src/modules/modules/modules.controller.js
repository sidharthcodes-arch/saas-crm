const modulesService = require("./modules.service");

// GET /api/v1/modules
async function getModules(req, res, next) {
  try {
    const modules = await modulesService.getModules();
    return res.status(200).json({ success: true, data: modules });
  } catch (err) {
    next(err);
  }
}

module.exports = { getModules };
