/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("properties", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("property_type_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("property_types")
      .onDelete("RESTRICT");

    table
      .bigInteger("parent_property_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("properties")
      .onDelete("SET NULL");

    table
      .bigInteger("status_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("statuses")
      .onDelete("RESTRICT");

    table.string("name").notNullable();
    table.string("code").notNullable();

    table.decimal("area_sqft", 10, 2);
    table.decimal("price", 15, 2);
    table.boolean("is_sellable").defaultTo(true);

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("properties");
};
