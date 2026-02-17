const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

// ===============================
// Create Assignment (Teacher Only)
// ===============================
const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, section, deadline } = req.body;

    if (!title || !description || !subject || !section || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      section,
      deadline,
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Get All Assignments
// ===============================
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find();

    const now = new Date();

    // Auto-expire open assignments
    for (let assignment of assignments) {
      if (
        assignment.status === "open" &&
        now > new Date(assignment.deadline)
      ) {
        assignment.status = "expired";
        await assignment.save();
      }
    }

    if (req.user.role === "student") {
      return res.json(
        assignments.filter(a => a.section === req.user.section)
      );
    }

    res.json(assignments);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Get Single Assignment
// ===============================
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Teacher Closes Assignment Manually
// ===============================
const closeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.status = "closed";
    await assignment.save();

    res.json({ message: "Assignment closed successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Assignment Analytics (Teacher)
// ===============================
const getAssignmentAnalytics = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const totalSubmissions = await Submission.countDocuments({
      assignment: assignment._id,
    });

    const gradedSubmissions = await Submission.countDocuments({
      assignment: assignment._id,
      marks: { $ne: null },
    });

    res.json({
      assignmentId: assignment._id,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      status: assignment.status,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  closeAssignment,
  getAssignmentAnalytics,
};
