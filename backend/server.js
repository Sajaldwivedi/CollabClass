const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const User = require("./models/User");
const { setIO } = require("./socket/ioInstance");
const { registerUser, removeUserSocket } = require("./socket/socketManager");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes");


// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/materials", studyMaterialRoutes);
app.use("/api/doubts", require("./routes/doubtRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => {
  res.send("CollabClass API Running...");
});

// HTTP Server
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: "*" },
});

setIO(io);

// JWT Authentication for Socket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Not authorized, no token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Not authorized, token failed"));
  }
});

// Connection lifecycle
io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  registerUser(userId, socket.id);
  console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);

  socket.on("disconnect", () => {
    removeUserSocket(socket.id);
    console.log(`[Socket] User ${userId} disconnected (socket: ${socket.id})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server, io };
