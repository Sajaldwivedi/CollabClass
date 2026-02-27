import { api } from "./axios";

export interface TeacherDashboardData {
  totalAssignments: number;
  totalStudents: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
  lateSubmissions: number;
  averageMarks: number;
}

export const DashboardApi = {
  getTeacherDashboard: () =>
    api.get<TeacherDashboardData>("/dashboard/teacher"),
};
