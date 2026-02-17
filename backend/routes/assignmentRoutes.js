const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  closeAssignment,
  getAssignmentAnalytics,
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Teacher creates assignment
router.post("/", protect, authorizeRoles("teacher"), createAssignment);

// Get all assignments (role-based filtering inside controller)
router.get("/", protect, getAssignments);

// Get single assignment
router.get("/:id", protect, getAssignmentById);

// Teacher manually closes assignment
router.put(
  "/:id/close",
  protect,
  authorizeRoles("teacher"),
  closeAssignment
);

// Teacher analytics
router.get(
  "/:id/analytics",
  protect,
  authorizeRoles("teacher"),
  getAssignmentAnalytics
);

module.exports = router;
