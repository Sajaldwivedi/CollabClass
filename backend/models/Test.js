const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    negativeMarking: { type: Number, default: 0 }, // marks deducted per wrong answer
    shuffleQuestions: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "active", "completed"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
