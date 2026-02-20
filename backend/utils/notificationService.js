const Notification = require("../models/Notification");
const User = require("../models/User");
const DoubtReply = require("../models/DoubtReply");
const DoubtThread = require("../models/DoubtThread");
const { getUserSockets } = require("../socket/socketManager");
const { getIO } = require("../socket/ioInstance");

/**
 * Emit notification to recipient's sockets if online.
 * No-op if user offline. No crash on missing io.
 * @param {object} notification - Mongoose document (or plain object with _id, recipient, etc.)
 */
const emitToRecipient = (notification) => {
  try {
    const io = getIO();
    if (!io) return;

    const recipientId = notification.recipient?.toString?.() || String(notification.recipient);
    const socketIds = getUserSockets(recipientId);

    const payload = typeof notification.toObject === "function"
      ? notification.toObject()
      : { ...notification };

    for (const socketId of socketIds) {
      io.to(socketId).emit("new_notification", payload);
    }
  } catch (err) {
    console.error("[notificationService] Emit error:", err.message);
  }
};

/**
 * Create a notification in DB, persist, and emit to recipient if online.
 * Skips if recipient equals excludeUserId (don't notify sender).
 * @param {string} recipientId - User ID to notify
 * @param {string} excludeUserId - User ID to exclude (e.g. actor)
 * @param {object} options - { type, message, thread }
 */
const createAndEmit = async (recipientId, excludeUserId, { type, message, thread }) => {
  const rec = String(recipientId);
  const exc = excludeUserId ? String(excludeUserId) : null;
  if (exc && rec === exc) return;

  const notification = await Notification.create({
    recipient: rec,
    thread: thread || null,
    type,
    message,
  });

  emitToRecipient(notification);
};

/**
 * Notify all teachers in a section when a student creates a new thread.
 * Does not notify the thread creator.
 */
const notifySectionTeachers = async (section, thread) => {
  const teachers = await User.find({
    role: "teacher",
    section,
    _id: { $ne: thread.createdBy },
  }).select("_id");

  for (const t of teachers) {
    await createAndEmit(t._id, thread.createdBy, {
      type: "NEW_THREAD",
      message: `New doubt thread: ${thread.title}`,
      thread: thread._id,
    });
  }
};

/**
 * Notify all participants in a thread (creator + repliers) when reply added, resolved, or closed.
 * Excludes excludeUserId (the actor).
 */
const notifyThreadParticipants = async (threadId, excludeUserId, type, message) => {
  const thread = await DoubtThread.findById(threadId).select("createdBy");
  if (!thread) return;

  const repliers = await DoubtReply.find({
    thread: threadId,
    isDeleted: false,
  })
    .distinct("createdBy");

  const participantIds = [
    thread.createdBy,
    ...repliers,
  ].filter(Boolean);

  const uniqueIds = [...new Set(participantIds.map((id) => id.toString()))];

  for (const uid of uniqueIds) {
    await createAndEmit(uid, excludeUserId, {
      type,
      message,
      thread: threadId,
    });
  }
};

module.exports = {
  notifySectionTeachers,
  notifyThreadParticipants,
};
