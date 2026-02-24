import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
  NotificationsApi,
  type NotificationDto
} from "../api/notifications";

export interface Notification {
  id: string;
  message: string;
  type: NotificationDto["type"];
  createdAt: string;
  isRead: boolean;
  threadId?: string | null;
}

interface SocketContextValue {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      socket?.disconnect();
      setSocket(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const s = io("/", {
      path: "/socket.io",
      auth: {
        token,
        userId: user.id
      },
      transports: ["websocket"]
    });

    s.on("connect", () => {
      // Initial HTTP seed for notifications + unread count
      void NotificationsApi.list({ page: 1, limit: 10 }).then((res) => {
        const mapped: Notification[] = res.data.notifications.map((n) => ({
          id: n._id,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          isRead: n.isRead,
          threadId: n.thread ? n.thread._id : null
        }));
        setNotifications(mapped);
      });
      void NotificationsApi.getUnreadCount().then((res) => {
        setUnreadCount(res.data.unreadCount);
      });
    });

    s.on("new_notification", (payload: NotificationDto) => {
      const mapped: Notification = {
        id: payload._id,
        message: payload.message,
        type: payload.type,
        createdAt: payload.createdAt,
        isRead: payload.isRead,
        threadId: (payload as any).thread?._id ?? null
      };
      setNotifications((prev) => [mapped, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user]);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void NotificationsApi.markRead(id);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    void NotificationsApi.markAllRead();
  };

  const computedUnread = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const value: SocketContextValue = {
    socket,
    notifications,
    unreadCount: Math.max(unreadCount, computedUnread),
    markNotificationRead,
    markAllRead
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return ctx;
};

