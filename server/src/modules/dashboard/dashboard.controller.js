const dashboardService = require("./dashboard.service");

async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats(req.user.workspace_id);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
};
