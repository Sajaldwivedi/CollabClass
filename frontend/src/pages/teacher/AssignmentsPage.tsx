import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  AssignmentsApi,
  SubmissionsApi,
  type Assignment,
  type AssignmentAnalytics,
  type Submission
} from "../../api/assignments";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, Clock, FileText, PencilLine, XCircle, Trash2, CalendarClock } from "lucide-react";

export const TeacherAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [selected, setSelected] = React.useState<Assignment | null>(null);
  const [analytics, setAnalytics] = React.useState<AssignmentAnalytics | null>(
    null
  );
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [subPage, setSubPage] = React.useState(1);
  const [subPages, setSubPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [section, setSection] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  /* ── deadline editing state ── */
  const [editingDeadline, setEditingDeadline] = React.useState(false);
  const [newDeadline, setNewDeadline] = React.useState("");
  const [savingDeadline, setSavingDeadline] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  /* ── inline confirm/grade state ── */
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = React.useState<string | null>(null);
  const [gradeInput, setGradeInput] = React.useState("");

  const loadAssignments = React.useCallback(() => {
    setLoading(true);
    setError(null);
    AssignmentsApi.list({ sort: "deadline" })
      .then((res) => {
        setAssignments(res.data);
      })
      .catch((err: unknown) => {
        const message =
          (err as any)?.response?.data?.message ??
          "Failed to load assignments.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [user?.section, user?.role]);

  React.useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const loadDetail = async (assignment: Assignment) => {
    setSelected(assignment);
    setLoadingDetail(true);
    setError(null);
    try {
      const [analyticsRes, submissionsRes] = await Promise.all([
        AssignmentsApi.analytics(assignment._id),
        SubmissionsApi.listForAssignment(assignment._id, {
          page: 1,
          limit: 6
        })
      ]);
      setAnalytics(analyticsRes.data);
      setSubmissions(submissionsRes.data.submissions);
      setSubPage(submissionsRes.data.currentPage);
      setSubPages(submissionsRes.data.totalPages);
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ??
        "Failed to load assignment detail.";
      setError(message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadSubmissionsPage = async (page: number) => {
    if (!selected) return;
    const res = await SubmissionsApi.listForAssignment(selected._id, {
      page,
      limit: 6
    });
    setSubmissions(res.data.submissions);
    setSubPage(res.data.currentPage);
    setSubPages(res.data.totalPages);
  };

  const handleCreate = async () => {
    if (!title.trim() || !subject.trim() || !section.trim() || !deadline.trim() || !description.trim()) {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await AssignmentsApi.create({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        section: section.trim(),
        deadline
      });
      setTitle("");
      setSubject("");
      setSection("");
      setDeadline("");
      setDescription("");
      loadAssignments();
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ??
        "Failed to create assignment.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleGrade = async (submission: Submission, marks: number) => {
    await SubmissionsApi.grade(submission._id, { marks, feedback: submission.feedback });
    await loadDetail(selected!);
  };

  const handleCloseAssignment = async (assignment: Assignment) => {
    try {
      await AssignmentsApi.close(assignment._id);
      loadAssignments();
      if (selected?._id === assignment._id) {
        setSelected(null);
        setAnalytics(null);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to close assignment.";
      setError(message);
    }
  };

  const handleUpdateDeadline = async () => {
    if (!selected || !newDeadline) return;
    setSavingDeadline(true);
    setError(null);
    try {
      const res = await AssignmentsApi.updateDeadline(selected._id, newDeadline);
      setSelected(res.data);
      setEditingDeadline(false);
      loadAssignments();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to update deadline.";
      setError(message);
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    setDeleting(true);
    setError(null);
    try {
      await AssignmentsApi.delete(assignment._id);
      if (selected?._id === assignment._id) {
        setSelected(null);
        setAnalytics(null);
      }
      setConfirmDeleteId(null);
      loadAssignments();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Failed to delete assignment.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const openAssignments = assignments.filter((a) => a.status === "open");
  const closedAssignments = assignments.filter((a) => a.status === "closed");
  const expiredAssignments = assignments.filter((a) => a.status === "expired");

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Assignments
            </p>
            <p className="text-xs text-slate-300">
              Create, track, and grade work across your section.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <CalendarRange className="h-3 w-3" />
            Auto-expires after deadline
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] text-[11px]">
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
            <div className="flex gap-2">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g. Algorithms)"
                className="w-1/3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
              />
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section (e.g. CS-A)"
                className="w-1/3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
              />
              <input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                type="datetime-local"
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none"
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task, rubric, or submission format."
              className="min-h-[52px] w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-col justify-between gap-2">
            <Button
              type="button"
              size="lg"
              className="mt-1 w-full justify-center gap-2 text-xs"
              onClick={handleCreate}
              disabled={creating}
            >
              <FileText className="h-4 w-4" />
              {creating ? "Creating..." : "Create assignment"}
            </Button>
            {error && (
              <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-100">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="glass-surface rounded-3xl p-4">
        <div className="grid gap-3 md:grid-cols-3 text-[11px]">
          {["Open", "Closed", "Expired"].map((label, idx) => {
            const bucket =
              idx === 0 ? openAssignments : idx === 1 ? closedAssignments : expiredAssignments;
            return (
              <div key={label} className="space-y-1">
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
                        <div className="mt-1 h-2 w-20 rounded-full bg-slate-800/80" />
                      </div>
                    ))
                  ) : bucket.length === 0 ? (
                    <div className="rounded-2xl bg-slate-900/80 px-3 py-3 text-slate-500">
                      No {label.toLowerCase()} assignments.
                    </div>
                  ) : (
                    bucket.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => void loadDetail(a)}
                        className={cn(
                          "w-full rounded-2xl px-3 py-2.5 text-left transition-all bg-slate-900/80 hover:bg-slate-800/80",
                          selected?._id === a._id &&
                            "border border-sky-500/60 shadow-soft-xl"
                        )}
                      >
                        <p className="text-xs font-medium text-slate-50">
                          {a.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {a.subject} · due{" "}
                          {new Date(a.deadline).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
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
            <div className="flex items-center gap-2">
              {/* ── Deadline display / edit ── */}
              {editingDeadline ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-50 outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-2.5 text-[10px] text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
                    onClick={() => void handleUpdateDeadline()}
                    disabled={savingDeadline}
                  >
                    {savingDeadline ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-2 text-[10px] text-slate-400"
                    onClick={() => setEditingDeadline(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const d = new Date(selected.deadline);
                    const iso = d.toISOString().slice(0, 16);
                    setNewDeadline(iso);
                    setEditingDeadline(true);
                  }}
                  className="group inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400 transition hover:text-sky-300"
                  title="Click to edit deadline"
                >
                  <CalendarClock className="h-3 w-3" />
                  Due {new Date(selected.deadline).toLocaleString()}
                  <PencilLine className="ml-1 h-2.5 w-2.5 opacity-0 transition group-hover:opacity-100" />
                </button>
              )}

              {/* ── Close button ── */}
              {selected.status === "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-[11px] text-rose-300 border-rose-500/40 hover:bg-rose-500/10"
                  onClick={() => void handleCloseAssignment(selected)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Close
                </Button>
              )}

              {/* ── Delete button ── */}
              {confirmDeleteId === selected._id ? (
                <div className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/5 px-2.5 py-1">
                  <span className="text-[10px] text-rose-200">Delete this assignment?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 rounded-full px-2 text-[10px] text-rose-300 hover:bg-rose-500/10"
                    onClick={() => void handleDeleteAssignment(selected)}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 rounded-full px-2 text-[10px] text-slate-400"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-[11px] text-rose-300 border-rose-500/40 hover:bg-rose-500/10"
                  onClick={() => setConfirmDeleteId(selected._id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          {loadingDetail || !analytics ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              Loading analytics and submissions…
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 md:grid-cols-4 text-[11px]">
                <div className="rounded-2xl bg-slate-900/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Submissions
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {analytics.totalSubmissions}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {analytics.submissionRate}% of section
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Graded
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {analytics.gradedSubmissions}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {analytics.pendingGrading} pending
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Late
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {analytics.lateSubmissions}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Out of {analytics.totalSubmissions} submissions
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Marks band
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Highest:{" "}
                    {analytics.highestMarks != null
                      ? analytics.highestMarks
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-300">
                    Lowest:{" "}
                    {analytics.lowestMarks != null
                      ? analytics.lowestMarks
                      : "—"}
                  </p>
                  {analytics.topStudent && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Top: {analytics.topStudent.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto scroll-thin text-[11px]">
                {submissions.length === 0 ? (
                  <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
                    No submissions yet. As students submit, they&apos;ll appear
                    here ready for grading.
                  </div>
                ) : (
                  submissions.map((s) => (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-slate-900/80 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-50">
                            {s.student.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(s.createdAt).toLocaleString()}{" "}
                            {s.isLate && (
                              <span className="ml-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-200">
                                Late
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {gradingSubmissionId === s._id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={gradeInput}
                                onChange={(e) => setGradeInput(e.target.value)}
                                placeholder="Marks"
                                className="w-16 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[10px] text-slate-50 outline-none focus:border-sky-500/60"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const numeric = Number(gradeInput);
                                    if (!Number.isNaN(numeric)) {
                                      void handleGrade(s, numeric);
                                      setGradingSubmissionId(null);
                                    }
                                  }
                                  if (e.key === "Escape") setGradingSubmissionId(null);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 rounded-full px-2 text-[10px] text-emerald-300"
                                onClick={() => {
                                  const numeric = Number(gradeInput);
                                  if (!Number.isNaN(numeric)) {
                                    void handleGrade(s, numeric);
                                    setGradingSubmissionId(null);
                                  }
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 rounded-full px-2 text-[10px] text-slate-400"
                                onClick={() => setGradingSubmissionId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[10px] text-slate-300">
                                Marks:{" "}
                                {s.marks != null ? s.marks : "Not graded yet"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-full px-2 text-[10px]"
                                onClick={() => {
                                  setGradeInput(s.marks != null ? String(s.marks) : "0");
                                  setGradingSubmissionId(s._id);
                                }}
                              >
                                <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                                Grade
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-300 line-clamp-3">
                        {s.content}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
              {subPages > 1 && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Page {subPage} of {subPages}
                  </span>
                  <div className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      disabled={subPage <= 1}
                      onClick={() => void loadSubmissionsPage(subPage - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      disabled={subPage >= subPages}
                      onClick={() => void loadSubmissionsPage(subPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

