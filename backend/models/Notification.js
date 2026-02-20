const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoubtThread",
      default: null,
    },
    type: {
      type: String,
      enum: ["NEW_THREAD", "NEW_REPLY", "THREAD_RESOLVED", "THREAD_CLOSED"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
