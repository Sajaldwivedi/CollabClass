const mongoose = require("mongoose");

const doubtThreadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },

    subject: {
      type: String,
    },

    section: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "resolved", "closed"],
      default: "open",
    },

    replyCount: {
      type: Number,
      default: 0,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoubtThread", doubtThreadSchema);