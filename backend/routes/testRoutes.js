const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const testController = require("../controllers/testController");

// Teacher routes
router.post("/", protect, authorizeRoles("teacher"), testController.createTest);
router.patch("/:id/status", protect, authorizeRoles("teacher"), testController.updateTestStatus);
router.post("/:id/questions", protect, authorizeRoles("teacher"), testController.addQuestion);
router.get("/", protect, authorizeRoles("teacher"), testController.listTests);
router.get("/:id/attempts", protect, authorizeRoles("teacher"), testController.getTestAttempts);

// Student routes
router.get("/available", protect, authorizeRoles("student"), testController.getAvailableTests);
router.post("/:id/start", protect, authorizeRoles("student"), testController.startTest);
router.post("/:id/submit", protect, authorizeRoles("student"), testController.submitTest);
router.get("/:id/result", protect, authorizeRoles("student"), testController.getResult);

module.exports = router;
