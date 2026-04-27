const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    // store correct answers as array of option indexes (numbers)
    correctAnswers: [{ type: Number }],
    marks: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
