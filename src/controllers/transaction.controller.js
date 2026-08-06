const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const emailService = require("../services/email.service");

/**
 * - Create new transaction
 * - The 10-Step Transfer flow with Transaction PIN Verification
 */
async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey, transactionPin } = req.body;

  // 1. Validate request
  if (!fromAccount || !toAccount || !amount || !idempotencyKey || !transactionPin) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount, idempotencyKey, and transactionPin are required"
    });
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      message: "Transaction amount must be greater than zero"
    });
  }

  // Verify User PIN
  const currentUser = await userModel.findById(req.user._id).select("+transactionPin");
  if (!currentUser || !currentUser.transactionPin) {
    return res.status(400).json({
      message: "Transaction PIN not set. Please set your PIN in Security Settings before transferring money."
    });
  }

  const isPinValid = await currentUser.comparePin(String(transactionPin));
  if (!isPinValid) {
    return res.status(401).json({
      message: "Invalid Transaction PIN. Access denied."
    });
  }

  // Find accounts (Supports searching by _id OR by 10-digit accountNumber)
  const fromUserAccount = await accountModel.findOne({
    $or: [{ _id: mongoose.isValidObjectId(fromAccount) ? fromAccount : null }, { accountNumber: fromAccount }]
  });

  const toUserAccount = await accountModel.findOne({
    $or: [{ _id: mongoose.isValidObjectId(toAccount) ? toAccount : null }, { accountNumber: toAccount }]
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: "Invalid fromAccount or toAccount (Account not found)"
    });
  }

  if (fromUserAccount._id.equals(toUserAccount._id)) {
    return res.status(400).json({ message: "Sender and recipient accounts must be different" });
  }

  // Ensure fromAccount belongs to authenticated user
  if (fromUserAccount.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Forbidden: You can only transfer funds from your own bank account"
    });
  }

  // 2. Validate idempotency key
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists
      });
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing"
      });
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(400).json({
        message: "Transaction failed previously, please retry with a new idempotencyKey"
      });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(400).json({
        message: "Transaction reversed, please retry with a new idempotencyKey"
      });
    }
  }

  // 3. Check account status
  if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "Both accounts must be ACTIVE to process a transaction"
    });
  }

  // 4. Derive sender balance from ledger
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ₹${balance}. Requested amount is ₹${amount}`
    });
  }

  // 5. Create transaction with session & ACID transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [transaction] = await transactionModel.create([{
      fromAccount: fromUserAccount._id,
      toAccount: toUserAccount._id,
      amount,
      idempotencyKey,
      status: "PENDING",
      channel: "ONLINE",
      operation: "TRANSFER"
    }], { session });

    await ledgerModel.create([{
      account: fromUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT"
    }], { session });

    await ledgerModel.create([{
      account: toUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT"
    }], { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify both parties after the database transaction is fully committed.
    const recipient = await userModel.findById(toUserAccount.user).select("name email");
    const notifications = [
      emailService.sendTransferEmail({
        email: currentUser.email,
        name: currentUser.name,
        amount,
        accountNumber: fromUserAccount.accountNumber,
        counterpartyAccount: toUserAccount.accountNumber,
        direction: "DEBIT"
      })
    ];
    if (recipient) {
      notifications.push(emailService.sendTransferEmail({
        email: recipient.email,
        name: recipient.name,
        amount,
        accountNumber: toUserAccount.accountNumber,
        counterpartyAccount: fromUserAccount.accountNumber,
        direction: "CREDIT"
      }));
    }
    Promise.allSettled(notifications).then(results => {
      results.filter(result => result.status === "rejected")
        .forEach(result => console.error("Transaction email failed:", result.reason.message));
    });

    return res.status(201).json({
      message: "Transaction completed successfully.",
      transaction: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: "Transaction failed during execution",
      error: error.message
    });
  }
}

/**
 * - System User Initial Funds Transfer
 */
async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount, and idempotencyKey are required"
    });
  }

  const toUserAccount = await accountModel.findOne({
    $or: [{ _id: mongoose.isValidObjectId(toAccount) ? toAccount : null }, { accountNumber: toAccount }]
  });

  if (!toUserAccount) {
    return res.status(404).json({
      message: "Invalid toAccount"
    });
  }

  let fromUserAccount = await accountModel.findOne({
    user: req.user._id
  });

  if (!fromUserAccount) {
    fromUserAccount = await accountModel.create({
      user: req.user._id,
      status: "ACTIVE",
      currency: "INR"
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [transaction] = await transactionModel.create([{
      fromAccount: fromUserAccount._id,
      toAccount: toUserAccount._id,
      amount,
      idempotencyKey,
      status: "PENDING",
      channel: "ONLINE",
      operation: "TRANSFER"
    }], { session });

    await ledgerModel.create([{
      account: fromUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT"
    }], { session });

    await ledgerModel.create([{
      account: toUserAccount._id,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT"
    }], { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully.",
      transaction: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: "Initial funds transaction failed",
      error: error.message
    });
  }
}

/**
 * - Get all transactions for the authenticated user
 */
async function getUserTransactions(req, res) {
  try {
    const userAccounts = await accountModel.find({ user: req.user._id });
    const accountIds = userAccounts.map(acc => acc._id);

    // The ledger is the source of truth for a customer's statement direction.
    // A cashier deposit references the same account as source/destination, so
    // transaction fromAccount/toAccount alone cannot reliably identify credit/debit.
    const ledgerEntries = await ledgerModel.find({ account: { $in: accountIds } })
      .populate({
        path: "transaction",
        populate: [
          { path: "fromAccount", select: "accountNumber" },
          { path: "toAccount", select: "accountNumber" }
        ]
      })
      .sort({ createdAt: 1 });

    const runningBalances = new Map(userAccounts.map(account => [account._id.toString(), 0]));
    const transactions = ledgerEntries.map(entry => {
      const accountKey = entry.account.toString();
      const previousBalance = runningBalances.get(accountKey) || 0;
      const balanceAfter = entry.type === "CREDIT"
        ? previousBalance + entry.amount
        : previousBalance - entry.amount;
      runningBalances.set(accountKey, balanceAfter);

      return {
        ...entry.transaction.toObject(),
        statementAccount: entry.account,
        entryType: entry.type,
        balanceAfter,
        statementDate: entry.createdAt
      };
    }).reverse();

    return res.status(200).json({
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching transactions",
      error: error.message
    });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  getUserTransactions
};
