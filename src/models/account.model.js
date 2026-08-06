const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    unique: true,
    index: true,
    required: true,
    default: () => "ACC" + Math.floor(1000000000 + Math.random() * 9000000000),
    match: [/^ACC\d{10}$/, "Account number must use the ACC + 10 digit format"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Account must be associated with a user"],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ["ACTIVE", "FROZEN", "CLOSED"],
      message: "Status must be either ACTIVE, FROZEN, or CLOSED"
    },
    default: "ACTIVE"
  },
  currency: {
    type: String,
    required: [true, "Currency is required for creating an account"],
    default: "INR"
  }
}, {
  timestamps: true
});

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "DEBIT"] },
              "$amount",
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              0
            ]
          }
        }
      }
    }
  ]);

  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].totalCredit - balanceData[0].totalDebit;
};

const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;
