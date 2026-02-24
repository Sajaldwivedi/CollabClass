const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getStudentStrength,
  getSectionAnalytics,
  getInterventions,
  getTopPerformers,
  getStudentTrend,
  getSectionRiskStudents,
  getPeerSuggestions,
} = require("../controllers/analyticsController");

/**
 * GET /api/analytics/student-strength
 * Student-only. Uses req.user._id. Returns per-subject strength & risk.
 */
router.get(
  "/student-strength",
  protect,
  authorizeRoles("student"),
  getStudentStrength
);

/**
 * GET /api/analytics/section-analytics
 * Teacher-only. Section-isolated via req.user.section. Returns weak-topic heatmap.
 */
router.get(
  "/section-analytics",
  protect,
  authorizeRoles("teacher"),
  getSectionAnalytics
);

/**
 * GET /api/analytics/interventions
 * Teacher-only. Section-scoped intervention recommendation engine.
 */
router.get(
  "/interventions",
  protect,
  authorizeRoles("teacher"),
  getInterventions
);

/**
 * GET /api/analytics/top-performers
 * Teacher-only. Top 5 students by overallStrength within section.
 */
router.get(
  "/top-performers",
  protect,
  authorizeRoles("teacher"),
  getTopPerformers
);

/**
 * GET /api/analytics/student-trend
 * Student-only. Month-wise performance trend.
 */
router.get(
  "/student-trend",
  protect,
  authorizeRoles("student"),
  getStudentTrend
);

/**
 * GET /api/analytics/risk-students
 * Teacher-only. Base section risk rollup (core intelligence layer).
 */
router.get(
  "/risk-students",
  protect,
  authorizeRoles("teacher"),
  getSectionRiskStudents
);

/**
 * GET /api/analytics/peer-suggestions?subject=DBMS
 * Teacher-only. Section-scoped. Suggests peer mentor pairs for a subject.
 */
router.get(
  "/peer-suggestions",
  protect,
  authorizeRoles("teacher"),
  getPeerSuggestions
);

module.exports = router;
