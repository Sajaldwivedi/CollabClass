const Test = require("../models/Test");
const Question = require("../models/Question");
const TestAttempt = require("../models/TestAttempt");
const User = require("../models/User");

const DEFAULT_THRESHOLDS = {
  tabSwitch: parseInt(process.env.TAB_SWITCH_THRESHOLD || "3"),
  windowBlur: parseInt(process.env.WINDOW_BLUR_THRESHOLD || "3"),
  fullscreenExit: parseInt(process.env.FULLSCREEN_EXIT_THRESHOLD || "1"),
  totalViolations: parseInt(process.env.TOTAL_VIOLATIONS_THRESHOLD || "5"),
  timeAnomalySeconds: parseInt(process.env.TIME_ANOMALY_SECONDS || "30"),
};

// Helper to shuffle array
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

exports.createTest = async (req, res) => {
  try {
    const {
      title,
      subject,
      section,
      duration,
      startTime,
      endTime,
      totalMarks,
      negativeMarking,
      shuffleQuestions,
      status,
    } = req.body;

    if (!title || !subject || !section || !duration || !startTime || !endTime || !totalMarks) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const test = await Test.create({
      title,
      subject,
      section,
      duration,
      startTime,
      endTime,
      totalMarks,
      negativeMarking: negativeMarking || 0,
      shuffleQuestions: !!shuffleQuestions,
      status: status || "draft",
      createdBy: req.user._id,
    });

    res.status(201).json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { id } = req.params; // test id
    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Only creator may add questions
    if (test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only creator can modify test" });
    }

    const payload = req.body;
    const created = [];

    if (Array.isArray(payload.questions)) {
      for (const q of payload.questions) {
        const question = await Question.create({
          testId: id,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswers: q.correctAnswers || [],
          marks: q.marks || 1,
        });
        created.push(question);
      }
    } else {
      const question = await Question.create({
        testId: id,
        questionText: payload.questionText,
        options: payload.options || [],
        correctAnswers: payload.correctAnswers || [],
        marks: payload.marks || 1,
      });
      created.push(question);
    }

    res.status(201).json({ created });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listTests = async (req, res) => {
  try {
    // Teachers can see their tests (optionally all), students will use /available
    const query = {};
    if (req.user.role === "teacher") {
      query.createdBy = req.user._id;
    }

    const tests = await Test.find(query).sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "active", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (test.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    test.status = status;
    await test.save();

    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTestAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Only creator or admin
    if (test.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const attempts = await TestAttempt.find({ testId: id }).populate("studentId", "name email section");

    const scores = attempts.map((a) => a.score || 0);
    const submitted = attempts.filter((a) => a.status === "submitted" || a.autoSubmitted).length;
    const total = attempts.length;

    const avg = total ? scores.reduce((s, v) => s + v, 0) / total : 0;
    const highest = scores.length ? Math.max(...scores) : 0;
    const lowest = scores.length ? Math.min(...scores) : 0;
    const suspicious = attempts.filter((a) => a.suspiciousFlag).map((a) => ({ student: a.studentId, attemptId: a._id }));

    res.json({ attempts, analytics: { average: avg, highest, lowest, suspicious, submissionRate: total ? submitted / total : 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// STUDENT: available tests for student's section
exports.getAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    const section = req.user.section;
    if (!section) return res.status(400).json({ message: "Student has no section assigned" });

    const tests = await Test.find({
      section,
      status: "active",
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ startTime: 1 });

    const testIds = tests.map((test) => test._id);
    const attempts = await TestAttempt.find({
      testId: { $in: testIds },
      studentId: req.user._id,
    }).select("testId score status submittedAt suspiciousFlag");

    const attemptMap = new Map(attempts.map((attempt) => [attempt.testId.toString(), attempt]));

    const payload = tests.map((test) => {
      const attempt = attemptMap.get(test._id.toString());
      const item = test.toObject();
      return {
        ...item,
        hasAttempted: Boolean(attempt),
        attemptStatus: attempt?.status || null,
        attemptScore: attempt?.score ?? null,
        attemptedAt: attempt?.submittedAt || null,
        suspiciousFlag: attempt?.suspiciousFlag || false,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.startTest = async (req, res) => {
  try {
    const { id } = req.params; // test id
    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const now = new Date();
    if (test.status !== "active" || now < test.startTime || now > test.endTime) {
      return res.status(400).json({ message: "Test not available at this time" });
    }

    if (req.user.section !== test.section) return res.status(403).json({ message: "Access denied for this section" });

    // prevent multiple attempts
    const existing = await TestAttempt.findOne({ testId: id, studentId: req.user._id });
    if (existing) {
      // If there is an in-progress attempt, allow the student to resume it
      if (existing.status === "in-progress") {
        // compute remaining time in seconds
        const started = new Date(existing.startedAt);
        const elapsed = Math.floor((now - started) / 1000);
        const allowedSeconds = test.duration * 60;
        const remainingSeconds = Math.max(0, allowedSeconds - elapsed);

        // Load questions (without correct answers) and prepare ordered list
        let questions = await Question.find({ testId: id });
        const questionsForClient = questions
          .map((q) => ({ questionId: q._id, questionText: q.questionText, options: q.options }))
          .filter((q) => existing.questionOrder.map(String).includes(String(q.questionId)));

        const ordered = existing.questionOrder.map((qid) =>
          questionsForClient.find((x) => x.questionId.toString() === qid.toString())
        );

        return res.json({ attemptId: existing._id, questions: ordered, duration: test.duration, resumed: true, remainingSeconds });
      }

      return res.status(400).json({ message: "Test already started or attempted" });
    }

    let questions = await Question.find({ testId: id });

    const questionOrder = questions.map((q) => q._id);
    if (test.shuffleQuestions) shuffle(questionOrder);

    const attempt = await TestAttempt.create({
      testId: id,
      studentId: req.user._id,
      questionOrder,
      startedAt: now,
    });

    // prepare question payload (without correctAnswers)
    const questionsForClient = questions
      .map((q) => ({ questionId: q._id, questionText: q.questionText, options: q.options }))
      .filter((q) => questionOrder.includes(q.questionId));

    // reorder according to questionOrder
    const ordered = questionOrder.map((qid) => questionsForClient.find((x) => x.questionId.toString() === qid.toString()));

    res.json({ attemptId: attempt._id, questions: ordered, duration: test.duration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper to compare arrays of numbers
function arraysEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  const A = a.slice().map(Number).sort();
  const B = b.slice().map(Number).sort();
  return A.every((v, i) => v === B[i]);
}

exports.submitTest = async (req, res) => {
  try {
    const { id } = req.params; // test id
    const { answers = [], tabSwitchCount = 0, windowBlurCount = 0, fullscreenExitCount = 0 } = req.body;

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const attempt = await TestAttempt.findOne({ testId: id, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status === "submitted") return res.status(400).json({ message: "Already submitted" });

    const now = new Date();
    const started = new Date(attempt.startedAt);
    const timeTakenSeconds = Math.floor((now - started) / 1000);
    const allowedSeconds = test.duration * 60;
    let autoSubmitted = false;
    if (timeTakenSeconds > allowedSeconds) autoSubmitted = true;

    // Load questions
    const questions = await Question.find({ testId: id });
    const qMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Evaluate
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const answersByQ = new Map();
    for (const a of answers) answersByQ.set(a.questionId.toString(), a.selectedOptions || []);

    const answersToSave = [];

    for (const qid of attempt.questionOrder) {
      const q = qMap.get(qid.toString());
      if (!q) continue; // question deleted
      const selected = answersByQ.get(qid.toString()) || [];

      const isCorrect = arraysEqual(selected, q.correctAnswers || []);
      let marksObtained = 0;
      if (isCorrect) {
        marksObtained = q.marks;
        correctCount++;
      } else {
        wrongCount++;
        if (test.negativeMarking) marksObtained = -Math.abs(test.negativeMarking);
      }

      score += marksObtained;

      answersToSave.push({ questionId: q._id, selectedOptions: selected, marksObtained });
    }

    if (score < 0) score = 0;

    // update counters and flags
    attempt.answers = answersToSave;
    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.submittedAt = now;
    attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + Number(tabSwitchCount || 0);
    attempt.windowBlurCount = (attempt.windowBlurCount || 0) + Number(windowBlurCount || 0);
    attempt.fullscreenExitCount = (attempt.fullscreenExitCount || 0) + Number(fullscreenExitCount || 0);
    attempt.autoSubmitted = autoSubmitted;
    attempt.status = "submitted";

    const totalViolations = attempt.tabSwitchCount + attempt.windowBlurCount + attempt.fullscreenExitCount;
    let suspicious = false;
    if (
      attempt.tabSwitchCount > DEFAULT_THRESHOLDS.tabSwitch ||
      attempt.windowBlurCount > DEFAULT_THRESHOLDS.windowBlur ||
      attempt.fullscreenExitCount > DEFAULT_THRESHOLDS.fullscreenExit ||
      totalViolations > DEFAULT_THRESHOLDS.totalViolations ||
      timeTakenSeconds - allowedSeconds > DEFAULT_THRESHOLDS.timeAnomalySeconds
    ) {
      suspicious = true;
    }

    attempt.suspiciousFlag = suspicious;
    if (suspicious) attempt.status = "suspicious";

    await attempt.save();

    res.json({ score, correctCount, wrongCount, suspicious, autoSubmitted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getResult = async (req, res) => {
  try {
    const { id } = req.params; // test id
    const attempt = await TestAttempt.findOne({ testId: id, studentId: req.user._id }).populate("answers.questionId", "questionText options");
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    res.json({ attempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
