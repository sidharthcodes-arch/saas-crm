/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable("audit_logs", (table) => {
    table.bigIncrements("id").primary();

    table
      .bigInteger("workspace_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    table
      .bigInteger("user_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("entity_type").notNullable(); // 'lead', 'deal', 'contact'
    table.bigInteger("entity_id").unsigned().notNullable();
    table.enum("action", ["created", "updated", "deleted"]).notNullable();
    table.json("before").nullable();
    table.json("after").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["workspace_id", "entity_type", "entity_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("audit_logs");
};
