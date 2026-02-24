import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  DoubtsApi,
  type DoubtThreadSummary,
  type DoubtReplyNode,
  type DoubtThreadDetail
} from "../../api/doubts";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import {
  Hash,
  MessageCircle,
  Search,
  Filter,
  CheckCircle2,
  SendHorizonal,
  Loader2,
  Sparkles
} from "lucide-react";

const formatContentToHtml = (content: string) => {
  let html = content;
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\n/g, "<br/>");
  return html;
};

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

const ReplyTree: React.FC<{
  nodes: DoubtReplyNode[];
  depth?: number;
}> = ({ nodes, depth = 0 }) => {
  const indent = Math.min(depth * 16, 64);
  return (
    <>
      {nodes.map((node) => (
        <div key={node._id} className={cn("mb-2 flex")}>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full justify-start"
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3 py-2 shadow-soft-xl bg-slate-900/90 text-slate-50",
                depth === 0
                  ? ""
                  : "border border-slate-700/70 bg-slate-900/95"
              )}
              style={{ marginLeft: indent }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium">
                  {node.createdBy?.name ?? "Student"}
                  {node.role === "teacher" && (
                    <span className="ml-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                      Faculty
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-slate-400">
                  {new Date(node.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div
                className="prose prose-invert max-w-none text-[11px] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatContentToHtml(node.content)
                }}
              />
            </div>
          </motion.div>
        </div>
      ))}
    </>
  );
};

export const DoubtDiscussionPage2: React.FC = () => {
  const { user } = useAuth();

  const [threads, setThreads] = React.useState<DoubtThreadSummary[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0
  });
  const [activeThread, setActiveThread] =
    React.useState<DoubtThreadDetail | null>(null);
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [composer, setComposer] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [subjectFilter, setSubjectFilter] = React.useState<string | "">("");
  const [creatingThread, setCreatingThread] = React.useState(false);
  const [newThreadTitle, setNewThreadTitle] = React.useState("");
  const [newThreadSubject, setNewThreadSubject] = React.useState("");
  const [newThreadBody, setNewThreadBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const loadThreads = React.useCallback((page = 1) => {
    setLoadingThreads(true);
    DoubtsApi.listThreads({ page, limit: 10, subject: subjectFilter || undefined })
      .then((res) => {
        setThreads(res.data.threads);
        setPagination({
          page: res.data.page,
          pages: res.data.pages,
          total: res.data.total
        });
        if (!activeThread && res.data.threads[0]) {
          void loadThread(res.data.threads[0]._id);
        }
      })
      .finally(() => setLoadingThreads(false));
  }, [activeThread, subjectFilter]);

  const loadThread = React.useCallback((id: string) => {
    setLoadingThread(true);
    DoubtsApi.getThread(id)
      .then((res) => {
        setActiveThread(res.data);
      })
      .finally(() => setLoadingThread(false));
  }, []);

  React.useEffect(() => {
    loadThreads(1);
  }, [loadThreads]);

  const handleSend = async () => {
    if (!composer.trim() || !activeThread) return;
    setSending(true);
    try {
      await DoubtsApi.replyToThread(activeThread.thread._id, {
        content: composer
      });
      setComposer("");
      void loadThread(activeThread.thread._id);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadBody.trim()) return;
    setCreatingThread(true);
    try {
      const res = await DoubtsApi.createThread({
        title: newThreadTitle,
        content: newThreadBody,
        subject: newThreadSubject || undefined
      });
      setNewThreadTitle("");
      setNewThreadSubject("");
      setNewThreadBody("");
      setThreads((prev) => [res.data, ...prev]);
      void loadThread(res.data._id);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleResolve = async () => {
    if (!activeThread) return;
    await DoubtsApi.markResolved(activeThread.thread._id);
    void loadThread(activeThread.thread._id);
    setThreads((prev) =>
      prev.map((t) =>
        t._id === activeThread.thread._id ? { ...t, status: "resolved" } : t
      )
    );
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const subjectOptions = Array.from(
    new Set(threads.map((t) => t.subject).filter(Boolean))
  ).sort();

  return (
    <div className="grid h-[calc(100vh-96px)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.8fr)]">
      <motion.section
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-surface flex flex-col rounded-3xl p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Doubt channels
            </p>
            <p className="text-xs text-slate-300">
              Threads that behave like Slack, but think like StackOverflow.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px]"
            onClick={handleCreateThread}
            disabled={creatingThread}
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            New thread
          </Button>
        </div>

        <div className="mb-3 flex gap-2 text-[11px]">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or subject"
              className="w-full bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                void loadThreads(1);
              }}
              className="bg-transparent text-[11px] text-slate-200 outline-none"
            >
              <option value="">All</option>
              {subjectOptions.map((s) => (
                <option key={s as string} value={s as string}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-2xl bg-slate-950/80 px-3 py-3 text-[11px]">
          <p className="flex items-center gap-1 text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Threads update as classmates and faculty respond across your
            section.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <textarea
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title — make it specific"
              className="min-h-[36px] rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
            <input
              value={newThreadSubject}
              onChange={(e) => setNewThreadSubject(e.target.value)}
              placeholder="Subject (e.g. Algorithms, DBMS)"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
          <textarea
            value={newThreadBody}
            onChange={(e) => setNewThreadBody(e.target.value)}
            placeholder="Describe your doubt with examples. Markdown supported."
            className="min-h-[60px] rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin rounded-2xl bg-slate-950/80 text-[11px]">
          {loadingThreads ? (
            <div className="space-y-2 px-3 py-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-3"
                >
                  <div className="space-y-1.5">
                    <div className="h-3 w-40 rounded-full bg-slate-800/80" />
                    <div className="h-2 w-24 rounded-full bg-slate-800/80" />
                  </div>
                  <div className="h-5 w-10 rounded-full bg-slate-800/80" />
                </div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center text-xs text-slate-400">
              No threads yet. Start one above – your future self will be glad
              you documented this doubt.
            </div>
          ) : (
            <div className="space-y-1.5 px-2 py-2">
              {filteredThreads.map((t) => {
                const isActive = activeThread?.thread._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => {
                      void loadThread(t._id);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "bg-slate-900 text-slate-50 shadow-soft-xl border border-slate-800"
                        : "bg-transparent text-slate-200 hover:bg-slate-900/80"
                    )}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-xs font-medium">
                        {t.isPinned && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                            <Hash className="mr-1 h-3 w-3" />
                            Pinned
                          </span>
                        )}
                        {t.status === "resolved" && (
                          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolved
                          </span>
                        )}
                        <span className="truncate">{t.title}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {t.subject ?? "General"} ·{" "}
                        {new Date(t.lastActivityAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-2 text-right text-[10px] text-slate-400">
                      <p>{t.replyCount} replies</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={pagination.page <= 1}
                onClick={() => loadThreads(pagination.page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadThreads(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-surface flex flex-col rounded-3xl p-4"
      >
        {activeThread ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-50">
                  {activeThread.thread.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {activeThread.thread.subject ?? "General"} · asked by{" "}
                  {activeThread.thread.createdBy?.name ?? "Student"} ·{" "}
                  {new Date(activeThread.thread.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1">
                {user?.role === "teacher" &&
                  activeThread.thread.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full px-3 text-[10px]"
                      onClick={handleResolve}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Mark resolved
                    </Button>
                  )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin rounded-2xl bg-slate-950/80 px-3 py-3 text-[11px]">
              {loadingThread && (
                <div className="flex items-center gap-2 pb-2 text-[11px] text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing latest replies...
                </div>
              )}
              <ReplyTree nodes={activeThread.replies} />
            </div>

            <div className="mt-3 space-y-2 rounded-2xl bg-slate-950/80 px-3 py-2 text-[11px]">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  Markdown supported. Use <code>**bold**</code>,{" "}
                  <code>`inline code`</code>, and line breaks.
                </span>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={composer}
                  onChange={(e) => {
                    setComposer(e.target.value);
                  }}
                  placeholder="Draft a reply that would help your future classmates..."
                  rows={2}
                  className="min-h-[40px] flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
                />
                <Button
                  size="icon"
                  variant="primary"
                  className="h-9 w-9 rounded-full"
                  onClick={handleSend}
                  disabled={!composer.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400">
            Select or create a thread on the left to start a focused,
            StackOverflow-quality discussion with real-time updates.
          </div>
        )}
      </motion.section>
    </div>
  );
};

