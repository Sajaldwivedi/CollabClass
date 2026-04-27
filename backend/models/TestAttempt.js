const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptions: [{ type: Number }],
    marksObtained: { type: Number, default: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [answerSchema],
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    tabSwitchCount: { type: Number, default: 0 },
    windowBlurCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    suspiciousFlag: { type: Boolean, default: false },
    status: { type: String, enum: ["in-progress", "submitted", "suspicious"], default: "in-progress" },
    autoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

testAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
