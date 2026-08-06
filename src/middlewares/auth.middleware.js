const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token"
    });
  }
}

async function authAdminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Admin Cashier privileges required"
      });
    }
    next();
  });
}

async function authSystemMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if (!user || !user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, not a system user"
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid"
    });
  }
}

module.exports = {
  authMiddleware,
  authAdminMiddleware,
  authSystemMiddleware
};
