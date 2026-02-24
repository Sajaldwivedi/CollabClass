const Submission = require("../models/Submission");
const DoubtThread = require("../models/DoubtThread");
const DoubtReply = require("../models/DoubtReply");
const User = require("../models/User");
const mongoose = require("mongoose");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const riskFromStrength = (strengthScore) => {
  if (strengthScore >= 70) return "LOW";
  if (strengthScore >= 40) return "MEDIUM";
  return "HIGH";
};

/**
 * Section-scoped per-student rollup used by teacher analytics endpoints.
 *
 * Aggregation strategy (no N+1):
 * - 1 aggregation for section student IDs (User)
 * - 1 aggregation for submission stats by student (Submission + $lookup Assignment)
 * - 1 aggregation for threads started by student in section (DoubtThread)
 * - 1 aggregation for replies given by student in section (DoubtReply + $lookup DoubtThread)
 * Then merge maps in memory and compute normalized engagement & overall metrics.
 */
const buildSectionStudentRollup = async (teacherSection) => {
  const [students, submissionStats, threadStats, replyStats] = await Promise.all([
    User.aggregate([
      { $match: { role: "student", section: teacherSection } },
      { $project: { _id: 1 } },
    ]),
    Submission.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentDoc",
        },
      },
      { $unwind: "$assignmentDoc" },
      { $match: { "assignmentDoc.section": teacherSection } },
      {
        $group: {
          _id: "$student",
          avgMarks: { $avg: "$marks" },
          totalSubmissions: { $sum: 1 },
          lateSubmissions: { $sum: { $cond: ["$isLate", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          avgMarks: { $ifNull: ["$avgMarks", 0] },
          totalSubmissions: 1,
          lateSubmissions: 1,
          lateRatio: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              {
                $multiply: [
                  { $divide: ["$lateSubmissions", "$totalSubmissions"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]),
    DoubtThread.aggregate([
      {
        $match: {
          section: teacherSection,
          role: "student",
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: "$createdBy", threadsStarted: { $sum: 1 } } },
      { $project: { _id: 0, studentId: "$_id", threadsStarted: 1 } },
    ]),
    DoubtReply.aggregate([
      { $match: { role: "student", isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "doubtthreads",
          localField: "thread",
          foreignField: "_id",
          as: "threadDoc",
        },
      },
      { $unwind: "$threadDoc" },
      {
        $match: {
          "threadDoc.section": teacherSection,
          "threadDoc.isDeleted": { $ne: true },
        },
      },
      { $group: { _id: "$createdBy", repliesGiven: { $sum: 1 } } },
      { $project: { _id: 0, studentId: "$_id", repliesGiven: 1 } },
    ]),
  ]);

  const submissionByStudent = new Map(
    submissionStats.map((s) => [String(s.studentId), s])
  );
  const threadsByStudent = new Map(
    threadStats.map((t) => [String(t.studentId), t.threadsStarted])
  );
  const repliesByStudent = new Map(
    replyStats.map((r) => [String(r.studentId), r.repliesGiven])
  );

  const rollup = students.map((s) => {
    const studentId = String(s._id);
    const sub = submissionByStudent.get(studentId) || null;

    const avgMarks = sub ? Number(sub.avgMarks) || 0 : 0;
    const totalSubmissions = sub ? Number(sub.totalSubmissions) || 0 : 0;
    const lateSubmissions = sub ? Number(sub.lateSubmissions) || 0 : 0;
    const lateRatio = sub ? Number(sub.lateRatio) || 0 : 0;

    const threadsStarted = Number(threadsByStudent.get(studentId) || 0);
    const repliesGiven = Number(repliesByStudent.get(studentId) || 0);

    // Refined engagement (raw; normalized later against section max)
    const engagementRaw = repliesGiven * 3 + threadsStarted * 2 - lateSubmissions * 1;

    return {
      studentId,
      avgMarks,
      totalSubmissions,
      lateSubmissions,
      lateRatio,
      threadsStarted,
      repliesGiven,
      engagementRaw,
    };
  });

  const maxEngagementRaw = rollup.reduce((max, s) => {
    const v = Math.max(0, Number(s.engagementRaw) || 0);
    return v > max ? v : max;
  }, 0);

  // Overall strength model (0–100) used as the risk base for teacher endpoints.
  // Marks dominate; engagement contributes; lateness penalizes.
  return rollup.map((s) => {
    const engagementScore =
      maxEngagementRaw > 0
        ? clamp((Math.max(0, s.engagementRaw) / maxEngagementRaw) * 100, 0, 100)
        : 0;

    const overallStrength = clamp(
      clamp(s.avgMarks, 0, 100) * 0.65 +
        clamp(engagementScore, 0, 100) * 0.25 -
        clamp(s.lateRatio, 0, 100) * 0.1,
      0,
      100
    );

    const overallRisk = riskFromStrength(overallStrength);

    return {
      ...s,
      engagementScore: Math.round(engagementScore * 100) / 100,
      overallStrength: Math.round(overallStrength * 100) / 100,
      overallRisk,
    };
  });
};

/**
 * GET /api/analytics/student-strength
 * Student-only. Returns per-subject strength analytics for req.user._id.
 * Computed dynamically via aggregation; no stored analytics.
 */
const getStudentStrength = async (req, res) => {
  try {
    const studentId = req.user._id;
    if (!studentId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId)
      ? new mongoose.Types.ObjectId(studentId)
      : null;
    if (!studentObjectId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // 1) Submission stats per subject (only subjects where student has submissions)
    const submissionStats = await Submission.aggregate([
      { $match: { student: studentObjectId } },
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentDoc",
        },
      },
      { $unwind: "$assignmentDoc" },
      {
        $group: {
          _id: "$assignmentDoc.subject",
          avgMarks: { $avg: "$marks" },
          totalSubmissions: { $sum: 1 },
          lateSubmissions: { $sum: { $cond: ["$isLate", 1, 0] } },
        },
      },
      { $project: { subject: "$_id", avgMarks: 1, totalSubmissions: 1, lateSubmissions: 1, _id: 0 } },
    ]);

    if (submissionStats.length === 0) {
      return res.status(200).json([]);
    }

    // 2) Doubt threads created by this student, grouped by subject
    const doubtThreadCounts = await DoubtThread.aggregate([
      { $match: { createdBy: studentObjectId, isDeleted: { $ne: true } } },
      { $group: { _id: { $ifNull: ["$subject", ""] }, doubtsAsked: { $sum: 1 } } },
      { $project: { subject: "$_id", doubtsAsked: 1, _id: 0 } },
    ]);

    // 3) Doubt replies by this student, grouped by thread's subject
    const doubtReplyCounts = await DoubtReply.aggregate([
      { $match: { createdBy: studentObjectId, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "doubtthreads",
          localField: "thread",
          foreignField: "_id",
          as: "threadDoc",
        },
      },
      { $unwind: "$threadDoc" },
      { $group: { _id: { $ifNull: ["$threadDoc.subject", ""] }, repliesGiven: { $sum: 1 } } },
      { $project: { subject: "$_id", repliesGiven: 1, _id: 0 } },
    ]);

    const doubtBySubject = Object.fromEntries(doubtThreadCounts.map((d) => [d.subject, d.doubtsAsked]));
    const repliesBySubject = Object.fromEntries(doubtReplyCounts.map((r) => [r.subject, r.repliesGiven]));

    const result = submissionStats.map((row) => {
      const subject = row.subject;
      const avgMarks = row.avgMarks != null ? Number(row.avgMarks) : 0;
      const totalSubmissions = Number(row.totalSubmissions) || 0;
      const lateSubmissions = Number(row.lateSubmissions) || 0;
      const doubtsAsked = Number(doubtBySubject[subject] || 0);
      const repliesGiven = Number(repliesBySubject[subject] || 0);

      const normalizedMarks = Math.min(100, Math.max(0, avgMarks));
      const participationScore = repliesGiven * 2;
      const latePenalty = lateSubmissions * 5;
      const doubtPenalty = doubtsAsked * 2;

      let strengthScore =
        normalizedMarks * 0.6 +
        participationScore * 0.2 -
        latePenalty * 0.1 -
        doubtPenalty * 0.1;
      strengthScore = Math.min(100, Math.max(0, strengthScore));

      let riskLevel = "MEDIUM";
      if (strengthScore >= 70) riskLevel = "LOW";
      else if (strengthScore < 40) riskLevel = "HIGH";

      return {
        subject,
        avgMarks: Math.round(avgMarks * 100) / 100,
        totalSubmissions,
        lateSubmissions,
        doubtsAsked,
        repliesGiven,
        strengthScore: Math.round(strengthScore * 100) / 100,
        riskLevel,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("getStudentStrength error:", err);
    res.status(500).json({ message: "Failed to compute student strength analytics" });
  }
};

/**
 * GET /api/analytics/section-analytics
 * Teacher-only. Returns per-subject weak-topic analytics for req.user.section.
 * Section-isolated; computed dynamically via aggregation.
 */
const getSectionAnalytics = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    // 1) Submission stats per subject for this section (via assignments in section)
    const submissionStats = await Submission.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentDoc",
        },
      },
      { $unwind: "$assignmentDoc" },
      { $match: { "assignmentDoc.section": teacherSection } },
      {
        $group: {
          _id: "$assignmentDoc.subject",
          avgMarks: { $avg: "$marks" },
          totalSubmissions: { $sum: 1 },
          lateCount: { $sum: { $cond: ["$isLate", 1, 0] } },
        },
      },
      {
        $project: {
          subject: "$_id",
          avgMarks: 1,
          totalSubmissions: 1,
          lateCount: 1,
          _id: 0,
        },
      },
    ]);

    // 2) Doubt count per subject in this section
    const doubtCounts = await DoubtThread.aggregate([
      { $match: { section: teacherSection, isDeleted: { $ne: true } } },
      { $group: { _id: { $ifNull: ["$subject", ""] }, doubtCount: { $sum: 1 } } },
      { $project: { subject: "$_id", doubtCount: 1, _id: 0 } },
    ]);

    const doubtBySubject = Object.fromEntries(doubtCounts.map((d) => [d.subject, d.doubtCount]));

    const result = submissionStats.map((row) => {
      const subject = row.subject;
      const avgMarks = row.avgMarks != null ? Number(row.avgMarks) : 0;
      const totalSubmissions = Number(row.totalSubmissions) || 0;
      const lateCount = Number(row.lateCount) || 0;
      const lateRatio = totalSubmissions > 0 ? (lateCount / totalSubmissions) * 100 : 0;
      const doubtCount = Number(doubtBySubject[subject] || 0);

      const weakTopicScore =
        (100 - Math.min(100, Math.max(0, avgMarks))) * 0.5 +
        lateRatio * 0.3 +
        doubtCount * 0.2;

      return {
        subject,
        avgMarks: Math.round(avgMarks * 100) / 100,
        totalSubmissions,
        lateRatio: Math.round(lateRatio * 100) / 100,
        doubtCount,
        weakTopicScore: Math.round(weakTopicScore * 100) / 100,
      };
    });

    result.sort((a, b) => b.weakTopicScore - a.weakTopicScore);

    res.status(200).json(result);
  } catch (err) {
    console.error("getSectionAnalytics error:", err);
    res.status(500).json({ message: "Failed to compute section analytics" });
  }
};

/**
 * GET /api/analytics/interventions
 * Teacher-only. Section-scoped. Computes intervention recommendations per student.
 */
const getInterventions = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    const rollup = await buildSectionStudentRollup(teacherSection);

    const result = rollup.map((s) => {
      let recommendedAction = "MONITOR";

      if (s.avgMarks < 40) recommendedAction = "ACADEMIC_SUPPORT";
      else if (s.lateRatio > 30) recommendedAction = "ACADEMIC_SUPPORT";
      else if (s.engagementScore < 30) recommendedAction = "ENGAGEMENT_SUPPORT";
      else if (s.overallRisk === "HIGH") recommendedAction = "ACADEMIC_SUPPORT";

      return {
        studentId: s.studentId,
        avgMarks: Math.round(s.avgMarks * 100) / 100,
        lateRatio: Math.round(s.lateRatio * 100) / 100,
        engagementScore: s.engagementScore,
        overallStrength: s.overallStrength,
        overallRisk: s.overallRisk,
        recommendedAction,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("getInterventions error:", err);
    res.status(500).json({ message: "Failed to compute interventions" });
  }
};

/**
 * GET /api/analytics/top-performers
 * Teacher-only. Section-scoped. Returns top 5 students by overallStrength.
 */
const getTopPerformers = async (req, res) => {
  try {
    const teacherSection = req.user.section;
    if (!teacherSection) {
      return res.status(403).json({ message: "Section not assigned; access denied" });
    }

    const rollup = await buildSectionStudentRollup(teacherSection);

    const result = rollup
      .slice()
      .sort((a, b) => b.overallStrength - a.overallStrength)
      .slice(0, 5)
      .map((s) => ({
        studentId: s.studentId,
        overallStrength: s.overallStrength,
        engagementScore: s.engagementScore,
        avgMarks: Math.round(s.avgMarks * 100) / 100,
      }));

    res.status(200).json(result);
  } catch (err) {
    console.error("getTopPerformers error:", err);
    res.status(500).json({ message: "Failed to compute top performers" });
  }
};

/**
 * GET /api/analytics/student-trend
 * Student-only. Month-wise performance trend from submissions.
 */
const getStudentTrend = async (req, res) => {
  try {
    const studentId = req.user._id;
    if (!studentId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId)
      ? new mongoose.Types.ObjectId(studentId)
      : null;
    if (!studentObjectId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const trend = await Submission.aggregate([
      { $match: { student: studentObjectId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          avgMarks: { $avg: "$marks" },
          totalSubmissions: { $sum: 1 },
          lateCount: { $sum: { $cond: ["$isLate", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          avgMarks: { $ifNull: ["$avgMarks", 0] },
          lateRatio: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              {
                $multiply: [
                  { $divide: ["$lateCount", "$totalSubmissions"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          strengthScore: {
            $let: {
              vars: {
                marks: { $min: [100, { $max: [0, "$avgMarks"] }] },
                late: { $min: [100, { $max: [0, "$lateRatio"] }] },
              },
              in: {
                $min: [
                  100,
                  {
                    $max: [
                      0,
                      {
                        $subtract: [
                          { $multiply: ["$$marks", 0.7] },
                          { $multiply: ["$$late", 0.3] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    const result = trend.map((t) => ({
      year: t.year,
      month: t.month,
      avgMarks: Math.round(Number(t.avgMarks || 0) * 100) / 100,
      lateRatio: Math.round(Number(t.lateRatio || 0) * 100) / 100,
      strengthScore: Math.round(Number(t.strengthScore || 0) * 100) / 100,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("getStudentTrend error:", err);
    res.status(500).json({ message: "Failed to compute student trend" });
  }
};

module.exports = {
  getStudentStrength,
  getSectionAnalytics,
  getInterventions,
  getTopPerformers,
  getStudentTrend,
};
