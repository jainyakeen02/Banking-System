const express = require("express");
const { authAdminMiddleware } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

/* POST /api/admin/onboard-customer - Cashier opens customer account offline */
router.post("/onboard-customer", authAdminMiddleware, adminController.onboardCustomerController);

/* POST /api/admin/cash-deposit - Cashier physical cash deposit */
router.post("/cash-deposit", authAdminMiddleware, adminController.cashDepositController);

/* POST /api/admin/cash-withdraw - Cashier physical cash withdrawal */
router.post("/cash-withdraw", authAdminMiddleware, adminController.cashWithdrawController);

/* GET /api/admin/stats - Admin bank dashboard metrics */
router.get("/stats", authAdminMiddleware, adminController.getAdminStatsController);

/* GET /api/admin/accounts - Get all customer accounts */
router.get("/accounts", authAdminMiddleware, adminController.getAllAccountsController);

/* GET /api/admin/transactions - Audit every online and offline transaction */
router.get("/transactions", authAdminMiddleware, adminController.getAllTransactionsController);

module.exports = router;
