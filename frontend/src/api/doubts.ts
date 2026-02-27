import { api } from "./axios";

export interface DoubtThreadSummary {
  _id: string;
  title: string;
  subject: string | null;
  section: string;
  status: "open" | "resolved" | "closed";
  replyCount: number;
  lastActivityAt: string;
  isPinned: boolean;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    role: "student" | "teacher";
  };
}

export interface DoubtThreadsResponse {
  total: number;
  page: number;
  pages: number;
  threads: DoubtThreadSummary[];
}

export interface DoubtReplyNode {
  _id: string;
  content: string;
  createdAt: string;
  role: "student" | "teacher";
  createdBy: {
    _id: string;
    name: string;
    role: "student" | "teacher";
  };
  children: DoubtReplyNode[];
}

export interface DoubtThreadDetail {
  thread: DoubtThreadSummary;
  replies: DoubtReplyNode[];
}

export const DoubtsApi = {
  listThreads: (query?: {
    page?: number;
    limit?: number;
    status?: string;
    assignment?: string;
    subject?: string;
  }) => api.get<DoubtThreadsResponse>("/doubts", { params: query }),

  createThread: (payload: {
    title: string;
    content: string;
    subject?: string;
    assignment?: string;
  }) => api.post<DoubtThreadSummary>("/doubts", payload),

  getThread: (id: string) =>
    api.get<DoubtThreadDetail>(`/doubts/${id}`),

  replyToThread: (id: string, payload: { content: string; parentReply?: string }) =>
    api.post(`/doubts/${id}/reply`, payload),

  markResolved: (id: string) => api.patch(`/doubts/${id}/resolve`),

  closeThread: (id: string) => api.patch(`/doubts/${id}/close`),

  deleteThread: (id: string) => api.delete(`/doubts/${id}`)
};

