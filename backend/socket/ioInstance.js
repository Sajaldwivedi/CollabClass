/**
 * Holds Socket.io server instance.
 * Prevents circular dependency: notificationService -> io -> server -> routes -> doubtController -> notificationService
 */
let io = null;

const setIO = (instance) => {
  io = instance;
};

const getIO = () => io;

module.exports = { setIO, getIO };
