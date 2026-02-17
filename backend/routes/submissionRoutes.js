const express = require("express");
const router = express.Router();

const {
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} = require("../controllers/submissionController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Student submits
router.post("/", protect, authorizeRoles("student"), submitAssignment);

// Teacher views submissions
router.get("/:assignmentId", protect, authorizeRoles("teacher"), getSubmissions);

// Teacher grades
router.put("/:id", protect, authorizeRoles("teacher"), gradeSubmission);

module.exports = router;
