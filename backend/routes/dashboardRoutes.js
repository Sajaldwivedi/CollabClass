const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { getTeacherDashboard } = require("../controllers/dashboardController");

router.get(
  "/teacher",
  protect,
  authorizeRoles("teacher"),
  getTeacherDashboard
);

module.exports = router;
