const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

/* Routes Required */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
const adminRouter = require("./routes/admin.routes");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Must be registered BEFORE any routes so preflight OPTIONS requests are handled.
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. https://banking-system-khaki.vercel.app
  "http://localhost:5173",            // Vite dev server
  "http://localhost:3000",            // CRA / fallback
].filter(Boolean);                    // drop undefined/empty values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "starting",
    database: databaseReady ? "connected" : "disconnected"
  });
});

// ─── Serve Static Frontend ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../client/dist")));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRouter);

// ─── SPA Fallback (React Router) ──────────────────────────────────────────────
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "../client/dist/index.html"), (error) => {
    if (error) next();
  });
});

module.exports = app;

