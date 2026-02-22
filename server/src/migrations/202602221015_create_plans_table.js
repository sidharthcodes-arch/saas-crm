/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("plans", (table) => {
    table.bigIncrements("id").primary();
    table.string("name").notNullable();
    table.decimal("price_monthly", 10, 2);
    table.decimal("price_yearly", 10, 2);
    table.integer("max_users");
    table.integer("max_properties");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("plans");
};
