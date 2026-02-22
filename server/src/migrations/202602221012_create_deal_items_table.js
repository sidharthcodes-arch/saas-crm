/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("deals", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("contact_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("contacts");

    table
      .bigInteger("status_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("statuses");

    table.decimal("total_amount", 15, 2);
    table.timestamp("closed_at").nullable();

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("deals");
};
