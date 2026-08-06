const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

/* Routes Required */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
const adminRouter = require("./routes/admin.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "starting",
    database: databaseReady ? "connected" : "disconnected"
  });
});

// Serve Static Frontend Web Application
app.use(express.static(path.join(__dirname, "../client/dist")));

/* Use Routes */
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRouter);

// React handles browser routes after API routes have been resolved.
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "../client/dist/index.html"), (error) => {
    if (error) next();
  });
});

const cors = require("cors");

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

module.exports = app;
