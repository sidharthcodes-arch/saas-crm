/**
 * Seed: Platform statuses
 * workspace_id is NULL — these are platform-level defaults.
 * Each workspace will use these as base statuses.
 * Safe to re-run — skips insert if status already exists for that context.
 */

const STATUSES = [
  // Lead pipeline stages
  { context: "lead", name: "New" },
  { context: "lead", name: "Contacted" },
  { context: "lead", name: "Follow Up" },
  { context: "lead", name: "Qualified" },
  { context: "lead", name: "Converted" },
  { context: "lead", name: "Lost" },

  // Deal pipeline stages
  { context: "deal", name: "Open" },
  { context: "deal", name: "Negotiation" },
  { context: "deal", name: "Won" },
  { context: "deal", name: "Lost" },

  // Property availability states
  { context: "property", name: "Available" },
  { context: "property", name: "Reserved" },
  { context: "property", name: "Sold" },
];

exports.seed = async function (knex) {
  for (const status of STATUSES) {
    const existing = await knex("statuses")
      .where({ context: status.context, name: status.name })
      .first();

    if (!existing) {
      await knex("statuses").insert({
        context: status.context,
        name: status.name,
      });
      console.log(`  ✅ Inserted status [${status.context}]: ${status.name}`);
    } else {
      console.log(`  ⏭️  Skipped status (exists) [${status.context}]: ${status.name}`);
    }
  }
};
