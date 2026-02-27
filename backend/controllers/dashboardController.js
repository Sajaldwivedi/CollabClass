const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");

const getTeacherDashboard = async (req, res) => {
  try {
    // Ensure teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 1️⃣ Get teacher's assignments
    const teacherAssignments = await Assignment.find({
      createdBy: req.user._id,
    }).select("_id section");

    const assignmentIds = teacherAssignments.map(a => a._id);

    // 2️⃣ Count assignments
    const totalAssignments = assignmentIds.length;

    // 3️⃣ Count students in teacher's section
    const sectionFilter = req.user.section
      ? { role: "student", section: req.user.section }
      : { role: "student" };
    const totalStudents = await User.countDocuments(sectionFilter);

    // 4️⃣ Submissions only for teacher's assignments
    const totalSubmissions = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
    });

    const gradedSubmissions = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      marks: { $ne: null },
    });

    const pendingGrading = totalSubmissions - gradedSubmissions;

    // 5️⃣ Average marks (teacher scoped)
    const averageMarksData = await Submission.aggregate([
      {
        $match: {
          assignment: { $in: assignmentIds },
          marks: { $ne: null },
        },
      },
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

    // 6️⃣ Late submissions count (if you added isLate field)
    const lateSubmissions = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      isLate: true,
    });

    res.json({
      totalAssignments,
      totalStudents,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading,
      lateSubmissions,
      averageMarks: Number(averageMarks.toFixed(2)),
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getTeacherDashboard };
