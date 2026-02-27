import { api } from "./axios";

// Risk rollup per student for teacher section
export interface RiskRollupRow {
  studentId: string;
  studentName: string;
  avgMarks: number;
  totalSubmissions: number;
  lateRatio: number;
  threadsStarted: number;
  repliesGiven: number;
  engagementScore: number;
  overallStrength: number;
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  riskIndex: number;
  needsIntervention: boolean;
}

// Section analytics per subject
export interface SectionAnalyticsRow {
  subject: string;
  avgMarks: number;
  totalSubmissions: number;
  lateRatio: number;
  doubtCount: number;
  weakTopicScore: number;
}

// Intervention recommendation per student
export interface InterventionRow {
  studentId: string;
  studentName: string;
  avgMarks: number;
  lateRatio: number;
  engagementScore: number;
  overallStrength: number;
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  riskIndex: number;
  recommendedAction: "MONITOR" | "ACADEMIC_SUPPORT" | "ENGAGEMENT_SUPPORT";
}

export interface TopPerformerRow {
  studentId: string;
  studentName: string;
  overallStrength: number;
  engagementScore: number;
  avgMarks: number;
  riskIndex: number;
}

export interface PeerSuggestionRow {
  weakStudent: string;
  strongStudent: string;
  weakStudentName: string;
  strongStudentName: string;
  subject: string;
  reason: "DECLINING_TREND" | "LOW_MARKS";
}

export interface PeerSessionDto {
  _id: string;
  weakStudent: {
    _id: string;
    name?: string;
    regNo?: string;
    section?: string;
  };
  strongStudent: {
    _id: string;
    name?: string;
    regNo?: string;
    section?: string;
  };
  subject: string;
  section: string;
  createdBy: {
    _id: string;
    name?: string;
    role?: string;
    section?: string;
  };
  scheduledDate: string;
  status: "SUGGESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

// Student strength rows per subject
export interface StudentStrengthRow {
  subject: string;
  avgMarks: number;
  totalSubmissions: number;
  lateSubmissions: number;
  doubtsAsked: number;
  repliesGiven: number;
  strengthScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface StudentTrendRow {
  year: number;
  month: number;
  avgMarks: number;
  lateRatio: number;
  strengthScore: number;
}

export interface StudentTrendResponse {
  trendData: StudentTrendRow[];
  trendStatus: "IMPROVING" | "DECLINING" | "STABLE" | "INSUFFICIENT_DATA";
  percentageChange: number | null;
}

// Facade types used by TeacherDashboardPage (mapped from API response shapes)
export interface RiskStudent {
  studentId: string;
  name: string;
  id: string;
  avgMarks: number;
  totalSubmissions: number;
  lateRatio: number;
  engagementScore: number;
  overallStrength: number;
  riskBand: "low" | "medium" | "high";
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  riskIndex: number;
  needsIntervention: boolean;
  trendStatus: "IMPROVING" | "DECLINING" | "STABLE";
}

export interface PeerSuggestion {
  id: string;
  weakStudent: string;
  strongStudent: string;
  mentorName: string;
  studentName: string;
  subject: string;
  reason: string;
  predictedLift: number;
}

export interface PeerSession {
  id: string;
  _id: string;
  weakStudent: { _id: string; name?: string; regNo?: string; section?: string };
  strongStudent: { _id: string; name?: string; regNo?: string; section?: string };
  mentorName: string;
  menteeName: string;
  subject: string;
  section: string;
  scheduledFor: string;
  scheduledDate: string;
  status: "SUGGESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

/** Map raw risk rollup rows → RiskStudent facade */
export function mapRiskStudents(rows: RiskRollupRow[]): RiskStudent[] {
  return rows.map((r) => ({
    ...r,
    id: r.studentId,
    name: r.studentName || r.studentId,
    riskBand: r.overallRisk.toLowerCase() as "low" | "medium" | "high",
    trendStatus: r.riskIndex >= 65 ? "DECLINING" : r.riskIndex >= 35 ? "STABLE" : "IMPROVING",
  }));
}

/** Map raw suggestion rows → PeerSuggestion facade */
export function mapPeerSuggestions(rows: PeerSuggestionRow[]): PeerSuggestion[] {
  return rows.map((r, i) => ({
    id: `${r.weakStudent}-${r.strongStudent}-${i}`,
    weakStudent: r.weakStudent,
    strongStudent: r.strongStudent,
    mentorName: r.strongStudentName || r.strongStudent,
    studentName: r.weakStudentName || r.weakStudent,
    subject: r.subject,
    reason: r.reason,
    predictedLift: 0.05 + Math.random() * 0.1,
  }));
}

/** Map raw peer session DTOs → PeerSession facade */
export function mapPeerSessions(rows: PeerSessionDto[]): PeerSession[] {
  return rows.map((r) => ({
    ...r,
    id: r._id,
    mentorName: r.strongStudent?.name ?? r.strongStudent?._id ?? "Mentor",
    menteeName: r.weakStudent?.name ?? r.weakStudent?._id ?? "Mentee",
    scheduledFor: r.scheduledDate,
  }));
}

export const AnalyticsApi = {
  getRiskStudents: () =>
    api.get<RiskRollupRow[]>("/analytics/risk-students"),

  getSectionAnalytics: () =>
    api.get<SectionAnalyticsRow[]>("/analytics/section-analytics"),

  getInterventions: () =>
    api.get<InterventionRow[]>("/analytics/interventions"),

  getTopPerformers: () =>
    api.get<TopPerformerRow[]>("/analytics/top-performers"),

  getPeerSuggestions: (subject: string) =>
    api.get<PeerSuggestionRow[]>(
      `/analytics/peer-suggestions?subject=${encodeURIComponent(subject)}`
    ),

  getPeerSessions: () => api.get<PeerSessionDto[]>("/peer-sessions"),

  createPeerSession: (payload: {
    weakStudent: string;
    strongStudent: string;
    subject: string;
    scheduledDate: string;
    notes?: string;
  }) => api.post<PeerSessionDto>("/peer-sessions", payload),

  updatePeerSessionStatus: (id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") =>
    api.patch<PeerSessionDto>(`/peer-sessions/${id}/status`, { status }),

  getStudentStrength: () =>
    api.get<StudentStrengthRow[]>("/analytics/student-strength"),

  getStudentTrend: () =>
    api.get<StudentTrendResponse>("/analytics/student-trend")
};

