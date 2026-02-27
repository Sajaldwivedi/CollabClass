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
import { CalendarRange, ChevronRight, Clock, Link2, Sparkles, Trophy } from "lucide-react";

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

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total students"
          value={dashboardData?.totalStudents ?? riskStudents.length}
          trend={dashboardData ? `${dashboardData.totalSubmissions} total submissions` : "+3 added this week"}
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
        <StatCard
          label="High risk"
          value={highRisk.length}
          trend="Auto-flagged for intervention"
          accent="rose"
        />
        <StatCard
          label="Medium risk"
          value={mediumRisk.length}
          trend="Monitor next 2 weeks"
          accent="amber"
        />
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

