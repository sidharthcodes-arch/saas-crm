/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("role_permissions", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("role_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("roles")
      .onDelete("CASCADE");

    table
      .bigInteger("module_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("modules")
      .onDelete("CASCADE");

    table.boolean("can_view").defaultTo(false);
    table.boolean("can_create").defaultTo(false);
    table.boolean("can_edit").defaultTo(false);
    table.boolean("can_delete").defaultTo(false);

    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.unique(["role_id", "module_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("role_permissions");
};
