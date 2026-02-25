const { db } = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// PLAN
// ─────────────────────────────────────────────────────────────────────────────
class Plan {
  static fields = {
    id: { type: "BIGINT", required: false },
    name: { type: "VARCHAR", required: true },
    price_monthly: { type: "DECIMAL", required: true },
    price_yearly: { type: "DECIMAL", required: true },
    max_users: { type: "INT", required: true },
    max_properties: { type: "INT", required: true },
    created_at: { type: "TIMESTAMP", required: false },
  };

  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim() === "") errors.push("name is required");
    if (!data.price_monthly && data.price_monthly !== 0)
      errors.push("price_monthly is required");
    if (!data.price_yearly && data.price_yearly !== 0)
      errors.push("price_yearly is required");
    if (!data.max_users) errors.push("max_users is required");
    if (!data.max_properties) errors.push("max_properties is required");
    return errors;
  }

  static async findAll() {
    return db("plans").orderBy("price_monthly", "asc");
  }

  static async findById(id) {
    return db("plans").where({ id }).first();
  }

  static async create(data) {
    const errors = Plan.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("plans").insert({
      name: data.name.trim(),
      price_monthly: data.price_monthly,
      price_yearly: data.price_yearly,
      max_users: data.max_users,
      max_properties: data.max_properties,
    });
    return id;
  }

  static async update(id, data) {
    const errors = Plan.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    return db("plans").where({ id }).update({
      name: data.name.trim(),
      price_monthly: data.price_monthly,
      price_yearly: data.price_yearly,
      max_users: data.max_users,
      max_properties: data.max_properties,
    });
  }

  static async delete(id) {
    return db("plans").where({ id }).delete();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
const VALID_STATUSES = ["trial", "active", "expired", "cancelled"];
const VALID_BILLING_CYCLES = ["monthly", "yearly"];

class Subscription {
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    plan_id: { type: "BIGINT", required: true },
    status: { type: "ENUM", required: true, values: VALID_STATUSES },
    billing_cycle: {
      type: "ENUM",
      required: true,
      values: VALID_BILLING_CYCLES,
    },
    start_date: { type: "DATE", required: true },
    end_date: { type: "DATE", required: true },
    trial_ends_at: { type: "DATE", required: false, default: null },
    created_at: { type: "TIMESTAMP", required: false },
  };

  static validate(data) {
    const errors = [];
    if (!data.plan_id) errors.push("plan_id is required");
    if (!data.billing_cycle) errors.push("billing_cycle is required");
    if (
      data.billing_cycle &&
      !VALID_BILLING_CYCLES.includes(data.billing_cycle)
    ) {
      errors.push(
        `billing_cycle must be one of: ${VALID_BILLING_CYCLES.join(", ")}`,
      );
    }
    if (!data.start_date) errors.push("start_date is required");
    if (!data.end_date) errors.push("end_date is required");
    return errors;
  }

  static async findByWorkspace(workspaceId) {
    return db("subscriptions")
      .where("subscriptions.workspace_id", workspaceId)
      .join("plans", "subscriptions.plan_id", "plans.id")
      .select(
        "subscriptions.*",
        "plans.name as plan_name",
        "plans.max_users",
        "plans.max_properties",
      )
      .orderBy("subscriptions.created_at", "desc");
  }

  // Get active subscription for a workspace (used in subscriptionGuard)
  static async findActive(workspaceId) {
    return db("subscriptions")
      .where({ workspace_id: workspaceId })
      .whereIn("status", ["trial", "active"])
      .join("plans", "subscriptions.plan_id", "plans.id")
      .select(
        "subscriptions.*",
        "plans.name as plan_name",
        "plans.max_users",
        "plans.max_properties",
      )
      .first();
  }

  static async findById(id) {
    return db("subscriptions").where({ id }).first();
  }

  static async create(workspaceId, data) {
    const errors = Subscription.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("subscriptions").insert({
      workspace_id: workspaceId,
      plan_id: data.plan_id,
      status: data.status || "trial",
      billing_cycle: data.billing_cycle,
      start_date: data.start_date,
      end_date: data.end_date,
      trial_ends_at: data.trial_ends_at || null,
    });
    return id;
  }

  static async updateStatus(id, status) {
    if (!VALID_STATUSES.includes(status))
      throw new Error(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    return db("subscriptions").where({ id }).update({ status });
  }

  // Check if workspace subscription is valid (used in middleware)
  static async isValid(workspaceId) {
    const sub = await Subscription.findActive(workspaceId);
    if (!sub) return false;

    const now = new Date();

    if (sub.status === "trial") {
      return sub.trial_ends_at ? new Date(sub.trial_ends_at) > now : true;
    }
    if (sub.status === "active") {
      return new Date(sub.end_date) > now;
    }
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
const VALID_PAYMENT_STATUSES = ["pending", "success", "failed"];

class Payment {
  static fields = {
    id: { type: "BIGINT", required: false },
    workspace_id: { type: "BIGINT", required: true },
    subscription_id: { type: "BIGINT", required: true },
    amount: { type: "DECIMAL", required: true },
    currency: { type: "VARCHAR", required: true },
    payment_provider: { type: "VARCHAR", required: true },
    payment_status: {
      type: "ENUM",
      required: true,
      values: VALID_PAYMENT_STATUSES,
    },
    transaction_id: { type: "VARCHAR", required: false },
    paid_at: { type: "TIMESTAMP", required: false, default: null },
    created_at: { type: "TIMESTAMP", required: false },
  };

  static validate(data) {
    const errors = [];
    if (!data.subscription_id) errors.push("subscription_id is required");
    if (!data.amount) errors.push("amount is required");
    if (!data.currency) errors.push("currency is required");
    if (!data.payment_provider) errors.push("payment_provider is required");
    return errors;
  }

  static async findByWorkspace(workspaceId) {
    return db("payments")
      .where("payments.workspace_id", workspaceId)
      .join("subscriptions", "payments.subscription_id", "subscriptions.id")
      .join("plans", "subscriptions.plan_id", "plans.id")
      .select("payments.*", "plans.name as plan_name")
      .orderBy("payments.created_at", "desc");
  }

  static async findById(id, workspaceId) {
    return db("payments").where({ id, workspace_id: workspaceId }).first();
  }

  static async create(workspaceId, data) {
    const errors = Payment.validate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const [id] = await db("payments").insert({
      workspace_id: workspaceId,
      subscription_id: data.subscription_id,
      amount: data.amount,
      currency: data.currency,
      payment_provider: data.payment_provider,
      payment_status: "pending",
      transaction_id: data.transaction_id || null,
      paid_at: null,
    });
    return id;
  }

  // Update payment after gateway webhook confirms
  static async updateStatus(id, status, transactionId = null) {
    if (!VALID_PAYMENT_STATUSES.includes(status)) {
      throw new Error(
        `status must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
      );
    }

    return db("payments")
      .where({ id })
      .update({
        payment_status: status,
        transaction_id: transactionId,
        paid_at: status === "success" ? new Date() : null,
      });
  }
}

module.exports = { Plan, Subscription, Payment };
