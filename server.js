require("dotenv").config();

const app = require("./src/app");
const connectToDb = require("./src/config/db");

const PORT = process.env.PORT || 3000;

connectToDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});