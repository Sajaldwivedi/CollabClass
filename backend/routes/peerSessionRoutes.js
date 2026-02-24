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
router.use(authorizeRoles("teacher"));

router.post("/", createPeerSession);
router.get("/", getPeerSessions);
router.patch("/:id/status", updatePeerSessionStatus);

module.exports = router;

