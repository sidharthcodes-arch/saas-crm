const statusesService = require("./statuses.service");

// GET /api/v1/statuses
async function getStatuses(req, res, next) {
  try {
    const { context } = req.query;
    const statuses = await statusesService.getStatuses({ context });
    return res.status(200).json({ success: true, data: statuses });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatuses };
