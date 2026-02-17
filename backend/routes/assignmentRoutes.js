const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  getAssignmentById,
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Teacher only
router.post("/", protect, authorizeRoles("teacher"), createAssignment);

// Logged in users
router.get("/", protect, getAssignments);
router.get("/:id", protect, getAssignmentById);

module.exports = router;
