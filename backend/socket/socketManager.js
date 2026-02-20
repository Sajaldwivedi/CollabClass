/**
 * Tracks online users with multi-device support.
 * Map<userId, Set<socketId>>
 */

/** @type {Map<string, Set<string>>} userId -> Set of socketIds */
const userSocketsMap = new Map();

/**
 * Register a user socket. Supports multiple devices per user.
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {string} socketId - Socket.io socket ID
 */
const registerUser = (userId, socketId) => {
  const uid = String(userId);
  if (!userSocketsMap.has(uid)) {
    userSocketsMap.set(uid, new Set());
  }
  userSocketsMap.get(uid).add(socketId);
};

/**
 * Remove a socket. If user has no more sockets, remove from map.
 * @param {string} socketId - Socket.io socket ID
 */
const removeUserSocket = (socketId) => {
  for (const [userId, socketIds] of userSocketsMap.entries()) {
    if (socketIds.has(socketId)) {
      socketIds.delete(socketId);
      if (socketIds.size === 0) {
        userSocketsMap.delete(userId);
      }
      return;
    }
  }
};

/**
 * Get all socket IDs for a user (multi-device).
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @returns {string[]} Array of socket IDs
 */
const getUserSockets = (userId) => {
  const uid = String(userId);
  const set = userSocketsMap.get(uid);
  return set ? Array.from(set) : [];
};

module.exports = {
  registerUser,
  removeUserSocket,
  getUserSockets,
};
