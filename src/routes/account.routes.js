const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/* POST /api/accounts - Create a new bank account */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/* GET /api/accounts - Get all bank accounts & balances for logged in user */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/* POST /api/accounts/deposit - Deposit initial funds into account */
router.post("/deposit", authMiddleware.authMiddleware, accountController.depositFundsController);

module.exports = router;