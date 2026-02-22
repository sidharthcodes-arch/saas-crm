/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("roles", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("workspace_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table.string("name").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("roles");
};
