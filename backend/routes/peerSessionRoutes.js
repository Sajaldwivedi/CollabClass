const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createPeerSession,
  getPeerSessions,
  updatePeerSessionStatus,
} = require("../controllers/peerSessionController");

router.use(protect);

// Students can view peer sessions they're involved in
router.get("/", getPeerSessions);

// Only teachers can create and update sessions
router.post("/", authorizeRoles("teacher"), createPeerSession);
router.patch("/:id/status", authorizeRoles("teacher"), updatePeerSessionStatus);

module.exports = router;

