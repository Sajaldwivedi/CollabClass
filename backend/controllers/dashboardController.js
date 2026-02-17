const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");

const getTeacherDashboard = async (req, res) => {
  try {
    // Only teachers
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalAssignments = await Assignment.countDocuments({
      createdBy: req.user._id,
    });

    const totalStudents = await User.countDocuments({
      role: "student",
    });

    const totalSubmissions = await Submission.countDocuments();

    const gradedSubmissions = await Submission.countDocuments({
      marks: { $ne: null },
    });

    const pendingGrading = totalSubmissions - gradedSubmissions;

    const averageMarksData = await Submission.aggregate([
      { $match: { marks: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgMarks: { $avg: "$marks" },
        },
      },
    ]);

    const averageMarks =
      averageMarksData.length > 0
        ? averageMarksData[0].avgMarks
        : 0;

    res.json({
      totalAssignments,
      totalStudents,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
      averageMarks: Number(averageMarks.toFixed(2)),
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getTeacherDashboard };
