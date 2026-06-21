const Module = require("../../models/Module");

// ─── Get All System Modules ──────────────────────────────────────────────────

async function getModules() {
  return Module.findAll();
}

module.exports = { getModules };
