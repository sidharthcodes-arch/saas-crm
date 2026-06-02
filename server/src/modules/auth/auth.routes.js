const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { requireAuth } = require("../../middleware/auth.middleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected — must be logged in to log out
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
