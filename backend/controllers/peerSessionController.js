const PeerSession = require("../models/PeerSession");
const User = require("../models/User");
const mongoose = require("mongoose");

const isValidObjectId = (id) => {
  return Boolean(id) && mongoose.Types.ObjectId.isValid(id);
};

// POST /api/peer-sessions
// Teacher only. Creates a scheduled peer session (section-isolated).
exports.createPeerSession = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    const { weakStudent, strongStudent, subject, scheduledDate, notes } = req.body || {};

    if (!weakStudent || !strongStudent || !subject || !scheduledDate) {
      return res.status(400).json({
        message: "weakStudent, strongStudent, subject, and scheduledDate are required",
      });
    }

    if (String(weakStudent) === String(strongStudent)) {
      return res.status(400).json({ message: "weakStudent and strongStudent must be different" });
    }

    if (!isValidObjectId(weakStudent) || !isValidObjectId(strongStudent)) {
      return res.status(400).json({ message: "Invalid student id(s)" });
    }

    // Ensure both students are in teacher's section (single query)
    const users = await User.find({
      _id: { $in: [weakStudent, strongStudent] },
      role: "student",
      section: teacherSection,
    }).select("_id");

    if (users.length !== 2) {
      return res.status(403).json({ message: "Students must belong to your section" });
    }

    // Prevent duplicate open sessions for the same pair+subject in the section
    const existing = await PeerSession.findOne({
      section: teacherSection,
      subject,
      weakStudent,
      strongStudent,
      status: { $in: ["SUGGESTED", "SCHEDULED"] },
    }).select("_id status");

    if (existing) {
      return res.status(409).json({
        message: "An open peer session already exists for this pair and subject",
      });
    }

    const session = await PeerSession.create({
      weakStudent,
      strongStudent,
      subject,
      section: teacherSection,
      createdBy: req.user._id,
      scheduledDate: new Date(scheduledDate),
      status: "SCHEDULED",
      notes: notes || "",
    });

    res.status(201).json(session);
  } catch (error) {
    console.error("createPeerSession error:", error);
    res.status(500).json({ message: "Failed to create peer session" });
  }
};

// GET /api/peer-sessions
// Teacher only. Lists sessions for teacher's section.
exports.getPeerSessions = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    const { status, subject } = req.query || {};

    const query = { section: teacherSection };
    if (status) query.status = status;
    if (subject) query.subject = subject;

    const sessions = await PeerSession.find(query)
      .sort({ scheduledDate: -1, createdAt: -1 })
      .populate("weakStudent", "name regNo section")
      .populate("strongStudent", "name regNo section")
      .populate("createdBy", "name role section");

    res.status(200).json(sessions);
  } catch (error) {
    console.error("getPeerSessions error:", error);
    res.status(500).json({ message: "Failed to fetch peer sessions" });
  }
};

// PATCH /api/peer-sessions/:id/status
// Teacher only. Controlled lifecycle transitions.
exports.updatePeerSessionStatus = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const allowedTransitions = {
      SUGGESTED: ["SCHEDULED"],
      SCHEDULED: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const session = await PeerSession.findOne({
      _id: req.params.id,
      section: teacherSection,
    });

    if (!session) {
      return res.status(404).json({ message: "Peer session not found" });
    }

    const current = session.status;
    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${current} -> ${status}`,
      });
    }

    session.status = status;
    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.error("updatePeerSessionStatus error:", error);
    res.status(500).json({ message: "Failed to update peer session status" });
  }
};

