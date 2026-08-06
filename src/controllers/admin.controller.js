const userModel = require("../models/user.model");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const { sendAccountCreatedEmail, sendCashTransactionEmail } = require("../services/email.service");

/**
 * - Admin Cashier: Onboard new customer offline & create account with initial physical cash deposit
 */
async function onboardCustomerController(req, res) {
  try {
    const { name, email, password, initialDeposit } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required for customer onboarding"
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Customer with this email already exists. Use a different email address.",
        existingCustomer: {
          name: existingUser.name,
          email: existingUser.email
        }
      });
    }

    // 1. Create User
    const user = await userModel.create({
      name,
      email,
      password,
      role: "USER"
    });

    // 2. Create Bank Account with unique Account Number
    const account = await accountModel.create({
      user: user._id,
      status: "ACTIVE",
      currency: "INR"
    });

    // 3. Process Initial Cash Deposit if provided
    let initialBalance = 0;
    const depositAmount = Number(initialDeposit) || 0;

    if (depositAmount > 0) {
      const transaction = await transactionModel.create({
        fromAccount: account._id,
        toAccount: account._id,
        amount: depositAmount,
        idempotencyKey: `onboard-cash-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "COMPLETED",
        channel: "OFFLINE",
        operation: "OPENING_DEPOSIT"
      });

      await ledgerModel.create({
        account: account._id,
        amount: depositAmount,
        transaction: transaction._id,
        type: "CREDIT"
      });

      initialBalance = depositAmount;
    }

    // Account creation is already persisted; email delivery happens asynchronously.
    sendAccountCreatedEmail({
      email: user.email,
      name: user.name,
      accountNumber: account.accountNumber,
      temporaryPassword: password,
      initialBalance
    }).catch(error => console.error("Account-created email failed:", error.message));

    return res.status(201).json({
      message: "Customer onboarded successfully",
      customer: {
        userId: user._id,
        name: user.name,
        email: user.email,
        accountNumber: account.accountNumber,
        accountId: account._id,
        balance: initialBalance
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error onboarding customer",
      error: error.message
    });
  }
}

/**
 * - Admin Cashier: Physical Cash Deposit into Customer Account
 */
async function cashDepositController(req, res) {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "accountNumber and a positive deposit amount are required"
      });
    }

    const account = await accountModel.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        message: "Bank Account not found with the provided Account Number"
      });
    }

    const depositAmount = Number(amount);

    const transaction = await transactionModel.create({
      fromAccount: account._id,
      toAccount: account._id,
      amount: depositAmount,
      idempotencyKey: `cashier-dep-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "COMPLETED",
      channel: "OFFLINE",
      operation: "CASH_DEPOSIT"
    });

    await ledgerModel.create({
      account: account._id,
      amount: depositAmount,
      transaction: transaction._id,
      type: "CREDIT"
    });

    const newBalance = await account.getBalance();

    // Notify account holder — fire-and-forget
    const accountOwner = await userModel.findById(account.user).select("name email");
    if (accountOwner) {
      sendCashTransactionEmail({
        email: accountOwner.email,
        name: accountOwner.name,
        accountNumber: account.accountNumber,
        amount: depositAmount,
        type: "CREDIT",
        newBalance,
        channel: "OFFLINE"
      }).catch(error => console.error("Cash deposit email failed:", error.message));
    }

    return res.status(200).json({
      message: `Physical cash deposit of ₹${depositAmount} successful`,
      accountNumber: account.accountNumber,
      newBalance
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error processing cash deposit",
      error: error.message
    });
  }
}

/**
 * - Admin Cashier: Physical Cash Withdrawal from Customer Account
 */
async function cashWithdrawController(req, res) {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "accountNumber and a positive withdrawal amount are required"
      });
    }

    const account = await accountModel.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({
        message: "Bank Account not found"
      });
    }

    const withdrawAmount = Number(amount);
    const currentBalance = await account.getBalance();

    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        message: `Insufficient funds. Current balance is ₹${currentBalance}`
      });
    }

    const transaction = await transactionModel.create({
      fromAccount: account._id,
      toAccount: account._id,
      amount: withdrawAmount,
      idempotencyKey: `cashier-with-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "COMPLETED",
      channel: "OFFLINE",
      operation: "CASH_WITHDRAWAL"
    });

    await ledgerModel.create({
      account: account._id,
      amount: withdrawAmount,
      transaction: transaction._id,
      type: "DEBIT"
    });

    const newBalance = await account.getBalance();

    // Notify account holder — fire-and-forget
    const accountOwner = await userModel.findById(account.user).select("name email");
    if (accountOwner) {
      sendCashTransactionEmail({
        email: accountOwner.email,
        name: accountOwner.name,
        accountNumber: account.accountNumber,
        amount: withdrawAmount,
        type: "DEBIT",
        newBalance,
        channel: "OFFLINE"
      }).catch(error => console.error("Cash withdrawal email failed:", error.message));
    }

    return res.status(200).json({
      message: `Physical cash withdrawal of ₹${withdrawAmount} successful`,
      accountNumber: account.accountNumber,
      newBalance
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error processing cash withdrawal",
      error: error.message
    });
  }
}

/**
 * - Admin Dashboard Stats
 */
async function getAdminStatsController(req, res) {
  try {
    const userCount = await userModel.countDocuments({ role: "USER" });
    const accountCount = await accountModel.countDocuments();
    const transactionCount = await transactionModel.countDocuments();

    // Calculate total bank reserves from ledger
    const ledgerAgg = await ledgerModel.aggregate([
      {
        $group: {
          _id: null,
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
            }
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
            }
          }
        }
      }
    ]);

    const totalReserve = ledgerAgg.length > 0 ? (ledgerAgg[0].totalCredit - ledgerAgg[0].totalDebit) : 0;

    return res.status(200).json({
      userCount,
      accountCount,
      transactionCount,
      totalReserve
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching admin stats",
      error: error.message
    });
  }
}

/**
 * - Admin: Get All Bank Accounts
 */
async function getAllAccountsController(req, res) {
  try {
    const accounts = await accountModel.find().populate("user", "name email");

    const accountsWithBalance = await Promise.all(
      accounts.map(async (acc) => {
        const balance = await acc.getBalance();
        return {
          _id: acc._id,
          accountNumber: acc.accountNumber,
          customerName: acc.user ? acc.user.name : "N/A",
          customerEmail: acc.user ? acc.user.email : "N/A",
          status: acc.status,
          currency: acc.currency,
          balance: balance,
          createdAt: acc.createdAt
        };
      })
    );

    return res.status(200).json({
      count: accountsWithBalance.length,
      accounts: accountsWithBalance
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching accounts",
      error: error.message
    });
  }
}

/** Admin audit: every persisted online transfer and offline cashier transaction. */
async function getAllTransactionsController(req, res) {
  try {
    const transactions = await transactionModel.find()
      .populate("fromAccount", "accountNumber")
      .populate("toAccount", "accountNumber")
      .sort({ createdAt: -1 })
      .limit(250);

    return res.status(200).json({ count: transactions.length, transactions });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching transaction audit", error: error.message });
  }
}

module.exports = {
  onboardCustomerController,
  cashDepositController,
  cashWithdrawController,
  getAdminStatsController,
  getAllAccountsController,
  getAllTransactionsController
};
