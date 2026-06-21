const Role = require("../../models/Roles");
const RolePermission = require("../../models/RolePermission");
const { db } = require("../../config/db/db");

// ─── Get Enriched Roles ──────────────────────────────────────────────────────

async function getRoles() {
  const roles = await Role.findAll();
  
  const enrichedRoles = await Promise.all(roles.map(async (role) => {
    // Get permissions matrix for the role
    const permissions = await RolePermission.findByRole(role.id);
    
    // Get count of active workspace users assigned to this role
    const userCountRes = await db("users")
      .where("role_id", role.id)
      .whereNull("deleted_at")
      .count("id as count")
      .first();
      
    return {
      ...role,
      user_count: userCountRes?.count || 0,
      permissions: permissions
    };
  }));

  return enrichedRoles;
}

module.exports = { getRoles };
