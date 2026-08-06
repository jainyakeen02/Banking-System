const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required for creating a user"],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email Format"],
    unique: true
  },
  name: {
    type: String,
    required: [true, "Name is required for creating a user"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false
  },
  role: {
    type: String,
    enum: ["ADMIN", "USER"],
    default: "USER"
  },
  transactionPin: {
    type: String,
    select: false,
    validate: {
      validator: value => !value || /^\d{4}$/.test(value) || /^\$2[aby]\$/.test(value),
      message: "Transaction PIN must contain exactly four digits"
    }
  },
  systemUser: {
    type: Boolean,
    default: false,
    immutable: true,
    select: false
  }
}, {
  timestamps: true
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified("transactionPin") && this.transactionPin && !this.transactionPin.startsWith("$2")) {
    this.transactionPin = await bcrypt.hash(this.transactionPin, 10);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.comparePin = async function (pin) {
  if (!this.transactionPin) return false;
  return await bcrypt.compare(pin, this.transactionPin);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
