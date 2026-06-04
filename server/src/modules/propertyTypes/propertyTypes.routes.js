const express = require("express");
const router = express.Router();
const propertyTypesController = require("./propertyTypes.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All property type routes require authentication
router.use(requireAuth);

router.get("/", propertyTypesController.getPropertyTypes);
router.post("/", propertyTypesController.createPropertyType);
router.delete("/:id", propertyTypesController.deletePropertyType);

module.exports = router;
