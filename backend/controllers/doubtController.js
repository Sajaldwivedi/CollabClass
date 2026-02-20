const DoubtThread = require("../models/DoubtThread");
const DoubtReply = require("../models/DoubtReply");
const Assignment = require("../models/Assignment");

const {
  notifySectionTeachers,
  notifyThreadParticipants,
} = require("../utils/notificationService");


// ==========================================
// UTILITY — BUILD NESTED REPLY TREE
// ==========================================
const buildReplyTree = (replies) => {
  const replyMap = {};
  const rootReplies = [];

  replies.forEach((reply) => {
    replyMap[reply._id] = { ...reply._doc, children: [] };
  });

  replies.forEach((reply) => {
    if (reply.parentReply) {
      const parent = replyMap[reply.parentReply];
      if (parent) {
        parent.children.push(replyMap[reply._id]);
      }
    } else {
      rootReplies.push(replyMap[reply._id]);
    }
  });

  return rootReplies;
};


// ==========================================
// CREATE THREAD
// ==========================================
exports.createThread = async (req, res) => {
  try {
    const { title, content, assignment, subject } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Title and content are required" });

    if (!assignment && !subject)
      return res.status(400).json({ message: "Assignment or subject required" });

    if (assignment) {
      const assignmentDoc = await Assignment.findById(assignment);

      if (!assignmentDoc)
        return res.status(404).json({ message: "Assignment not found" });

      if (assignmentDoc.section !== req.user.section)
        return res.status(403).json({ message: "Section mismatch" });

      if (assignmentDoc.status !== "open")
        return res.status(400).json({ message: "Assignment not open for discussion" });
    }

    const thread = await DoubtThread.create({
      title,
      content,
      assignment: assignment || null,
      subject: subject || null,
      createdBy: req.user._id,
      role: req.user.role,
      section: req.user.section,
    });

    await notifySectionTeachers(req.user.section, thread);

    res.status(201).json(thread);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// GET ALL THREADS (FILTER + PAGINATION)
// ==========================================
exports.getThreads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignment, subject } = req.query;

    const query = {
      section: req.user.section,
      isDeleted: false,
    };

    if (status) query.status = status;
    if (assignment) query.assignment = assignment;
    if (subject) query.subject = subject;

    const threads = await DoubtThread.find(query)
      .sort({ isPinned: -1, lastActivityAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "name role");

    const total = await DoubtThread.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      threads,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// GET SINGLE THREAD WITH NESTED REPLIES
// ==========================================
exports.getThreadById = async (req, res) => {
  try {
    const thread = await DoubtThread.findById(req.params.id)
      .populate("createdBy", "name role");

    if (!thread || thread.isDeleted)
      return res.status(404).json({ message: "Thread not found" });

    if (thread.section !== req.user.section)
      return res.status(403).json({ message: "Access denied" });

    const replies = await DoubtReply.find({
      thread: thread._id,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate("createdBy", "name role");

    const structuredReplies = buildReplyTree(replies);

    res.json({
      thread,
      replies: structuredReplies,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// ADD REPLY
// ==========================================
exports.addReply = async (req, res) => {
  try {
    const { content, parentReply } = req.body;

    if (!content)
      return res.status(400).json({ message: "Reply content required" });

    const thread = await DoubtThread.findById(req.params.id);

    if (!thread || thread.isDeleted)
      return res.status(404).json({ message: "Thread not found" });

    if (thread.section !== req.user.section)
      return res.status(403).json({ message: "Section mismatch" });

    if (thread.status === "closed")
      return res.status(400).json({ message: "Thread is closed" });

    if (parentReply) {
      const parent = await DoubtReply.findById(parentReply);
      if (!parent)
        return res.status(404).json({ message: "Parent reply not found" });
    }

    const reply = await DoubtReply.create({
      thread: thread._id,
      parentReply: parentReply || null,
      content,
      createdBy: req.user._id,
      role: req.user.role,
    });

    thread.replyCount += 1;
    thread.lastActivityAt = Date.now();
    await thread.save();

    await notifyThreadParticipants(
      thread._id,
      req.user._id,
      "NEW_REPLY",
      `New reply in thread: ${thread.title}`
    );

    res.status(201).json(reply);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// RESOLVE THREAD
// ==========================================
exports.resolveThread = async (req, res) => {
  try {
    const thread = await DoubtThread.findById(req.params.id);

    if (!thread || thread.isDeleted)
      return res.status(404).json({ message: "Thread not found" });

    if (
      req.user.role !== "teacher" &&
      thread.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    thread.status = "resolved";
    await thread.save();

    await notifyThreadParticipants(
      thread._id,
      req.user._id,
      "THREAD_RESOLVED",
      `Thread resolved: ${thread.title}`
    );

    res.json(thread);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// CLOSE THREAD
// ==========================================
exports.closeThread = async (req, res) => {
  try {
    const thread = await DoubtThread.findById(req.params.id);

    if (!thread || thread.isDeleted)
      return res.status(404).json({ message: "Thread not found" });

    thread.status = "closed";
    await thread.save();

    await notifyThreadParticipants(
      thread._id,
      req.user._id,
      "THREAD_CLOSED",
      `Thread closed: ${thread.title}`
    );

    res.json(thread);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// SOFT DELETE THREAD
// ==========================================
exports.deleteThread = async (req, res) => {
  try {
    const thread = await DoubtThread.findById(req.params.id);

    if (!thread)
      return res.status(404).json({ message: "Thread not found" });

    if (
      req.user.role !== "teacher" &&
      thread.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    thread.isDeleted = true;
    await thread.save();

    res.json({ message: "Thread deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};