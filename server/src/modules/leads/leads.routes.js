const express = require("express");
const router = express.Router();
const leadsController = require("./leads.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All leads routes require authentication
router.use(requireAuth);

// Collection routes
router.get("/", leadsController.getLeads);
router.post("/", leadsController.createLead);

// Single lead routes
router.get("/:id", leadsController.getLeadById);
router.put("/:id", leadsController.updateLead);
router.delete("/:id", leadsController.deleteLead);

// Lead actions
router.put("/:id/assign", leadsController.assignLead);
router.post("/:id/convert", leadsController.convertLead);
router.post("/:id/activities", leadsController.addActivity);

module.exports = router;
