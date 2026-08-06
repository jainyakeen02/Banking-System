const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");

async function createAccountController(req, res) {
  try {
    const user = req.user;

    const existingAccount = await accountModel.findOne({ user: user._id, status: { $ne: "CLOSED" } });
    if (existingAccount) {
      return res.status(409).json({ message: "An active bank account already exists for this customer" });
    }

    const account = await accountModel.create({
      user: user._id,
      status: "ACTIVE",
      currency: "INR"
    });

    return res.status(201).json({
      message: "Bank Account created successfully",
      account
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating account",
      error: error.message
    });
  }
}

async function getUserAccountsController(req, res) {
  try {
    const accounts = await accountModel.find({ user: req.user._id });
    
    // Attach derived ledger balance to each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (acc) => {
        const balance = await acc.getBalance();
        return {
          _id: acc._id,
          accountNumber: acc.accountNumber,
          user: acc.user,
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
      message: "Error fetching user accounts",
      error: error.message
    });
  }
}

/**
 * - Deposit Funds into an account (Self-deposit / ATM simulation)
 */
async function depositFundsController(req, res) {
  try {
    const { accountId, amount } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({
        message: "accountId and a positive amount are required"
      });
    }

    const account = await accountModel.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        message: "Account not found or access denied"
      });
    }

    const transaction = await transactionModel.create({
      fromAccount: accountId,
      toAccount: accountId,
      amount,
      idempotencyKey: `deposit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "COMPLETED"
    });

    await ledgerModel.create({
      account: accountId,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT"
    });

    const newBalance = await account.getBalance();

    return res.status(200).json({
      message: `Successfully deposited ₹${amount} into account`,
      accountBalance: newBalance
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error depositing funds",
      error: error.message
    });
  }
}

module.exports = {
  createAccountController,
  getUserAccountsController,
  depositFundsController
};
