/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("workspaces", (table) => {
    table.bigIncrements("id").primary();
    table.string("name").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("workspaces");
};
