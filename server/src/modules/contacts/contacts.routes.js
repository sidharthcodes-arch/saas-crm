const express = require("express");
const router = express.Router();
const contactsController = require("./contacts.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All contacts routes require authentication
router.use(requireAuth);

// Collection routes
router.get("/", contactsController.getContacts);
router.post("/", contactsController.createContact);

// Single contact routes
router.get("/:id", contactsController.getContactById);
router.put("/:id", contactsController.updateContact);
router.delete("/:id", contactsController.deleteContact);

// Contact actions
router.post("/:id/activities", contactsController.addActivity);

module.exports = router;
