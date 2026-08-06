const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");

async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required"
    });
  }

  const isExists = await userModel.findOne({ email });

  if (isExists) {
    return res.status(400).json({
      message: "User already exists",
      status: "failed"
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
    role: "USER"
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

  res.cookie("token", token);

  // Send welcome email asynchronously
  emailService.sendRegistrationEmail(user.email, user.name).catch(err => console.error("Registration email error:", err));

  return res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPin: false
    },
    token
  });
}

/**  
 * - User Login Controller
 * - POST /api/auth/login
*/
async function userLoginController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const user = await userModel.findOne({ email }).select("+password +transactionPin");

  if (!user) {
    return res.status(400).json({
      message: "User Not Found. Please Register",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(400).json({
      message: "Email or password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

  res.cookie("token", token);
  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "USER",
      hasPin: Boolean(user.transactionPin)
    },
    token
  });
}

/**
 * - Set / Update Transaction PIN Controller
 * - POST /api/auth/set-pin
 */
async function setPinController(req, res) {
  try {
    const { pin } = req.body;

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({
        message: "Transaction PIN must be exactly four digits"
      });
    }

    const user = await userModel.findById(req.user._id);
    user.transactionPin = String(pin);
    await user.save();

    return res.status(200).json({
      message: "Transaction PIN set successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error setting Transaction PIN",
      error: error.message
    });
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  setPinController
};
