const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./modules/auth/auth.routes");
const workspaceRoutes = require("./modules/workspaces/workspace.routes");
const userRoutes = require("./modules/users/user.routes");
const leadRoutes = require("./modules/leads/leads.routes");
const contactRoutes = require("./modules/contacts/contacts.routes");
const dealRoutes = require("./modules/deals/deals.routes");
const propertyTypesRoutes = require("./modules/propertyTypes/propertyTypes.routes");
const propertiesRoutes = require("./modules/properties/properties.routes");

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
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/property-types", propertyTypesRoutes);
app.use("/api/v1/properties", propertiesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message });
});

app.get("/", (req, res) => res.json({ status: "ok" }));

module.exports = app;
