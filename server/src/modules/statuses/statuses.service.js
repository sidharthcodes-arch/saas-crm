const { db } = require("../../config/db/db");

async function getStatuses(filters = {}) {
  let query = db("statuses");
  if (filters.context) {
    query = query.where({ context: filters.context });
  }
  return query;
}

module.exports = { getStatuses };
