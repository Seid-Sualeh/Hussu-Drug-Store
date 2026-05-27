import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createRequire } from "module";
import inventoryRoutes from "./routes/inventory.js";
import dashboardRoutes from "./routes/dashboard.js";
import categoriesRoutes from "./routes/categories.js";
import suppliersRoutes from "./routes/suppliers.js";
import stockRoutes from "./routes/stock.js";
import salesRoutes from "./routes/sales.js";
import settingsRoutes from "./routes/settings.js";
import reportsRoutes from "./routes/reports.js";
import notificationsRoutes from "./routes/notifications.js";
import authRoutes from "./routes/auth.js";
import installRoutes from "./routes/install.js";
import { protectApiRoutes } from "./middleware/protectRoutes.js";
import { pingDatabase } from "./config/db.js";

dotenv.config();

const require = createRequire(import.meta.url);

const noop = (req, res, next) => next();

let expressRateLimit = null;
let helmetPackage = null;

try {
  expressRateLimit = require("express-rate-limit");
} catch {
  // Rate limiting not installed
  console.warn(
    "[security] express-rate-limit not installed - skipping rate limiting",
  );
}

try {
  helmetPackage = require("helmet");
} catch {
  // Helmet not installed
  console.warn("[security] helmet not installed - skipping security headers");
}

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;

if (isProduction) {
  const required = [
    "JWT_SECRET",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];
  const missing = required.filter(
    (k) =>
      !process.env[k] || process.env[k].length < (k === "JWT_SECRET" ? 32 : 1),
  );
  if (missing.length) {
    throw new Error(
      `Missing/invalid production env vars: ${missing.join(", ")}`,
    );
  }
}

const rateLimitConfigured = expressRateLimit !== null;
const helmetConfigured = helmetPackage !== null;

const apiLimiter = rateLimitConfigured
  ? expressRateLimit({
      windowMs: 15 * 60 * 1000,
      max: isProduction ? 100 : 1000,
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req, res, next) => next();

const loginLimiter = rateLimitConfigured
  ? expressRateLimit({
      windowMs: 15 * 60 * 1000,
      max: isProduction ? 5 : 20,
      message: { error: "Too many login attempts, please try again later." },
      skipSuccessfulRequests: true,
    })
  : (req, res, next) => next();

app.use(
  helmetConfigured
    ? isProduction
      ? helmetPackage({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
            },
          },
        })
      : helmetPackage()
    : (req, res, next) => next(),
);
app.use(
  cors({
    origin: isProduction
      ? (process.env.FRONTEND_URL || "https://yourdomain.com").split(",")
      : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", isProduction ? 1 : false);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Hussu Drug Store API" });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message:
      "Drug Store backend is running. Use /api/health to verify API health.",
  });
});

if (isDevelopment) {
  app.use("/install", installRoutes);
}

app.use("/api/auth", loginLimiter, apiLimiter, authRoutes);
protectApiRoutes(app);

app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const msg = isProduction ? "Internal server error" : err.message;
  res.status(500).json({ error: msg });
});

async function startServer() {
  try {
    await pingDatabase();
    console.log("[DB] Connected successfully.");
  } catch (err) {
    console.error("[DB] Database connection failed:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isDevelopment) {
      console.log(`Install available: http://localhost:${PORT}/install`);
    }
  });
}

startServer();
