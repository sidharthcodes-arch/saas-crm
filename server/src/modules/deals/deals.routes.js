const express = require("express");
const router = express.Router();
const dealsController = require("./deals.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All deals routes require authentication
router.use(requireAuth);

// Collection routes
router.get("/", dealsController.getDeals);
router.post("/", dealsController.createDeal);

// Single deal routes
router.get("/:id", dealsController.getDealById);
router.put("/:id", dealsController.updateDeal);
router.delete("/:id", dealsController.deleteDeal);

// Deal items management
router.post("/:id/items", dealsController.addDealItem);
router.delete("/:id/items/:itemId", dealsController.deleteDealItem);

module.exports = router;
