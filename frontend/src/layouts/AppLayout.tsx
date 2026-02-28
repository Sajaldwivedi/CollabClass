import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  MessageCircle,
  Sparkles,
  Users,
  GraduationCap,
  SunMedium,
  MoonStar,
  BookOpen,
  Share2,
  FileText,
  Pencil,
  Check,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Button } from "../components/ui/button";
import { cn } from "../utils/cn";
import { ROUTES } from "../routes/paths";

interface AppLayoutProps {
  role: "student" | "teacher";
}

const navItemsByRole: Record<
  AppLayoutProps["role"],
  { label: string; to: string; icon: React.ComponentType<any> }[]
> = {
  teacher: [
    { label: "Overview", to: ROUTES.teacherDashboard, icon: BarChart3 },
    { label: "Assignments", to: ROUTES.teacherAssignments, icon: FileText },
    { label: "Doubts", to: ROUTES.teacherDoubts, icon: MessageCircle },
    { label: "Study Materials", to: ROUTES.teacherMaterials, icon: BookOpen },
    { label: "Peer Sessions", to: ROUTES.teacherPeerSessions, icon: Share2 }
  ],
  student: [
    {
      label: "My Intelligence",
      to: ROUTES.studentDashboard,
      icon: GraduationCap
    },
    { label: "Assignments", to: ROUTES.studentAssignments, icon: FileText },
    { label: "Doubts", to: ROUTES.studentDoubts, icon: MessageCircle },
    { label: "Study Materials", to: ROUTES.studentMaterials, icon: BookOpen },
    { label: "Peer Sessions", to: ROUTES.studentPeerSessions, icon: Share2 }
  ]
};

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead, markNotificationRead } =
    useSocket();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-semibold"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-80 glass-surface rounded-2xl p-3 z-40"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Live notifications</span>
            {notifications.length > 0 && (
              <button
                className="text-emerald-400 hover:text-emerald-300"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto scroll-thin">
            {notifications.length === 0 ? (
              <div className="rounded-xl bg-slate-900/70 px-3 py-4 text-xs text-slate-400">
                You&apos;re all caught up. We&apos;ll nudge you when something
                needs your attention.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-xs transition-all",
                    n.isRead
                      ? "bg-slate-900/60 text-slate-400"
                      : "bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/60 text-slate-50 border border-emerald-500/40 shadow-soft-xl"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[11px] uppercase tracking-wide text-emerald-300">
                      {n.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ role }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navItems = navItemsByRole[role];
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateSection } = useAuth();
  const [editingSection, setEditingSection] = React.useState(false);
  const [sectionInput, setSectionInput] = React.useState(user?.section ?? "");
  const [savingSection, setSavingSection] = React.useState(false);

  const handleSaveSection = async () => {
    if (!sectionInput.trim()) return;
    setSavingSection(true);
    try {
      await updateSection(sectionInput.trim());
      setEditingSection(false);
    } catch {
      // silently fail
    } finally {
      setSavingSection(false);
    }
  };

  return (
    <div className="page-shell flex h-screen overflow-hidden">
      <aside className="glass-surface relative flex h-screen w-64 shrink-0 flex-col overflow-y-auto scroll-thin px-4 py-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-soft-xl">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
              CollabClass
            </span>
            <p className="text-sm font-semibold text-slate-50">
              Intelligence Hub
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-slate-900/90 text-slate-50 shadow-soft-xl border border-slate-700/70"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/70"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>

        <div className="mt-auto space-y-3 px-2">
          {user && (
            <div className="rounded-2xl bg-slate-900/70 px-3 py-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 text-[11px] font-semibold text-primary-foreground">
                    {user.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium leading-tight">
                      {user.name}
                    </p>
                    {editingSection ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          value={sectionInput}
                          onChange={(e) => setSectionInput(e.target.value)}
                          placeholder="Enter section"
                          className="w-20 rounded-lg border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-50 outline-none focus:border-emerald-500/70"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleSaveSection();
                            if (e.key === "Escape") setEditingSection(false);
                          }}
                        />
                        <button
                          onClick={() => void handleSaveSection()}
                          disabled={savingSection}
                          className="flex h-4 w-4 items-center justify-center rounded-md text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingSection(false)}
                          className="flex h-4 w-4 items-center justify-center rounded-md text-slate-400 hover:text-slate-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                        {user.role} · {user.section ?? "No section"}
                        {user.role === "teacher" && (
                          <button
                            onClick={() => {
                              setSectionInput(user.section ?? "");
                              setEditingSection(true);
                            }}
                            className="ml-0.5 text-slate-500 hover:text-slate-300 transition"
                            title="Change section"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] px-2"
                  onClick={logout}
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleTheme}
              className="flex flex-1 items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800/80"
            >
              <span>Theme</span>
              <span className="flex items-center gap-1.5 text-[11px]">
                {theme === "dark" ? (
                  <>
                    <MoonStar className="h-3.5 w-3.5" />
                    Dark
                  </>
                ) : (
                  <>
                    <SunMedium className="h-3.5 w-3.5" />
                    Light
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scroll-thin px-6 py-5">
        <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                {role === "teacher" ? "Teaching Intelligence" : "Learning Graph"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50">
                {role === "teacher"
                  ? "Section health & interventions"
                  : "Your learning fingerprint"}
              </h1>
            </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() =>
                navigate(
                  role === "teacher"
                    ? ROUTES.teacherPeerSessions
                    : ROUTES.studentPeerSessions
                )
              }
            >
              <Users className="mr-2 h-3.5 w-3.5" />
              {role === "teacher" ? "Mentorship graph" : "My mentors"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

