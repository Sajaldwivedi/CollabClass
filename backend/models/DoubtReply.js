const mongoose = require("mongoose");

const doubtReplySchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoubtThread",
      required: true,
      index: true,
    },

    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoubtReply",
      default: null,
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
    
    isBestAnswer: {
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

module.exports = mongoose.model("DoubtReply", doubtReplySchema);