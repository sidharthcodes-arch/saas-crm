const { db } = require("../../config/db/db");

async function getDashboardStats(workspaceId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // ─── Leads Stats ──────────────────────────────────────────────────────────
  const leadsTotal = await db("leads")
    .where({ workspace_id: workspaceId })
    .count("id as count")
    .first();
  const leadsTotalCount = parseInt(leadsTotal?.count || 0, 10);

  const leadsNewThisMonth = await db("leads")
    .where("workspace_id", workspaceId)
    .where("created_at", ">=", startOfMonth)
    .count("id as count")
    .first();
  const leadsNewCount = parseInt(leadsNewThisMonth?.count || 0, 10);

  const leadsByStatusRaw = await db("leads")
    .where("leads.workspace_id", workspaceId)
    .join("statuses", "leads.status_id", "statuses.id")
    .select("statuses.name as status_name")
    .count("leads.id as count")
    .groupBy("leads.status_id", "statuses.name");

  const leadsByStatus = leadsByStatusRaw.map((row) => ({
    status_name: row.status_name,
    count: parseInt(row.count || 0, 10),
  }));

  // ─── Contacts Stats ───────────────────────────────────────────────────────
  const contactsTotal = await db("contacts")
    .where({ workspace_id: workspaceId })
    .count("id as count")
    .first();
  const contactsTotalCount = parseInt(contactsTotal?.count || 0, 10);

  const contactsNewThisMonth = await db("contacts")
    .where("workspace_id", workspaceId)
    .where("created_at", ">=", startOfMonth)
    .count("id as count")
    .first();
  const contactsNewCount = parseInt(contactsNewThisMonth?.count || 0, 10);

  // ─── Deals Stats ──────────────────────────────────────────────────────────
  const dealsStats = await db("deals")
    .where("workspace_id", workspaceId)
    .select(
      db.raw("COUNT(id) as total_count"),
      db.raw("COALESCE(SUM(total_amount), 0) as total_sum")
    )
    .first();

  const dealsTotalCount = parseInt(dealsStats?.total_count || 0, 10);
  const dealsTotalValue = parseFloat(dealsStats?.total_sum || 0);

  const dealsByStatusRaw = await db("deals")
    .where("deals.workspace_id", workspaceId)
    .join("statuses", "deals.status_id", "statuses.id")
    .select("statuses.name as status_name")
    .select(
      db.raw("COUNT(deals.id) as count"),
      db.raw("COALESCE(SUM(deals.total_amount), 0) as value")
    )
    .groupBy("statuses.name");

  let won = { count: 0, value: 0 };
  let lost = { count: 0 };
  let open = { count: 0, value: 0 };

  for (const row of dealsByStatusRaw) {
    const count = parseInt(row.count || 0, 10);
    const value = parseFloat(row.value || 0);

    if (row.status_name === "Won") {
      won = { count, value };
    } else if (row.status_name === "Lost") {
      lost = { count };
    } else {
      open.count += count;
      open.value += value;
    }
  }

  // ─── Properties Stats ─────────────────────────────────────────────────────
  const propByStatusRaw = await db("properties")
    .where("properties.workspace_id", workspaceId)
    .join("statuses", "properties.status_id", "statuses.id")
    .select("statuses.name as status_name")
    .count("properties.id as count")
    .groupBy("statuses.name");

  let propertiesTotalCount = 0;
  let availableCount = 0;
  let reservedCount = 0;
  let soldCount = 0;

  for (const row of propByStatusRaw) {
    const count = parseInt(row.count || 0, 10);
    propertiesTotalCount += count;

    if (row.status_name === "Available") {
      availableCount = count;
    } else if (row.status_name === "Reserved") {
      reservedCount = count;
    } else if (row.status_name === "Sold") {
      soldCount = count;
    }
  }

  // ─── Recent Activities ───────────────────────────────────────────────────
  const recentActivities = await db("activities")
    .where("activities.workspace_id", workspaceId)
    .leftJoin("users", "activities.created_by", "users.id")
    .select("activities.*", "users.name as performed_by")
    .orderBy("activities.created_at", "desc")
    .limit(5);

  return {
    leads: {
      total: leadsTotalCount,
      by_status: leadsByStatus,
      new_this_month: leadsNewCount,
    },
    contacts: {
      total: contactsTotalCount,
      new_this_month: contactsNewCount,
    },
    deals: {
      total: dealsTotalCount,
      total_value: dealsTotalValue,
      won,
      lost,
      open,
    },
    properties: {
      total: propertiesTotalCount,
      available: availableCount,
      reserved: reservedCount,
      sold: soldCount,
    },
    recent_activities: recentActivities,
  };
}

module.exports = {
  getDashboardStats,
};
