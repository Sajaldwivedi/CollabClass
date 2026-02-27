import React from "react";
import { motion } from "framer-motion";
import { AnalyticsApi, type PeerSessionDto, type PeerSuggestionRow } from "../../api/analytics";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, CheckCircle2, Clock, Sparkles } from "lucide-react";

export const TeacherPeerSessionsPage: React.FC = () => {
  const [sessions, setSessions] = React.useState<PeerSessionDto[]>([]);
  const [suggestions, setSuggestions] = React.useState<PeerSuggestionRow[]>([]);
  const [subject, setSubject] = React.useState("Algorithms");
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(true);
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadSessions = React.useCallback(() => {
    setLoadingSessions(true);
    AnalyticsApi.getPeerSessions()
      .then((res) => setSessions(res.data))
      .catch((err: unknown) => {
        const message =
          (err as any)?.response?.data?.message ??
          "Failed to load peer sessions.";
        setError(message);
      })
      .finally(() => setLoadingSessions(false));
  }, []);

  const loadSuggestions = React.useCallback(
    (subj: string) => {
      setLoadingSuggestions(true);
      setError(null);
      AnalyticsApi.getPeerSuggestions(subj)
        .then((res) => setSuggestions(res.data))
        .catch((err: unknown) => {
          const message =
            (err as any)?.response?.data?.message ??
            "Failed to compute peer suggestions.";
          setError(message);
        })
        .finally(() => setLoadingSuggestions(false));
    },
    []
  );

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  React.useEffect(() => {
    loadSuggestions(subject);
  }, [loadSuggestions, subject]);

  const handleSchedule = async (s: PeerSuggestionRow) => {
    await AnalyticsApi.createPeerSession({
      weakStudent: s.weakStudent,
      strongStudent: s.strongStudent,
      subject: s.subject,
      scheduledDate: new Date().toISOString(),
      notes: s.reason
    });
    loadSessions();
  };

  const handleStatus = async (id: string, status: "COMPLETED" | "CANCELLED") => {
    await AnalyticsApi.updatePeerSessionStatus(id, status);
    loadSessions();
  };

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Peer mentorship graph
            </p>
            <p className="text-xs text-slate-300">
              Let CollabClass pair strong and weak students for targeted lift.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <CalendarRange className="h-3 w-3" />
            Subject
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-[10px] text-slate-200 outline-none"
            >
              <option>Algorithms</option>
              <option>DBMS</option>
              <option>OS</option>
              <option>Networks</option>
            </select>
          </div>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin text-[11px]">
          {loadingSuggestions ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-3"
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded-full bg-slate-800/80" />
                  <div className="h-2 w-24 rounded-full bg-slate-800/80" />
                </div>
                <div className="h-7 w-16 rounded-full bg-slate-800/80" />
              </div>
            ))
          ) : suggestions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
              No suggestions yet. As analytics senses weak topics and strong
              mentors in {subject}, pairs will appear here.
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <motion.div
                key={`${s.weakStudent}-${s.strongStudent}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5"
              >
                <div>
                  <p className="text-[11px] text-slate-400">
                    Weak: {s.weakStudentName ?? s.weakStudent.slice(0, 8)}… · Strong:{" "}
                    {s.strongStudentName ?? s.strongStudent.slice(0, 8)}…
                  </p>
                  <p className="text-xs font-medium text-slate-50">
                    {s.subject}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {s.reason === "DECLINING_TREND"
                      ? "Declining trend; needs stabilising mentor."
                      : "Low marks; targeted practice recommended."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-[10px]"
                  onClick={() => void handleSchedule(s)}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Schedule
                </Button>
              </motion.div>
            ))
          )}
        </div>
        {error && (
          <p className="mt-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-100">
            {error}
          </p>
        )}
      </section>

      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Live sessions
            </p>
            <p className="text-xs text-slate-300">
              Track scheduled, completed and cancelled mentorship slots.
            </p>
          </div>
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto scroll-thin text-[11px]">
          {loadingSessions ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-2xl bg-slate-900/80 px-3 py-2.5"
              >
                <div className="mt-1 h-6 w-6 rounded-full bg-slate-800/80" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-40 rounded-full bg-slate-800/80" />
                  <div className="h-2 w-24 rounded-full bg-slate-800/80" />
                </div>
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
              No peer sessions yet. Use the suggestions above to seed your
              mentorship graph.
            </div>
          ) : (
            sessions.map((s) => (
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
                  {s.status === "SCHEDULED" && (
                    <div className="mt-2 flex gap-2 text-[10px]">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2"
                        onClick={() => void handleStatus(s._id, "COMPLETED")}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-rose-200"
                        onClick={() => void handleStatus(s._id, "CANCELLED")}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

