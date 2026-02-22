/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("files", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .enu("entity_type", ["lead", "contact", "property", "deal"])
      .notNullable();
    table.bigInteger("entity_id").notNullable();

    table.string("file_path").notNullable();

    table
      .bigInteger("uploaded_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("files");
};
