import { api } from "./axios";

export type AssignmentStatus = "open" | "closed" | "expired";

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  section: string;
  deadline: string;
  status: AssignmentStatus;
  createdAt: string;
}

export interface AssignmentAnalytics {
  assignmentId: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
  lateSubmissions: number;
  submissionRate: number;
  status: AssignmentStatus;
  highestMarks: number | null;
  lowestMarks: number | null;
  topStudent: {
    _id: string;
    name: string;
    email?: string;
  } | null;
}

export interface Submission {
  _id: string;
  assignment: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  isLate: boolean;
  marks: number | null;
  feedback: string;
  createdAt: string;
}

export interface SubmissionPage {
  submissions: Submission[];
  currentPage: number;
  totalPages: number;
  totalSubmissions: number;
}

export const AssignmentsApi = {
  list: (params?: { status?: AssignmentStatus; sort?: "deadline" | "createdAt" }) =>
    api.get<Assignment[]>("/assignments", { params }),

  create: (payload: {
    title: string;
    description: string;
    subject: string;
    section: string;
    deadline: string;
  }) => api.post<Assignment>("/assignments", payload),

  getById: (id: string) => api.get<Assignment>(`/assignments/${id}`),

  close: (id: string) =>
    api.put<{ message: string }>(`/assignments/${id}/close`),

  analytics: (id: string) =>
    api.get<AssignmentAnalytics>(`/assignments/${id}/analytics`),

  updateDeadline: (id: string, deadline: string) =>
    api.patch<Assignment>(`/assignments/${id}/deadline`, { deadline }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/assignments/${id}`)
};

export const SubmissionsApi = {
  submit: (payload: { assignmentId: string; content: string }) =>
    api.post<Submission>("/submissions", payload),

  listForAssignment: (assignmentId: string, params?: { page?: number; limit?: number }) =>
    api.get<SubmissionPage>(`/submissions/${assignmentId}`, { params }),

  grade: (submissionId: string, payload: { marks: number; feedback?: string }) =>
    api.put<Submission>(`/submissions/${submissionId}`, payload)
};

