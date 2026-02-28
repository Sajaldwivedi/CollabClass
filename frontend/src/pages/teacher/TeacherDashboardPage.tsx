import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import {
  AnalyticsApi,
  type PeerSession,
  type PeerSuggestion,
  type RiskStudent,
  type TopPerformerRow,
  type SectionAnalyticsRow,
  mapRiskStudents,
  mapPeerSuggestions,
  mapPeerSessions
} from "../../api/analytics";
import { DashboardApi, type TeacherDashboardData } from "../../api/dashboard";
import { StatCard } from "../../components/analytics/StatCard";
import { RiskBadge } from "../../components/analytics/RiskBadge";
import { TrendPill } from "../../components/analytics/TrendPill";
import { ProgressBar } from "../../components/analytics/ProgressBar";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, ChevronRight, Clock, Link2, Sparkles, Trophy, Users, X, Search, ArrowUpDown, AlertTriangle, BookOpen, MessageCircle, Target } from "lucide-react";

export const TeacherDashboardPage: React.FC = () => {
  const [riskStudents, setRiskStudents] = React.useState<RiskStudent[]>([]);
  const [peerSuggestions, setPeerSuggestions] = React.useState<PeerSuggestion[]>([]);
  const [peerSessions, setPeerSessions] = React.useState<PeerSession[]>([]);
  const [topPerformers, setTopPerformers] = React.useState<TopPerformerRow[]>([]);
  const [sectionAnalytics, setSectionAnalytics] = React.useState<SectionAnalyticsRow[]>([]);
  const [dashboardData, setDashboardData] = React.useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [riskFilter, setRiskFilter] = React.useState<"all" | "high" | "medium">(
    "all"
  );
  const [showStudentDirectory, setShowStudentDirectory] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState("");
  const [studentSort, setStudentSort] = React.useState<"name" | "risk" | "marks" | "engagement">("name");
  const [studentSortAsc, setStudentSortAsc] = React.useState(true);
  const [directoryFilter, setDirectoryFilter] = React.useState<"all" | "high" | "medium" | "low">("all");
  const [planStudent, setPlanStudent] = React.useState<RiskStudent | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      AnalyticsApi.getRiskStudents(),
      AnalyticsApi.getSectionAnalytics(),
      AnalyticsApi.getPeerSuggestions("Mathematics"),
      AnalyticsApi.getPeerSessions(),
      AnalyticsApi.getInterventions(),
      AnalyticsApi.getTopPerformers(),
      DashboardApi.getTeacherDashboard().catch(() => ({ data: null }))
    ])
      .then(
        ([
          riskRes,
          sectionRes,
          suggestionRes,
          sessionsRes,
          _interventionsRes,
          topRes,
          dashRes,
        ]) => {
          if (!isMounted) return;
          setRiskStudents(mapRiskStudents(riskRes.data));
          setPeerSuggestions(mapPeerSuggestions(suggestionRes.data));
          setPeerSessions(mapPeerSessions(sessionsRes.data));
          setTopPerformers(topRes.data);
          setSectionAnalytics(sectionRes.data);
          if (dashRes.data) setDashboardData(dashRes.data);
        }
      )
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  const highRisk = riskStudents.filter((s) => s.riskBand === "high");
  const mediumRisk = riskStudents.filter((s) => s.riskBand === "medium");

  const filteredStudents =
    riskFilter === "all"
      ? riskStudents
      : riskStudents.filter((s) => s.riskBand === riskFilter);

  const sparklineData = React.useMemo(
    () =>
      riskStudents.slice(0, 12).map((s, idx) => {
        const name = s.name ?? "Student";
        const safeLabel = typeof name === "string" && name.trim().length > 0
          ? name.split(" ")[0]
          : "Student";
        return {
          label: safeLabel,
          value: s.riskIndex ?? 0,
          idx
        };
      }),
    [riskStudents]
  );

  const weakTopicsData = React.useMemo(() => {
    if (sectionAnalytics.length === 0) return [];
    return sectionAnalytics
      .slice()
      .sort((a, b) => b.weakTopicScore - a.weakTopicScore)
      .slice(0, 6)
      .map((s) => ({
        topic: s.subject,
        weakTopicScore: Math.round(s.weakTopicScore),
      }));
  }, [sectionAnalytics]);

  const heatColors = (score: number) => {
    if (score >= 75) return "#fb7185";
    if (score >= 55) return "#fbbf24";
    return "#22c55e";
  };

  const sortedDirectoryStudents = React.useMemo(() => {
    let list = [...riskStudents];
    if (directoryFilter !== "all") {
      list = list.filter((s) => s.riskBand === directoryFilter);
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (studentSort) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "risk":
          cmp = a.riskIndex - b.riskIndex;
          break;
        case "marks":
          cmp = a.avgMarks - b.avgMarks;
          break;
        case "engagement":
          cmp = a.engagementScore - b.engagementScore;
          break;
      }
      return studentSortAsc ? cmp : -cmp;
    });
    return list;
  }, [riskStudents, directoryFilter, studentSearch, studentSort, studentSortAsc]);

  const toggleSort = (col: typeof studentSort) => {
    if (studentSort === col) {
      setStudentSortAsc(!studentSortAsc);
    } else {
      setStudentSort(col);
      setStudentSortAsc(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Student Plan Modal ─── */}
      {planStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative mx-4 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold",
                  planStudent.riskBand === "high"
                    ? "bg-rose-500/15 text-rose-300"
                    : planStudent.riskBand === "medium"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-emerald-500/15 text-emerald-300"
                )}>
                  {planStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Intervention plan — {planStudent.name}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    ID: {planStudent.studentId.slice(0, 12)}…
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanStudent(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-slate-50">{planStudent.riskIndex.toFixed(0)}</p>
                  <p className="text-[10px] text-slate-400">Risk Index</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-slate-50">{planStudent.avgMarks.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-400">Avg Marks</p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-slate-50">{planStudent.engagementScore.toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-400">Engagement</p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    planStudent.riskBand === "high" ? "text-rose-400" : planStudent.riskBand === "medium" ? "text-amber-400" : "text-emerald-400"
                  )} />
                  <p className="text-xs font-medium text-slate-50">Risk assessment</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {planStudent.riskBand === "high"
                    ? `${planStudent.name} is in the high-risk zone with a risk index of ${planStudent.riskIndex.toFixed(0)}. Immediate intervention is recommended — consider one-on-one sessions, peer mentoring, and closer assignment tracking.`
                    : planStudent.riskBand === "medium"
                    ? `${planStudent.name} shows moderate risk signals (index ${planStudent.riskIndex.toFixed(0)}). Monitor closely over the next 2 weeks and consider pairing with a high-performing peer mentor.`
                    : `${planStudent.name} is performing well with a low risk index of ${planStudent.riskIndex.toFixed(0)}. Continue monitoring and consider them as a peer mentor for at-risk students.`
                  }
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <p className="text-xs font-medium text-slate-50 mb-2">Recommended actions</p>
                <div className="space-y-2">
                  {planStudent.riskBand === "high" && (
                    <>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 px-3 py-2.5">
                        <Target className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-rose-200">Academic support</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Schedule a direct one-on-one session to identify specific knowledge gaps and create a targeted study plan.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 px-3 py-2.5">
                        <Users className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-sky-200">Peer mentoring</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pair with a top-performing student via the Peer Sessions page for regular study support.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                        <MessageCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-amber-200">Engagement boost</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Encourage participation in doubt discussions — replying to threads can significantly improve engagement score.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {planStudent.riskBand === "medium" && (
                    <>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                        <Target className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-amber-200">Monitor & check-in</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Keep a close watch for the next 2 weeks. If risk increases, escalate to academic support.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 px-3 py-2.5">
                        <BookOpen className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-sky-200">Study materials</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Share targeted study resources for weak subjects to help build confidence and close gaps.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {planStudent.riskBand === "low" && (
                    <>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                        <Users className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-emerald-200">Mentor candidate</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">This student could be an excellent peer mentor. Consider pairing them with at-risk students.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 px-3 py-2.5">
                        <Sparkles className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-sky-200">Challenge & grow</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Provide advanced problems or responsibilities to maintain engagement and growth trajectory.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trend + Submissions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-400">Trend</p>
                  <TrendPill status={planStudent.trendStatus} />
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5">
                  <p className="text-[10px] text-slate-400">Submissions</p>
                  <p className="text-sm font-semibold text-slate-50">{planStudent.totalSubmissions}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5">
                <p className="text-[10px] text-slate-400 mb-1">Late ratio</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      planStudent.lateRatio > 0.5 ? "bg-rose-400" : planStudent.lateRatio > 0.25 ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    style={{ width: `${Math.min(planStudent.lateRatio * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{(planStudent.lateRatio * 100).toFixed(0)}% of submissions were late</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-4 text-[11px]"
                onClick={() => setPlanStudent(null)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Student Directory Modal ─── */}
      {showStudentDirectory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Users className="h-4.5 w-4.5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Student directory
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {riskStudents.length} students in your section
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStudentDirectory(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 px-6 py-3">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name or ID…"
                  className="w-full bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                />
              </div>
              <div className="inline-flex gap-1 rounded-2xl bg-slate-900/80 p-1 text-[10px]">
                {(["all", "high", "medium", "low"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDirectoryFilter(f)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 capitalize transition-all",
                      directoryFilter === f
                        ? "bg-slate-800 text-slate-50"
                        : "text-slate-400 hover:text-slate-100"
                    )}
                  >
                    {f === "all" ? "All" : f === "high" ? "High" : f === "medium" ? "Medium" : "Low"}
                  </button>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-6 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {([
                { key: "name" as const, label: "Student" },
                { key: "risk" as const, label: "Risk" },
                { key: "marks" as const, label: "Avg marks" },
                { key: "engagement" as const, label: "Engagement" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="flex items-center gap-1 text-left hover:text-slate-200 transition"
                >
                  {label}
                  <ArrowUpDown className={cn("h-3 w-3", studentSort === key ? "text-emerald-400" : "text-slate-600")} />
                </button>
              ))}
              <span>Status</span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 divide-y divide-slate-800/50 overflow-y-auto scroll-thin px-2">
              {sortedDirectoryStudents.length === 0 ? (
                <div className="px-4 py-12 text-center text-xs text-slate-400">
                  No students match your search.
                </div>
              ) : (
                sortedDirectoryStudents.map((s, idx) => (
                  <motion.div
                    key={s.studentId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 rounded-xl px-4 py-3 text-[11px] text-slate-200 transition hover:bg-slate-900/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        s.riskBand === "high"
                          ? "bg-rose-500/15 text-rose-300"
                          : s.riskBand === "medium"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      )}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-50">{s.name}</p>
                        <p className="text-[10px] text-slate-500">ID: {s.studentId.slice(0, 10)}…</p>
                      </div>
                    </div>
                    <div>
                      <ProgressBar value={s.riskIndex} />
                      <p className="mt-0.5 text-[10px] text-slate-400">{s.riskIndex.toFixed(0)}/100</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-50">{s.avgMarks.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-400">{s.totalSubmissions} submissions</p>
                    </div>
                    <div>
                      <ProgressBar value={s.engagementScore} />
                      <p className="mt-0.5 text-[10px] text-slate-400">{s.engagementScore.toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RiskBadge band={s.riskBand} />
                      {s.needsIntervention && (
                        <Sparkles className="h-3 w-3 text-rose-300" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 text-[10px] text-slate-400">
              <span>
                Showing {sortedDirectoryStudents.length} of {riskStudents.length} students
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-3 text-[10px]"
                onClick={() => setShowStudentDirectory(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="cursor-pointer" onClick={() => setShowStudentDirectory(true)}>
          <StatCard
            label="Total students"
            value={dashboardData?.totalStudents ?? riskStudents.length}
            trend={dashboardData ? `${dashboardData.totalSubmissions} total submissions` : "Click to view all"}
            accent="emerald"
            rightNode={
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <XAxis dataKey="idx" hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.5)"
                    }}
                    labelFormatter={(idx) =>
                      sparklineData[Number(idx)]?.label ?? ""
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            }
          />
        </div>
        <div className="cursor-pointer" onClick={() => { setDirectoryFilter("high"); setShowStudentDirectory(true); }}>
          <StatCard
            label="High risk"
            value={highRisk.length}
            trend="Auto-flagged for intervention"
            accent="rose"
          />
        </div>
        <div className="cursor-pointer" onClick={() => { setDirectoryFilter("medium"); setShowStudentDirectory(true); }}>
          <StatCard
            label="Medium risk"
            value={mediumRisk.length}
            trend="Monitor next 2 weeks"
            accent="amber"
          />
        </div>
        <StatCard
          label="Active peer sessions"
          value={peerSessions.filter((s) => s.status === "SCHEDULED").length}
          trend="Mentorship graph is warming up"
          accent="sky"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-3xl p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Risk radar
              </p>
              <p className="text-sm text-slate-300">
                Students CollabClass believes need your eyes this week.
              </p>
            </div>
            <div className="inline-flex gap-1 rounded-2xl bg-slate-900/80 p-1 text-[10px]">
              {["all", "high", "medium"].map((f) => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f as any)}
                  className={cn(
                    "rounded-xl px-2.5 py-1 capitalize transition-all",
                    riskFilter === f
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:text-slate-100"
                  )}
                >
                  {f === "all" ? "All" : f === "high" ? "High only" : "Medium"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
            <div className="grid grid-cols-[1.8fr_0.9fr_1fr_0.9fr_0.9fr_0.5fr] gap-3 border-b border-slate-800/70 px-4 py-2 text-[11px] text-slate-400">
              <span>Student</span>
              <span>RiskIndex</span>
              <span>Trend</span>
              <span>Engagement</span>
              <span>Needs intervention</span>
              <span />
            </div>
            <div className="max-h-72 divide-y divide-slate-800/60 overflow-y-auto scroll-thin text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.8fr_0.9fr_1fr_0.9fr_0.9fr_0.5fr] gap-3 px-4 py-3"
                  >
                    <div className="h-3 w-32 rounded-full bg-slate-800/80" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-800/80" />
                      <div className="h-1.5 w-10 rounded-full bg-slate-800/80" />
                    </div>
                    <div className="h-4 w-16 rounded-full bg-slate-800/80" />
                    <div className="h-1.5 w-16 rounded-full bg-slate-800/80" />
                    <div className="h-4 w-24 rounded-full bg-slate-800/80" />
                  </div>
                ))
              ) : filteredStudents.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  No students flagged right now. CollabClass will surface
                  signals as soon as it senses risk.
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-[1.8fr_0.9fr_1fr_0.9fr_0.9fr_0.5fr] items-center gap-3 px-4 py-2.5 text-[11px] text-slate-200 hover:bg-slate-900/70"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-50">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ID: {s.studentId.slice(0, 8)}…
                      </span>
                    </div>
                    <div>
                      <ProgressBar value={s.riskIndex} />
                      <p className="mt-1 text-[10px] text-slate-400">
                        {s.riskIndex.toFixed(0)} / 100
                      </p>
                    </div>
                    <TrendPill status={s.trendStatus} />
                    <div>
                      <ProgressBar value={s.engagementScore} />
                      <p className="mt-1 text-[10px] text-slate-400">
                        {s.engagementScore.toFixed(0)} / 100
                      </p>
                    </div>
                    <div>
                      {s.needsIntervention ? (
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-200">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Intervention suggested
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Monitoring
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full px-2 text-[10px]"
                        onClick={() => setPlanStudent(s)}
                      >
                        Plan
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface flex flex-col gap-3 rounded-3xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Weak topic heatmap
              </p>
              <p className="text-xs text-slate-300">
                Where your section collectively feels most brittle.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
              <CalendarRange className="h-3 w-3" />
              This month
            </div>
          </div>

          <div className="mt-1 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weakTopicsData} layout="vertical">
                <XAxis type="number" hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.6)" }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(148, 163, 184, 0.5)"
                  }}
                  formatter={(value) => [`Weakness score ${value}`, ""]}
                />
                <Bar
                  dataKey="weakTopicScore"
                  radius={[999, 999, 999, 999]}
                  barSize={16}
                >
                  {weakTopicsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={heatColors(entry.weakTopicScore)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            {weakTopicsData.length === 0 ? (
              <div className="col-span-2 rounded-2xl bg-slate-900/80 px-3 py-3 text-slate-400">
                Subject analytics will populate once assignments are graded.
              </div>
            ) : (
              weakTopicsData.map((t) => (
                <div
                  key={t.topic}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2"
                >
                  <span>{t.topic}</span>
                  <RiskBadge
                    band={
                      t.weakTopicScore >= 75
                        ? "high"
                        : t.weakTopicScore >= 55
                        ? "medium"
                        : "low"
                    }
                  />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface flex flex-col gap-3 rounded-3xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Peer mentorship
              </p>
              <p className="text-xs text-slate-300">
                AI-suggested mentor–mentee pairings that lift the whole section.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              New session
            </Button>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto scroll-thin text-[11px]">
            {peerSuggestions.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/70 px-3 py-4 text-slate-400">
                CollabClass will suggest mentor–mentee pairs as engagement and
                performance data streams in.
              </div>
            ) : (
              peerSuggestions.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2.5"
                >
                  <div>
                    <p className="text-[11px] text-slate-400">
                      {s.mentorName} ↔ {s.studentName}
                    </p>
                    <p className="text-xs font-medium text-slate-50">
                      {s.subject}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {s.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-300">
                      +{(s.predictedLift * 100).toFixed(1)}% lift
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 rounded-full px-2 text-[10px]"
                    >
                      Schedule
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface flex flex-col gap-3 rounded-3xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Intervention stream
              </p>
              <p className="text-xs text-slate-300">
                A timeline of actions your future self will thank you for.
              </p>
            </div>
          </div>

          <div className="max-h-60 space-y-3 overflow-y-auto scroll-thin text-[11px]">
            {peerSessions.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/70 px-3 py-4 text-slate-400">
                No peer sessions yet. As you accept suggestions, they will
                appear here with live status badges.
              </div>
            ) : (
              peerSessions.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80">
                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                  <div className="flex-1 rounded-2xl bg-slate-900/80 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          {s.mentorName} mentoring {s.menteeName}
                        </p>
                        <p className="text-xs font-medium text-slate-50">
                          {s.subject}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          s.status === "SCHEDULED"
                            ? "bg-sky-500/10 text-sky-200 border border-sky-500/40"
                            : s.status === "COMPLETED"
                            ? "bg-slate-800 text-slate-200 border border-slate-600"
                            : s.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-200 border border-rose-500/40"
                            : "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40"
                        )}
                      >
                        {s.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(s.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* Top performers + Dashboard summary */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface flex flex-col gap-3 rounded-3xl p-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Top performers
            </p>
            <p className="text-xs text-slate-300">
              The students carrying the section forward.
            </p>
          </div>
          <div className="space-y-2 text-[11px]">
            {topPerformers.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/70 px-3 py-4 text-slate-400">
                Performance data will appear once enough submissions are graded.
              </div>
            ) : (
              topPerformers.map((p, idx) => (
                <div
                  key={p.studentId}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-emerald-300">
                      <Trophy className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-50">
                        #{idx + 1} — {p.studentName || p.studentId}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Avg marks: {p.avgMarks.toFixed(1)} · Strength: {p.overallStrength.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-300">
                      Engagement {p.engagementScore.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Risk {p.riskIndex.toFixed(0)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-surface flex flex-col gap-3 rounded-3xl p-4"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Section snapshot
              </p>
              <p className="text-xs text-slate-300">
                Aggregated stats across all assignments.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: "Assignments", value: dashboardData.totalAssignments },
                { label: "Students", value: dashboardData.totalStudents },
                { label: "Submissions", value: dashboardData.totalSubmissions },
                { label: "Graded", value: dashboardData.gradedSubmissions },
                { label: "Pending grading", value: dashboardData.pendingGrading },
                { label: "Late", value: dashboardData.lateSubmissions },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5"
                >
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-semibold text-slate-50">{item.value}</span>
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5">
                <span className="text-slate-300">Average marks</span>
                <span className="font-semibold text-slate-50">
                  {dashboardData.averageMarks.toFixed(1)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
};

