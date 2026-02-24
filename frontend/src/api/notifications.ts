import { api } from "./axios";

export interface NotificationDto {
  _id: string;
  type: "NEW_THREAD" | "NEW_REPLY" | "THREAD_RESOLVED" | "THREAD_CLOSED";
  message: string;
  isRead: boolean;
  createdAt: string;
  thread?: {
    _id: string;
    title: string;
  } | null;
}

export interface PaginatedNotifications {
  total: number;
  page: number;
  pages: number;
  notifications: NotificationDto[];
}

export const NotificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedNotifications>("/notifications", { params }),
  getUnreadCount: () =>
    api.get<{ unreadCount: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    api.patch<{ message: string }>(`/notifications/${id}/read`),
  markAllRead: () =>
    api.patch<{ message: string }>("/notifications/read-all")
};

