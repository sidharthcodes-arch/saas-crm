/**
 * Seed: Platform roles
 * workspace_id is NULL — these are platform-level roles available to all workspaces.
 * Safe to re-run — skips insert if role already exists.
 */

const ROLES = [
  "Super Admin",
  "Admin",
  "Manager",
  "Sales Agent",
];

exports.seed = async function (knex) {
  for (const name of ROLES) {
    const existing = await knex("roles").where({ name }).first();

    if (!existing) {
      await knex("roles").insert({ name });
      console.log(`  ✅ Inserted role: ${name}`);
    } else {
      console.log(`  ⏭️  Skipped role (exists): ${name}`);
    }
  }
};
