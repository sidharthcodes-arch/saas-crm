require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
  debug: process.env.NODE_ENV === "development",
});

const connectDB = async () => {
  try {
    await db.raw("SELECT 1");
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { db, connectDB };
