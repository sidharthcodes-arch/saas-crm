/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("leads", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("status_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("statuses");

    table
      .bigInteger("assigned_to")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table
      .bigInteger("property_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("properties")
      .onDelete("SET NULL");

    table.string("name").notNullable();
    table.string("phone");
    table.string("email");

    table
      .bigInteger("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users");

    table.string("source").nullable(); // 'manual', 'web_form', 'import'
    table.timestamp("deleted_at").nullable(); // soft delete

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("leads");
};
