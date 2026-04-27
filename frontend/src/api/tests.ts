import { api } from "./axios";

export interface TestPayload {
  title: string;
  subject: string;
  section: string;
  duration: number;
  startTime: string;
  endTime: string;
  totalMarks: number;
  negativeMarking?: number;
  shuffleQuestions?: boolean;
  status?: "draft" | "active" | "completed";
}

export interface AvailableTest extends TestPayload {
  _id: string;
  hasAttempted?: boolean;
  attemptStatus?: string | null;
  attemptScore?: number | null;
  attemptedAt?: string | null;
  suspiciousFlag?: boolean;
}

export interface TestQuestionPayload {
  questionText: string;
  options: string[];
  correctAnswers: number[];
  marks: number;
  type?: "mcq" | "multiple";
}

export const TestsApi = {
  list: () => api.get("/tests"),
  create: (payload: TestPayload) => api.post("/tests", payload),
  addQuestions: (testId: string, questions: TestQuestionPayload[]) => api.post(`/tests/${testId}/questions`, { questions }),
  available: () => api.get<AvailableTest[]>("/tests/available"),
  updateStatus: (testId: string, status: "draft" | "active" | "completed") =>
    api.patch(`/tests/${testId}/status`, { status }),
  start: (testId: string) => api.post(`/tests/${testId}/start`),
  submit: (testId: string, payload: unknown) => api.post(`/tests/${testId}/submit`, payload),
  result: (testId: string) => api.get(`/tests/${testId}/result`),
  attempts: (testId: string) => api.get(`/tests/${testId}/attempts`),
};
