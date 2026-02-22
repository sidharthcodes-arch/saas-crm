/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("contacts", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("created_from_lead_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("leads")
      .onDelete("SET NULL");

    table.string("name").notNullable();
    table.string("phone");
    table.string("email");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("contacts");
};
