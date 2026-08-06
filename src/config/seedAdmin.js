const userModel = require("../models/user.model");

async function seedAdminUser() {
  try {
    const adminEmail = "admin@ledgerbank.com";
    const existingAdmin = await userModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await userModel.create({
        name: "Head Bank Admin (Cashier)",
        email: adminEmail,
        password: "Admin@Ledger2026",
        role: "ADMIN",
        systemUser: true
      });
      console.log("--------------------------------------------------");
      console.log("🔑 Default Admin User Created Successfully!");
      console.log("   Email:    admin@ledgerbank.com");
      console.log("   Password: Admin@Ledger2026");
      console.log("--------------------------------------------------");
    } else {
      // Ensure existing admin user has ADMIN role
      if (existingAdmin.role !== "ADMIN") {
        existingAdmin.role = "ADMIN";
        await existingAdmin.save();
      }
    }
  } catch (error) {
    console.error("Error seeding default admin user:", error.message);
  }
}

module.exports = seedAdminUser;
