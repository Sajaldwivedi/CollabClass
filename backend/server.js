const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");

// ✅ Use Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("CollabClass API Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
