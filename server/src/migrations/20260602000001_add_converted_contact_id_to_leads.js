/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("leads", (table) => {
    table
      .bigInteger("converted_contact_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("contacts")
      .onDelete("SET NULL")
      .after("property_id");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("leads", (table) => {
    table.dropForeign("converted_contact_id");
    table.dropColumn("converted_contact_id");
  });
};
