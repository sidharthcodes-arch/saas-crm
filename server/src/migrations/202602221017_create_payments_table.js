/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("payments", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("subscription_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("subscriptions")
      .onDelete("CASCADE");

    table.decimal("amount", 10, 2).notNullable();
    table.string("currency").defaultTo("USD");
    table.string("payment_provider");
    table.enu("payment_status", ["pending", "success", "failed"]).notNullable();

    table.string("transaction_id");
    table.timestamp("paid_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("payments");
};
