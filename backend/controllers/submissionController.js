const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

// ===============================
// Student submits assignment
// ===============================
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, content } = req.body;

    if (!assignmentId || !content) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 1️⃣ Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 2️⃣ Manual close validation — only reject if explicitly closed by teacher
    if (assignment.status === "closed") {
      return res.status(400).json({
        message: "Assignment has been closed by the teacher and is not accepting submissions",
      });
    }

    // 3️⃣ Duplicate submission check
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);

    // 4️⃣ Late tracking logic
    const isLate = now > deadline;

    // 5️⃣ Create submission (allowed even after deadline — marked as late)
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      content,
      isLate,
    });

    res.status(201).json(submission);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Teacher views submissions
// ===============================
// ===============================
// Teacher views submissions (Paginated)
// ===============================
const getSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalSubmissions = await Submission.countDocuments({
      assignment: req.params.assignmentId,
    });

    const submissions = await Submission.find({
      assignment: req.params.assignmentId,
    })
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalSubmissions / limit);

    res.json({
      submissions,
      currentPage: page,
      totalPages,
      totalSubmissions,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// ===============================
// Teacher grades submission
// ===============================
const gradeSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.marks = marks;
    submission.feedback = feedback;

    await submission.save();

    res.json(submission);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  submitAssignment,
  getSubmissions,
  gradeSubmission,
};
