/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("subscriptions", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("plan_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("plans");

    table
      .enu("status", ["trial", "active", "expired", "cancelled"])
      .notNullable();
    table.enu("billing_cycle", ["monthly", "yearly"]).notNullable();

    table.date("start_date");
    table.date("end_date");
    table.date("trial_ends_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("subscriptions");
};
