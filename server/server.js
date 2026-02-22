require("dotenv").config(); // Load env first

const app = require("./src/app");
const { connectDB } = require("./src/config/db/db.js");

const PORT = process.env.PORT;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
