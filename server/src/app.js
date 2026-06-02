const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./modules/auth/auth.routes");
const workspaceRoutes = require("./modules/workspaces/workspace.routes");
const userRoutes = require("./modules/users/user.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/leads", leadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message });
});

app.get("/", (req, res) => res.json({ status: "ok" }));

module.exports = app;
