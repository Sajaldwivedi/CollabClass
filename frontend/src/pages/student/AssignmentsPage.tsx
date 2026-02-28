import React from "react";
import { motion } from "framer-motion";
import {
  AssignmentsApi,
  SubmissionsApi,
  type Assignment
} from "../../api/assignments";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, Clock, FileText, AlertTriangle } from "lucide-react";

type BucketKey = "pending" | "missed" | "closed";

interface BucketAssignment extends Assignment {
  bucket: BucketKey;
}

export const StudentAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = React.useState<BucketAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<BucketAssignment | null>(null);
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [completedIds, setCompletedIds] = React.useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem("collabclass-completed-assignments");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const persistCompleted = (ids: string[]) => {
    setCompletedIds(ids);
    window.localStorage.setItem("collabclass-completed-assignments", JSON.stringify(ids));
  };

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    AssignmentsApi.list({ sort: "deadline" })
      .then((res) => {
        const now = new Date();
        const withBuckets: BucketAssignment[] = res.data.map((a) => {
          const deadline = new Date(a.deadline);
          let bucket: BucketKey = "pending";
          if (a.status === "closed" || completedIds.includes(a._id)) {
            bucket = "closed";
          } else if (a.status === "expired" || deadline < now) {
            bucket = "missed";
          }
          return { ...a, bucket };
        });
        setAssignments(withBuckets);
      })
      .catch((err: unknown) => {
        const message =
          (err as any)?.response?.data?.message ??
          "Failed to load assignments.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [completedIds]);

  const pending = assignments.filter((a) => a.bucket === "pending");
  const missed = assignments.filter((a) => a.bucket === "missed");
  const closed = assignments.filter((a) => a.bucket === "closed");

  const handleSubmit = async () => {
    if (!selected || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await SubmissionsApi.submit({
        assignmentId: selected._id,
        content: content.trim()
      });
      persistCompleted([...new Set([...completedIds, selected._id])]);
      setContent("");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to submit.";
      if (message === "Already submitted") {
        persistCompleted([...new Set([...completedIds, selected._id])]);
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderBucket = (label: string, items: BucketAssignment[], key: BucketKey) => (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="space-y-1.5">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-900/80 px-3 py-2.5"
            >
              <div className="h-3 w-36 rounded-full bg-slate-800/80" />
              <div className="mt-1 h-2 w-24 rounded-full bg-slate-800/80" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/80 px-3 py-3 text-slate-500">
            No {label.toLowerCase()} assignments.
          </div>
        ) : (
          items.map((a) => (
            <button
              key={a._id}
              onClick={() => setSelected(a)}
              className={cn(
                "w-full rounded-2xl px-3 py-2.5 text-left transition-all bg-slate-900/80 hover:bg-slate-800/80",
                selected?._id === a._id && "border border-sky-500/60 shadow-soft-xl"
              )}
            >
              <p className="text-xs font-medium text-slate-50">{a.title}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {a.subject} · due {new Date(a.deadline).toLocaleString()}
              </p>
              {key === "missed" && (
                <p className="mt-0.5 text-[10px] text-amber-300">
                  Past due · you can still submit (marked late)
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Assignments
            </p>
            <p className="text-xs text-slate-300">
              See what&apos;s pending, what you&apos;ve missed, and what&apos;s
              already closed.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <CalendarRange className="h-3 w-3" />
            Sorted by deadline
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 text-[11px]">
          {renderBucket("Pending", pending, "pending")}
          {renderBucket("Missed", missed, "missed")}
          {renderBucket("Closed / Completed", closed, "closed")}
        </div>
      </section>

      {selected && (
        <section className="glass-surface rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                {selected.title}
              </p>
              <p className="text-xs text-slate-300">
                {selected.subject} · {selected.section}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
              <Clock className="h-3 w-3" />
              Due {new Date(selected.deadline).toLocaleString()}
            </div>
          </div>

          <p className="mb-3 text-[11px] text-slate-300">
            {selected.description}
          </p>

          {(selected.bucket === "pending" || selected.bucket === "missed") && !completedIds.includes(selected._id) ? (
            <div className="space-y-2 rounded-2xl bg-slate-950/80 px-3 py-3 text-[11px]">
              {selected.bucket === "missed" && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                  <span>
                    The deadline has passed. You can still submit, but it will be
                    marked as <strong>late</strong> and visible to your teacher.
                  </span>
                </div>
              )}
              <p className="flex items-center gap-2 text-slate-300">
                <FileText className="h-3.5 w-3.5 text-sky-300" />
                Paste your solution or attach a link to your submission.
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Explain your approach, attach a GitHub link, or paste your code..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
              />
              <Button
                size="lg"
                className={cn(
                  "w-full justify-center gap-2 text-xs",
                  selected.bucket === "missed" && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : selected.bucket === "missed"
                  ? "Submit late"
                  : "Submit assignment"}
              </Button>
              {error && (
                <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-100">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/80 px-3 py-3 text-[11px] text-slate-400">
              This assignment is closed or already submitted.{" "}
              You can still review the prompt and reflect on your approach.
            </div>
          )}
        </section>
      )}
    </div>
  );
};

