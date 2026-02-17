const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

// Student submits assignment
const submitAssignment = async (req, res) => {
    try {
      const { assignmentId, content } = req.body;
  
      if (!assignmentId || !content) {
        return res.status(400).json({ message: "All fields required" });
      }
  
      // Check if assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
  
      const now = new Date();
  
      // ⏳ Deadline validation
      if (now > new Date(assignment.deadline)) {
        return res.status(400).json({ message: "Submission deadline has passed" });
      }
  
      // 🔒 Manual close validation
      if (assignment.status !== "open") {
        return res.status(400).json({
          message: "Assignment is not accepting submissions",
        });
      }
  
      // 🚫 Duplicate submission check
      const existingSubmission = await Submission.findOne({
        assignment: assignmentId,
        student: req.user._id,
      });
  
      if (existingSubmission) {
        return res.status(400).json({ message: "Already submitted" });
      }
  
      const submission = await Submission.create({
        assignment: assignmentId,
        student: req.user._id,
        content,
      });
  
      res.status(201).json(submission);
  
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  };
  

// Teacher views submissions for an assignment
const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignment: req.params.assignmentId,
    }).populate("student", "name email");

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Teacher grades submission
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
