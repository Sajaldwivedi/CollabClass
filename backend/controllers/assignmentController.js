const Assignment = require("../models/Assignment");

// Create Assignment (Teacher Only)
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

// Get All Assignments (Student sees their section only)
const getAssignments = async (req, res) => {
  try {
    let assignments;

    if (req.user.role === "student") {
      assignments = await Assignment.find({ section: req.user.section });
    } else {
      assignments = await Assignment.find();
    }

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Single Assignment
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

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
};
