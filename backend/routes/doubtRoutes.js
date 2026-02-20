const express = require("express");
const router = express.Router();

const {
  createThread,
  getThreads,
  getThreadById,
  addReply,
  resolveThread,
  closeThread,
  deleteThread,
} = require("../controllers/doubtController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.use(protect);

// Thread APIs
router.post("/", createThread);
router.get("/", getThreads);
router.get("/:id", getThreadById);

// Replies
router.post("/:id/reply", addReply);

// Status Updates
router.patch("/:id/resolve", resolveThread);
router.patch("/:id/close", authorizeRoles("teacher", "admin"), closeThread);

// Delete
router.delete("/:id", deleteThread);

module.exports = router;