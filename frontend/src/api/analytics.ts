import { api } from "./axios";

// Risk rollup per student for teacher section
export interface RiskRollupRow {
  studentId: string;
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
  overallStrength: number;
  engagementScore: number;
  avgMarks: number;
  riskIndex: number;
}

export interface PeerSuggestionRow {
  weakStudent: string;
  strongStudent: string;
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

