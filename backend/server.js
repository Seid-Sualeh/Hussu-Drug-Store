import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
import { protectApiRoutes } from "./middleware/protectRoutes.js";
import { pingDatabase } from "./config/db.js";

dotenv.config();

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
    "FRONTEND_URL",
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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: { error: "Too many login attempts, please try again later." },
  skipSuccessfulRequests: true,
});

app.use(
  isProduction
    ? helmet({
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
    : helmet()
);
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", isProduction ? 1 : false);

const rawFrontend = process.env.FRONTEND_URL || "";
const allowedOrigins = rawFrontend
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn("[cors] Rejected origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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

app.use(["/api/auth", "/auth"], loginLimiter, apiLimiter, authRoutes);
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
  });
}

startServer();