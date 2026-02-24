const mongoose = require("mongoose");

const peerSessionSchema = new mongoose.Schema(
  {
    weakStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    strongStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["SUGGESTED", "SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "SUGGESTED",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

peerSessionSchema.index({ section: 1, subject: 1, weakStudent: 1, strongStudent: 1 });

module.exports = mongoose.model("PeerSession", peerSessionSchema);

