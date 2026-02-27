import React from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles, Users } from "lucide-react";
import { AnalyticsApi, type PeerSessionDto } from "../../api/analytics";
import { cn } from "../../utils/cn";

export const StudentPeerSessionsPage: React.FC = () => {
  const [sessions, setSessions] = React.useState<PeerSessionDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    AnalyticsApi.getPeerSessions()
      .then((res) => {
        setSessions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        // Student may not have access — gracefully show empty
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const scheduled = sessions.filter((s) => s.status === "SCHEDULED");
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const cancelled = sessions.filter((s) => s.status === "CANCELLED");

  const renderSession = (s: PeerSessionDto) => (
    <motion.div
      key={s._id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
    >
      <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80">
        <Users className="h-3.5 w-3.5 text-slate-300" />
      </div>
      <div className="flex-1 rounded-2xl bg-slate-900/80 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">
              {s.strongStudent?.name ?? s.strongStudent?._id ?? "Mentor"} ↔{" "}
              {s.weakStudent?.name ?? s.weakStudent?._id ?? "Mentee"}
            </p>
            <p className="text-xs font-medium text-slate-50">{s.subject}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
              s.status === "SCHEDULED"
                ? "bg-sky-500/10 text-sky-200 border border-sky-500/40"
                : s.status === "COMPLETED"
                ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40"
                : "bg-rose-500/10 text-rose-200 border border-rose-500/40"
            )}
          >
            {s.status.toLowerCase()}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          {new Date(s.scheduledDate).toLocaleString()}
        </p>
        {s.notes && (
          <p className="mt-1 text-[10px] text-slate-300">{s.notes}</p>
        )}
      </div>
    </motion.div>
  );

  const hasSessions = sessions.length > 0;

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Peer sessions
            </p>
            <p className="text-xs text-slate-300">
              Your teacher can schedule 1:1 or small-group mentorship sessions.
              Sessions you're part of appear below.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <Sparkles className="h-3 w-3" />
            {hasSessions ? `${sessions.length} session(s)` : "Coming from your faculty"}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-900/80 px-3 py-3"
              >
                <div className="h-3 w-40 rounded-full bg-slate-800/80" />
                <div className="mt-1 h-2 w-24 rounded-full bg-slate-800/80" />
              </div>
            ))}
          </div>
        ) : !hasSessions ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-10 text-center text-xs text-slate-400">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900"
            >
              <Clock className="h-5 w-5 text-slate-300" />
            </motion.div>
            <p className="max-w-sm">
              When your teacher spins up peer mentorship for this course,
              you&apos;ll see upcoming and completed sessions here with live
              status and notes. For now, focus on doubts and submissions – they
              feed directly into the mentorship suggestions engine.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduled.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Upcoming
                </p>
                <div className="space-y-2 text-[11px]">{scheduled.map(renderSession)}</div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Completed
                </p>
                <div className="space-y-2 text-[11px]">{completed.map(renderSession)}</div>
              </div>
            )}
            {cancelled.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Cancelled
                </p>
                <div className="space-y-2 text-[11px]">{cancelled.map(renderSession)}</div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

