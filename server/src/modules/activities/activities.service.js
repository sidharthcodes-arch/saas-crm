const { db } = require("../../config/db/db");

async function getActivities(workspaceId, filters = {}) {
  const query = db("activities")
    .where("activities.workspace_id", workspaceId)
    .leftJoin("users", "activities.created_by", "users.id")
    .select("activities.*", "users.name as performed_by")
    .orderBy("activities.created_at", "desc");

  if (filters.entity_type) {
    query.where("activities.entity_type", filters.entity_type);
  }

  if (filters.entity_id) {
    query.where("activities.entity_id", filters.entity_id);
  }

  if (filters.type) {
    query.where("activities.type", filters.type);
  }

  if (filters.created_by) {
    query.where("activities.created_by", filters.created_by);
  }

  return query;
}

async function getActivityById(id, workspaceId) {
  const activity = await db("activities")
    .where("activities.id", id)
    .where("activities.workspace_id", workspaceId)
    .leftJoin("users", "activities.created_by", "users.id")
    .select("activities.*", "users.name as performed_by")
    .first();

  if (!activity) {
    const err = new Error("Activity not found");
    err.statusCode = 404;
    throw err;
  }

  return activity;
}

module.exports = {
  getActivities,
  getActivityById,
};
