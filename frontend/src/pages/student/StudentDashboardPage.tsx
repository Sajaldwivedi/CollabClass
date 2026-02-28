import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { motion } from "framer-motion";
import {
  AnalyticsApi,
  type PeerSessionDto,
  type StudentStrengthRow,
  type StudentTrendResponse
} from "../../api/analytics";
import {
  StudyMaterialsApi,
  type StudyMaterial
} from "../../api/studyMaterials";
import { TrendPill } from "../../components/analytics/TrendPill";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [strength, setStrength] = React.useState<StudentStrengthRow[] | null>(
    null
  );
  const [trend, setTrend] = React.useState<StudentTrendResponse | null>(null);
  const [peerSessions, setPeerSessions] = React.useState<PeerSessionDto[]>([]);
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      AnalyticsApi.getStudentStrength(),
      AnalyticsApi.getStudentTrend(),
      AnalyticsApi.getPeerSessions(),
      StudyMaterialsApi.list({ page: 1, limit: 5 })
    ])
      .then(([strengthRes, trendRes, sessionsRes, materialsRes]) => {
        if (!active) return;
        setStrength(strengthRes.data);
        setTrend(trendRes.data);
        setPeerSessions(
          Array.isArray(sessionsRes.data) ? sessionsRes.data : []
        );
        setMaterials(materialsRes.data.materials ?? []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          (err as any)?.response?.data?.message ?? "Failed to load analytics.";
        setError(message);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const overallRiskIndex = React.useMemo(() => {
    if (!strength || strength.length === 0) return 0;
    const avg =
      strength.reduce(
        (acc, row) =>
          acc +
          (row.riskLevel === "HIGH"
            ? 80
            : row.riskLevel === "MEDIUM"
            ? 50
            : 20),
        0
      ) / strength.length;
    return Math.round(avg);
  }, [strength]);

  const engagementAggregates = React.useMemo(() => {
    if (!strength || strength.length === 0) {
      return {
        repliesGiven: 0,
        threadsStarted: 0,
        lateSubmissions: 0,
        score: 0
      };
    }
    const repliesGiven = strength.reduce(
      (acc, row) => acc + (row.repliesGiven || 0),
      0
    );
    const threadsStarted = strength.reduce(
      (acc, row) => acc + (row.doubtsAsked || 0),
      0
    );
    const lateSubmissions = strength.reduce(
      (acc, row) => acc + (row.lateSubmissions || 0),
      0
    );
    const rawScore = repliesGiven * 4 + threadsStarted * 3 - lateSubmissions * 5;
    const score = Math.max(0, Math.min(100, rawScore));
    return { repliesGiven, threadsStarted, lateSubmissions, score };
  }, [strength]);

  const radialData = React.useMemo(
    () => [
      {
        name: "Engagement",
        value: engagementAggregates.score,
        fill: "#22c55e"
      }
    ],
    [engagementAggregates.score]
  );

  const pieBreakdown = React.useMemo(
    () => [
      {
        name: "Replies given",
        value: engagementAggregates.repliesGiven,
        color: "#38bdf8"
      },
      {
        name: "Threads started",
        value: engagementAggregates.threadsStarted,
        color: "#22c55e"
      },
      {
        name: "Late submissions",
        value: engagementAggregates.lateSubmissions,
        color: "#f97316"
      }
    ],
    [engagementAggregates]
  );

  const riskMeterValue = overallRiskIndex;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-3xl p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Personal intelligence
              </p>
              <p className="text-xs text-slate-300">
                Subjects where you&apos;re quietly powerful vs. need support.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
              <CalendarRange className="h-3 w-3" />
              Last 30 days
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)]">
            <div className="space-y-2 text-[11px]">
              {loading || strength === null
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-3"
                    >
                      <div className="h-3 w-28 rounded-full bg-slate-800/80" />
                      <div className="h-2 w-20 rounded-full bg-slate-800/80" />
                    </div>
                  ))
                : strength.length === 0
                ? (
                  <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
                    Once you start submitting assignments, asking doubts, and
                    replying to others, your subject intelligence model will wake
                    up here.
                  </div>
                )
                : strength.map((s) => (
                    <div
                      key={s.subject}
                      className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-50">
                          {s.subject}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Strength score {s.strengthScore.toFixed(0)} / 100
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              s.riskLevel === "HIGH"
                                ? "bg-rose-400"
                                : s.riskLevel === "MEDIUM"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            )}
                          />
                          <span className="text-slate-300">
                            {s.riskLevel === "HIGH"
                              ? "High risk"
                              : s.riskLevel === "MEDIUM"
                              ? "Medium risk"
                              : "Low risk"}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-800/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                            style={{ width: `${s.strengthScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="flex flex-col justify-between rounded-3xl bg-slate-950/80 px-4 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Risk index
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Lower is better. It combines performance, doubts and
                  engagement.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[{ label: "Risk", value: riskMeterValue }]}
                      >
                        <YAxis hide domain={[0, 100]} />
                        <Bar dataKey="value" radius={[999, 999, 0, 0]}>
                          <Cell
                            fill={
                              riskMeterValue >= 70
                                ? "#fb7185"
                                : riskMeterValue >= 40
                                ? "#fbbf24"
                                : "#22c55e"
                            }
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-xs text-slate-400">RiskIndex</p>
                      <p className="text-2xl font-semibold text-slate-50">
                        {riskMeterValue.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="h-28 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="60%"
                        outerRadius="100%"
                        barSize={12}
                        data={radialData}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar
                          background
                          clockWise
                          dataKey="value"
                          minAngle={15}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Engagement {engagementAggregates.score}/100
                  </p>
                </div>
              </div>
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
                Performance trend
              </p>
              <p className="text-xs text-slate-300">
                How CollabClass thinks your curve is moving.
              </p>
            </div>
            {trend && <TrendPill status={trend.trendStatus} />}
          </div>
          <div className="h-40">
            {trend && trend.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend.trendData.map((row) => ({
                    label: `${row.month}/${row.year}`,
                    score: row.strengthScore
                  }))}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderRadius: 12,
                      border: "1px solid rgba(148, 163, 184, 0.5)"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-900/70 text-[11px] text-slate-400">
                Once CollabClass has a few weeks of grades and activity, your
                performance curve will animate here.
              </div>
            )}
          </div>
          {trend && trend.percentageChange !== null && (
            <p className="text-[11px] text-slate-300">
              {trend.trendStatus === "IMPROVING"
                ? "Nice — your curve is trending upwards"
                : trend.trendStatus === "DECLINING"
                ? "CollabClass senses a dip. Doubts and peer sessions can pull this back."
                : "You&apos;re stable. Strategic pushes in weak subjects can create lift."}{" "}
              <span
                className={cn(
                  "ml-1 font-medium",
                  trend.percentageChange !== null &&
                    trend.percentageChange >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                )}
              >
                {trend.percentageChange !== null &&
                trend.percentageChange >= 0
                  ? "+"
                  : ""}
                {trend.percentageChange?.toFixed(1)}%
              </span>{" "}
              compared to last period.
            </p>
          )}
        </motion.div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-3xl p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Engagement breakdown
              </p>
              <p className="text-xs text-slate-300">
                How your doubts and replies shape your score.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
            <div className="flex items-center justify-center">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieBreakdown}
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2 text-[11px]">
              {pieBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-200">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-50">
                    {item.value}
                  </span>
                </div>
              ))}
              <p className="mt-1 text-[10px] text-slate-400">
                Every reply and thread updates your engagement model and adjusts
                your riskIndex in real time.
              </p>
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
                Peer sessions
              </p>
              <p className="text-xs text-slate-300">
                Upcoming and completed mentorship slots.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={() => navigate(ROUTES.studentPeerSessions)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Find mentor
            </Button>
          </div>

          <div className="max-h-60 space-y-3 overflow-y-auto scroll-thin text-[11px]">
            {peerSessions.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/70 px-3 py-4 text-slate-400">
                No sessions yet. As your teacher confirms matches, they&apos;ll
                appear here with a live status.
              </div>
            ) : (
              peerSessions.map((s) => (
                <motion.div
                  key={s._id}
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
                          {s.strongStudent?.name ?? "Mentor"} mentoring{" "}
                          {s.weakStudent?.name ?? "Student"}
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
                      {new Date(s.scheduledDate).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-3xl p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Study materials
              </p>
              <p className="text-xs text-slate-300">
                Fresh resources shared into your section.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-[11px] max-h-60 overflow-y-auto scroll-thin">
            {materials.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
                When your teacher uploads notes, slides, or links for your
                section, they&apos;ll show up here instantly.
              </div>
            ) : (
              materials.map((m) => (
                <div
                  key={m._id}
                  className="flex items-start justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-50">
                      {m.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {m.subject} · {m.section}
                    </p>
                    {m.description && (
                      <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    Open
                  </a>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-surface rounded-3xl border border-rose-500/40 bg-rose-500/5 p-4 text-[11px] text-rose-100"
          >
            {error}
          </motion.div>
        )}
      </section>
    </div>
  );
};

