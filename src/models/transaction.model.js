const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Transaction must be associated with a from account"],
    index: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Transaction must be associated with a to account"],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      message: "Status can be either PENDING, COMPLETED, FAILED, REVERSED"
    },
    default: "PENDING"
  },
  channel: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    required: true,
    default: "ONLINE",
    index: true
  },
  operation: {
    type: String,
    enum: ["TRANSFER", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "OPENING_DEPOSIT"],
    required: true,
    default: "TRANSFER"
  },
  channel: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    required: true,
    default: "ONLINE",
    index: true
  },
  operation: {
    type: String,
    enum: ["TRANSFER", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "OPENING_DEPOSIT"],
    required: true,
    default: "TRANSFER"
  },
  channel: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    required: true,
    default: "ONLINE",
    index: true
  },
  operation: {
    type: String,
    enum: ["TRANSFER", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "OPENING_DEPOSIT"],
    required: true,
    default: "TRANSFER"
  },
  channel: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    required: true,
    default: "ONLINE",
    index: true
  },
  operation: {
    type: String,
    enum: ["TRANSFER", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "OPENING_DEPOSIT"],
    required: true,
    default: "TRANSFER"
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for creating a transaction"],
    min: [0.01, "Transaction amount must be greater than zero"],
    validate: {
      validator: Number.isFinite,
      message: "Transaction amount must be a finite number"
    }
  },
  idempotencyKey: {
    type: String,
    required: [true, "Idempotency Key is required for creating a transaction"],
    unique: true
  }
}, {
  timestamps: true
});

const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;
