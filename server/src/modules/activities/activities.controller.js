const activitiesService = require("./activities.service");

async function getActivities(req, res, next) {
  try {
    const list = await activitiesService.getActivities(req.user.workspace_id, req.query);
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function getActivityById(req, res, next) {
  try {
    const activity = await activitiesService.getActivityById(req.params.id, req.user.workspace_id);
    return res.status(200).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActivities,
  getActivityById,
};
