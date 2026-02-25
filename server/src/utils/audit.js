const { db } = require("../config/db/db");

// Usage examples (in service functions):
// await logAudit({ workspaceId, userId, entityType: "lead", entityId: id, action: "created", after: newLead });
// await logAudit({ workspaceId, userId, entityType: "lead", entityId: id, action: "updated", before, after });
// await logAudit({ workspaceId, userId, entityType: "lead", entityId: id, action: "deleted", before: oldLead });

async function logAudit({
  workspaceId,
  userId,
  entityType,
  entityId,
  action,
  before = null,
  after = null,
}) {
  await db("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: userId || null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before: before ? JSON.stringify(before) : null,
    after: after ? JSON.stringify(after) : null,
  });
}

module.exports = { logAudit };
