const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");

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
// Get All Assignments (Filtered + Sorted)
// ===============================
const getAssignments = async (req, res) => {
  try {
    const { status, sort } = req.query;

    let filter = {};
    let sortOption = {};

    const now = new Date();

    // Auto-expire logic
    const assignments = await Assignment.find();

    for (let assignment of assignments) {
      if (
        assignment.status === "open" &&
        now > new Date(assignment.deadline)
      ) {
        assignment.status = "expired";
        await assignment.save();
      }
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Student section filtering
    if (req.user.role === "student") {
      filter.section = req.user.section;
    }

    // Sorting options
    if (sort === "deadline") {
      sortOption.deadline = 1;
    } else if (sort === "createdAt") {
      sortOption.createdAt = -1;
    }

    const filteredAssignments = await Assignment.find(filter).sort(sortOption);

    res.json(filteredAssignments);

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
// Update Assignment Deadline (Teacher)
// ===============================
const updateDeadline = async (req, res) => {
  try {
    const { deadline } = req.body;

    if (!deadline) {
      return res.status(400).json({ message: "Deadline is required" });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify teacher owns this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this assignment" });
    }

    const newDeadline = new Date(deadline);

    assignment.deadline = newDeadline;

    // If the new deadline is in the future, re-open the assignment
    if (newDeadline > new Date() && (assignment.status === "expired" || assignment.status === "closed")) {
      assignment.status = "open";
    }

    await assignment.save();

    res.json(assignment);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Delete Assignment (Teacher)
// ===============================
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify teacher owns this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this assignment" });
    }

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: assignment._id });

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignment._id);

    res.json({ message: "Assignment and related submissions deleted successfully" });

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

    const pendingGrading = totalSubmissions - gradedSubmissions;

    const lateSubmissions = await Submission.countDocuments({
      assignment: assignment._id,
      isLate: true,
    });

    const totalStudentsInSection = await User.countDocuments({
      role: "student",
      section: assignment.section,
    });

    const submissionRate =
      totalStudentsInSection > 0
        ? (totalSubmissions / totalStudentsInSection) * 100
        : 0;

    // 🏆 Highest marks
    const highestSubmission = await Submission.findOne({
      assignment: assignment._id,
      marks: { $ne: null },
    })
      .sort({ marks: -1 })
      .populate("student", "name email");

    // 📉 Lowest marks
    const lowestSubmission = await Submission.findOne({
      assignment: assignment._id,
      marks: { $ne: null },
    })
      .sort({ marks: 1 });

    res.json({
      assignmentId: assignment._id,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
      lateSubmissions,
      submissionRate: Number(submissionRate.toFixed(2)),
      status: assignment.status,

      highestMarks: highestSubmission ? highestSubmission.marks : null,
      lowestMarks: lowestSubmission ? lowestSubmission.marks : null,
      topStudent: highestSubmission ? highestSubmission.student : null,
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
  updateDeadline,
  deleteAssignment,
  getAssignmentAnalytics,
};
