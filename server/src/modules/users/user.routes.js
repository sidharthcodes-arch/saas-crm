const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// All user routes require authentication
router.use(requireAuth);

router.get("/", userController.getUsers);
router.post("/create", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deactivateUser);

module.exports = router;
