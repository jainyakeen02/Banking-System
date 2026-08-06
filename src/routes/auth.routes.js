const express = require("express");
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

/* POST /api/auth/register */
router.post("/register", authController.userRegisterController);

/* POST /api/auth/login */
router.post("/login", authController.userLoginController);

/* POST /api/auth/set-pin */
router.post("/set-pin", authMiddleware, authController.setPinController);

module.exports = router;
