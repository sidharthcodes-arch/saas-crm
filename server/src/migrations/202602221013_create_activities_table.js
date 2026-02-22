/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("activities", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .enu("entity_type", ["lead", "contact", "deal", "property"])
      .notNullable();
    table.bigInteger("entity_id").unsigned().notNullable();

    table
      .enu("type", ["call", "email", "meeting", "note", "task"])
      .notNullable();

    table.text("description").nullable();

    table
      .bigInteger("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users");

    table.timestamp("activity_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("activities");
};
