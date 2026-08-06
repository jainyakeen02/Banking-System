const { Router } = require('express');
const authMiddleware = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * - POST /api/transactions/system/initial-funds
 * - System user initial funds transfer
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemMiddleware, transactionController.createInitialFundsTransaction);

/**
 * - GET /api/transactions/
 * - Get all transactions for logged in user
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.getUserTransactions);

module.exports = transactionRoutes;