const express = require("express");
const router = express.Router();
const propertiesController = require("./properties.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All property routes require authentication
router.use(requireAuth);

router.get("/", propertiesController.getProperties);
router.get("/:id", propertiesController.getPropertyById);
router.post("/", propertiesController.createProperty);
router.put("/:id", propertiesController.updateProperty);
router.delete("/:id", propertiesController.deleteProperty);

module.exports = router;
