/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("deal_items", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("deal_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("deals")
      .onDelete("CASCADE");

    table
      .bigInteger("property_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("properties");

    table.decimal("price", 15, 2);

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("deal_items");
};
