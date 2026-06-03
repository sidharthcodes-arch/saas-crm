/**
 * Drop workspace_id from roles and statuses tables.
 * Roles and statuses are platform-level — they are not scoped to a workspace.
 * This removes the foreign key constraint and the column entirely from both tables.
 */

exports.up = async function (knex) {
  // ── roles ──────────────────────────────────────────────────────────
  await knex.schema.alterTable("roles", (table) => {
    table.dropForeign("workspace_id");
    table.dropColumn("workspace_id");
  });

  // ── statuses ───────────────────────────────────────────────────────
  await knex.schema.alterTable("statuses", (table) => {
    table.dropForeign("workspace_id");
    table.dropColumn("workspace_id");
  });
};

exports.down = async function (knex) {
  // ── roles ──────────────────────────────────────────────────────────
  await knex.schema.alterTable("roles", (table) => {
    table
      .bigInteger("workspace_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");
  });

  // ── statuses ───────────────────────────────────────────────────────
  await knex.schema.alterTable("statuses", (table) => {
    table
      .bigInteger("workspace_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");
  });
};
