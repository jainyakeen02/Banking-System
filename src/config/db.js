const mongoose = require("mongoose");
const dns = require("dns");
const seedAdminUser = require("./seedAdmin");

// Force Node.js to use Cloudflare & Google DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

function connectToDB() {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("Server is connected to the database");
      await seedAdminUser();
    })
    .catch(err => {
      console.error("Error connecting to the database:", err.message);
    });
}

module.exports = connectToDB;