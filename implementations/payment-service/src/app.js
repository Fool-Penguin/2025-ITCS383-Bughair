require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const { initializeDatabase } = require("./config/database");
const paymentRoutes = require("./routes/payment");
const { errorResponse } = require("./utils/responseHelper");

// ── Init DB ────────────────────────────────────────────────────────────────
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "fitness-payment-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/payments", paymentRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  errorResponse(res, `Route ${req.method} ${req.path} not found`, 404);
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  errorResponse(res, "Internal server error", 500);
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  Fitness Payment Service`);
  console.log(`🚀  Running on  http://localhost:${PORT}`);
  console.log(`📋  Health      http://localhost:${PORT}/health`);
  console.log(`💳  Payments    http://localhost:${PORT}/api/payments`);
  console.log(`🌍  Environment ${process.env.NODE_ENV}\n`);
});

module.exports = app;