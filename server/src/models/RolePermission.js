const { db } = require("../config/db");

class RolePermission {
  // ─── Fields ────────────────────────────────────────────────────────
  static fields = {
    id: { type: "BIGINT", required: false },
    role_id: { type: "BIGINT", required: true },
    module_id: { type: "BIGINT", required: true },
    can_view: { type: "BOOLEAN", required: false, default: false },
    can_create: { type: "BOOLEAN", required: false, default: false },
    can_edit: { type: "BOOLEAN", required: false, default: false },
    can_delete: { type: "BOOLEAN", required: false, default: false },
    created_at: { type: "TIMESTAMP", required: false },
  };

  // ─── Validation ────────────────────────────────────────────────────
  static validate(data) {
    const errors = [];
    if (!data.role_id) errors.push("role_id is required");
    if (!data.module_id) errors.push("module_id is required");
    return errors;
  }

  // ─── Queries ───────────────────────────────────────────────────────

  // All permissions for a role — with module names (used in permission matrix UI)
  static async findByRole(roleId) {
    return db("role_permissions")
      .where("role_permissions.role_id", roleId)
      .join("modules", "role_permissions.module_id", "modules.id")
      .select("role_permissions.*", "modules.name as module_name")
      .orderBy("modules.name", "asc");
  }

  // Single permission for one role + module (used in authorize middleware)
  static async findByRoleAndModule(roleId, moduleId) {
    return db("role_permissions")
      .where({ role_id: roleId, module_id: moduleId })
      .first();
  }

  // Check a specific action (used in authorize middleware)
  static async can(roleId, moduleName, action) {
    const permission = await db("role_permissions")
      .where("role_permissions.role_id", roleId)
      .join("modules", "role_permissions.module_id", "modules.id")
      .where("modules.name", moduleName)
      .select(`role_permissions.${action}`)
      .first();
    return permission?.[action] === 1;
  }

  // Create or update permissions for a role + module (upsert)
  static async upsert(data) {
    const errors = RolePermission.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const existing = await RolePermission.findByRoleAndModule(
      data.role_id,
      data.module_id,
    );

    const permissionData = {
      can_view: data.can_view || false,
      can_create: data.can_create || false,
      can_edit: data.can_edit || false,
      can_delete: data.can_delete || false,
    };

    if (existing) {
      await db("role_permissions")
        .where({ role_id: data.role_id, module_id: data.module_id })
        .update(permissionData);
      return existing.id;
    }

    const [id] = await db("role_permissions").insert({
      role_id: data.role_id,
      module_id: data.module_id,
      ...permissionData,
    });
    return id;
  }

  // Delete all permissions for a role (when role is deleted)
  static async deleteByRole(roleId) {
    return db("role_permissions").where({ role_id: roleId }).delete();
  }
}

module.exports = RolePermission;
