import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  XCircle,
  Trash2,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  Reply,
  User,
  BookOpen,
  CornerDownRight,
} from "lucide-react";

/* ─────────────── helpers ─────────────── */

const formatContentToHtml = (content: string) => {
  let html = content;
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`(.+?)`/g, '<code class="rounded bg-slate-800 px-1 py-0.5 text-sky-300">$1</code>');
  html = html.replace(/\n/g, "<br/>");
  return html;
};

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
  resolved: { label: "Resolved", color: "text-sky-300", bg: "bg-sky-500/10 border-sky-500/20" },
  closed: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

/* ─────────────── Avatar ─────────────── */

const Avatar: React.FC<{ name: string; role: "student" | "teacher"; size?: "sm" | "md" }> = ({
  name,
  role,
  size = "sm",
}) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dim = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]";
  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-full flex items-center justify-center font-semibold",
        dim,
        role === "teacher"
          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
          : "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20"
      )}
    >
      {initials}
    </div>
  );
};

/* ─────────────── Interface ─────────────── */

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

/* ─────────────── ReplyTree ─────────────── */

const ReplyNode: React.FC<{ node: DoubtReplyNode; depth: number }> = ({ node, depth }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-3 top-0 -bottom-0 w-px bg-slate-700/50" style={{ left: `${depth * 20 + 3}px` }} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
        style={{ paddingLeft: depth * 20 }}
      >
        {depth > 0 && (
          <CornerDownRight
            className="absolute text-slate-600"
            style={{ left: `${(depth - 1) * 20 + 5}px`, top: 12 }}
            size={12}
          />
        )}

        <div
          className={cn(
            "group rounded-xl p-3 transition-colors",
            depth === 0
              ? "bg-slate-900/60 hover:bg-slate-900/80"
              : "bg-slate-900/40 hover:bg-slate-900/60 border-l-2",
            depth > 0 && node.role === "teacher"
              ? "border-l-emerald-500/40"
              : depth > 0
              ? "border-l-slate-700/60"
              : ""
          )}
        >
          <div className="flex items-start gap-2.5">
            <Avatar name={node.createdBy?.name ?? "User"} role={node.role} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-slate-200">
                  {node.createdBy?.name ?? "Student"}
                </span>
                {node.role === "teacher" && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/20">
                    Faculty
                  </span>
                )}
                <span className="text-[9px] text-slate-500">
                  {timeAgo(node.createdAt)}
                </span>
                {hasChildren && (
                  <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
                  >
                    {collapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                    {node.children.length} {node.children.length === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
              <div
                className="prose prose-invert max-w-none text-[11px] leading-relaxed text-slate-300"
                dangerouslySetInnerHTML={{
                  __html: formatContentToHtml(node.content),
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {hasChildren && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {node.children.map((child) => (
                <ReplyNode key={child._id} node={child} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReplyTree: React.FC<{ nodes: DoubtReplyNode[] }> = ({ nodes }) => (
  <div className="space-y-1.5">
    {nodes.map((node) => (
      <ReplyNode key={node._id} node={node} depth={0} />
    ))}
  </div>
);

/* ─────────────── Thread Card ─────────────── */

const ThreadCard: React.FC<{
  thread: DoubtThreadSummary;
  isActive: boolean;
  onClick: () => void;
}> = ({ thread, isActive, onClick }) => {
  const status = statusConfig[thread.status] ?? statusConfig.open;

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "w-full rounded-xl p-3 text-left transition-all duration-200",
        isActive
          ? "bg-sky-500/10 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/5"
          : "bg-slate-900/40 hover:bg-slate-900/70 ring-1 ring-transparent hover:ring-slate-700/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <Avatar name={thread.createdBy?.name ?? "User"} role={thread.createdBy?.role ?? "student"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/20">
                  <Hash size={8} />
                  Pinned
                </span>
              )}
              <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider", status.bg, status.color)}>
                {status.label}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-100 truncate leading-snug">
              {thread.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-500">
              <span>{thread.createdBy?.name ?? "Student"}</span>
              <span>·</span>
              <span>{thread.subject ?? "General"}</span>
              <span>·</span>
              <span>{timeAgo(thread.lastActivityAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-slate-800/60 px-2 py-1 text-[9px] text-slate-400">
          <MessageCircle size={10} />
          {thread.replyCount}
        </div>
      </div>
    </motion.button>
  );
};

/* ─────────────── Main Component ─────────────── */

export const DoubtDiscussionPage2: React.FC = () => {
  const { user } = useAuth();

  const [threads, setThreads] = React.useState<DoubtThreadSummary[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [activeThread, setActiveThread] = React.useState<DoubtThreadDetail | null>(null);
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [composer, setComposer] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [subjectFilter, setSubjectFilter] = React.useState<string | "">("");
  const [showNewThread, setShowNewThread] = React.useState(false);
  const [newThreadTitle, setNewThreadTitle] = React.useState("");
  const [newThreadSubject, setNewThreadSubject] = React.useState("");
  const [newThreadBody, setNewThreadBody] = React.useState("");
  const [creatingThread, setCreatingThread] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const repliesEndRef = React.useRef<HTMLDivElement>(null);

  const loadThreads = React.useCallback(
    (page = 1) => {
      setLoadingThreads(true);
      DoubtsApi.listThreads({ page, limit: 10, subject: subjectFilter || undefined })
        .then((res) => {
          setThreads(res.data.threads);
          setPagination({
            page: res.data.page,
            pages: res.data.pages,
            total: res.data.total,
          });
          if (!activeThread && res.data.threads[0]) {
            void loadThread(res.data.threads[0]._id);
          }
        })
        .finally(() => setLoadingThreads(false));
    },
    [activeThread, subjectFilter]
  );

  const loadThread = React.useCallback((id: string) => {
    setLoadingThread(true);
    DoubtsApi.getThread(id)
      .then((res) => {
        setActiveThread(res.data);
        setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
      await DoubtsApi.replyToThread(activeThread.thread._id, { content: composer });
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
        subject: newThreadSubject || undefined,
      });
      setNewThreadTitle("");
      setNewThreadSubject("");
      setNewThreadBody("");
      setShowNewThread(false);
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

  const handleClose = async () => {
    if (!activeThread) return;
    await DoubtsApi.closeThread(activeThread.thread._id);
    void loadThread(activeThread.thread._id);
    setThreads((prev) =>
      prev.map((t) =>
        t._id === activeThread.thread._id ? { ...t, status: "closed" } : t
      )
    );
  };

  const handleDelete = async () => {
    if (!activeThread) return;
    await DoubtsApi.deleteThread(activeThread.thread._id);
    setThreads((prev) => prev.filter((t) => t._id !== activeThread.thread._id));
    setActiveThread(null);
    setConfirmingDelete(false);
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

  const activeStatus = activeThread
    ? statusConfig[activeThread.thread.status] ?? statusConfig.open
    : null;

  return (
    <div className="grid h-[calc(100vh-96px)] gap-3 lg:grid-cols-[340px_1fr]">
      {/* ─── LEFT PANEL: Thread List ─── */}
      <motion.section
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 ring-1 ring-slate-800/60 backdrop-blur-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20">
              <BookOpen size={14} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-100">Doubt Threads</p>
              <p className="text-[9px] text-slate-500">{pagination.total} discussions</p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 rounded-lg bg-sky-500/15 px-2.5 text-[10px] text-sky-300 hover:bg-sky-500/25 ring-1 ring-sky-500/20"
            onClick={() => setShowNewThread(!showNewThread)}
          >
            <Plus size={12} className="mr-1" />
            New
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 border-b border-slate-800/30 px-3 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-800/40 px-2.5 py-1.5 ring-1 ring-slate-700/30">
            <Search size={12} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads..."
              className="w-full bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-800/40 px-2 py-1.5 ring-1 ring-slate-700/30">
            <Filter size={10} className="text-slate-500" />
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                void loadThreads(1);
              }}
              className="bg-transparent text-[10px] text-slate-300 outline-none"
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

        {/* New Thread Composer */}
        <AnimatePresence>
          {showNewThread && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-slate-800/30"
            >
              <div className="space-y-2 px-3 py-3">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300">
                  <Sparkles size={11} />
                  <span className="font-medium">Start a new discussion</span>
                </div>
                <input
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Thread title — make it specific"
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-[10px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition"
                />
                <input
                  value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  placeholder="Subject (e.g. Algorithms, DBMS)"
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-[10px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition"
                />
                <textarea
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Describe your doubt with examples. Markdown supported."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-[10px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 flex-1 rounded-lg bg-sky-500/20 text-[10px] text-sky-200 hover:bg-sky-500/30"
                    onClick={() => void handleCreateThread()}
                    disabled={creatingThread || !newThreadTitle.trim() || !newThreadBody.trim()}
                  >
                    {creatingThread ? (
                      <Loader2 size={11} className="mr-1 animate-spin" />
                    ) : (
                      <SendHorizonal size={11} className="mr-1" />
                    )}
                    {creatingThread ? "Creating…" : "Post thread"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-lg text-[10px] text-slate-500 hover:text-slate-300"
                    onClick={() => setShowNewThread(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto scroll-thin">
          {loadingThreads ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-slate-900/50 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-slate-800/60" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 rounded-full bg-slate-800/60" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-800/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/50 ring-1 ring-slate-700/50">
                <MessageCircle size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">No threads yet</p>
                <p className="mt-0.5 text-[9px] text-slate-600">
                  Start one — your future self will thank you.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredThreads.map((t) => (
                <ThreadCard
                  key={t._id}
                  thread={t}
                  isActive={activeThread?.thread._id === t._id}
                  onClick={() => void loadThread(t._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/30 px-3 py-2">
            <span className="text-[9px] text-slate-500">
              Page {pagination.page} / {pagination.pages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 rounded-md px-2 text-[9px]"
                disabled={pagination.page <= 1}
                onClick={() => loadThreads(pagination.page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 rounded-md px-2 text-[9px]"
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadThreads(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.section>

      {/* ─── RIGHT PANEL: Thread Detail ─── */}
      <motion.section
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/90 ring-1 ring-slate-800/60 backdrop-blur-xl overflow-hidden"
      >
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="border-b border-slate-800/50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {activeStatus && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                          activeStatus.bg,
                          activeStatus.color
                        )}
                      >
                        {activeThread.thread.status === "resolved" && (
                          <CheckCircle2 size={8} className="mr-0.5" />
                        )}
                        {activeStatus.label}
                      </span>
                    )}
                    {activeThread.thread.subject && (
                      <span className="rounded-md bg-slate-800/60 px-1.5 py-0.5 text-[8px] font-medium text-slate-400 ring-1 ring-slate-700/40">
                        {activeThread.thread.subject}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-slate-50 leading-snug">
                    {activeThread.thread.title}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={9} />
                      {activeThread.thread.createdBy?.name ?? "Student"}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(activeThread.thread.createdAt).toLocaleString()}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Reply size={9} />
                      {activeThread.replies.length} replies
                    </span>
                  </div>
                </div>

                {user?.role === "teacher" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {activeThread.thread.status !== "resolved" &&
                      activeThread.thread.status !== "closed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg px-2 text-[9px] text-emerald-400 hover:bg-emerald-500/10"
                          onClick={handleResolve}
                        >
                          <CheckCircle2 size={11} className="mr-1" />
                          Resolve
                        </Button>
                      )}
                    {activeThread.thread.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-lg px-2 text-[9px] text-amber-400 hover:bg-amber-500/10"
                        onClick={handleClose}
                      >
                        <XCircle size={11} className="mr-1" />
                        Close
                      </Button>
                    )}
                    {confirmingDelete ? (
                      <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-2.5 py-1">
                        <span className="text-[9px] text-rose-200">Delete thread?</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 rounded-lg px-2 text-[9px] text-rose-300 hover:bg-rose-500/10"
                          onClick={handleDelete}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 rounded-lg px-2 text-[9px] text-slate-400"
                          onClick={() => setConfirmingDelete(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-lg px-2 text-[9px] text-rose-400 hover:bg-rose-500/10"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        <Trash2 size={11} className="mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Replies Area */}
            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3">
              {loadingThread && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-sky-500/5 px-3 py-2 text-[10px] text-sky-300 ring-1 ring-sky-500/10">
                  <Loader2 size={12} className="animate-spin" />
                  Syncing latest replies…
                </div>
              )}
              {activeThread.replies.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 ring-1 ring-slate-700/40">
                    <MessageCircle size={18} className="text-slate-600" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    No replies yet. Be the first to help!
                  </p>
                </div>
              ) : (
                <ReplyTree nodes={activeThread.replies} />
              )}
              <div ref={repliesEndRef} />
            </div>

            {/* Composer */}
            {activeThread.thread.status !== "closed" && (
              <div className="border-t border-slate-800/50 px-4 py-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <p className="mb-1.5 text-[9px] text-slate-600">
                      Supports <code className="rounded bg-slate-800 px-1 text-sky-400">**bold**</code>{" "}
                      <code className="rounded bg-slate-800 px-1 text-sky-400">`code`</code> and line
                      breaks
                    </p>
                    <textarea
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Write a helpful reply… (Ctrl+Enter to send)"
                      rows={2}
                      className="w-full rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 transition resize-none"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 ring-1 ring-sky-500/20"
                    onClick={() => void handleSend()}
                    disabled={!composer.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <SendHorizonal size={14} />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/40 ring-1 ring-slate-700/40">
              <BookOpen size={28} className="text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">Select a thread</p>
              <p className="mt-1 max-w-[240px] text-[10px] text-slate-600 leading-relaxed">
                Pick a thread from the left panel to view its discussion, or create a new one
                to start a focused, StackOverflow-quality conversation.
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-sky-500/15 px-3 text-[10px] text-sky-300 hover:bg-sky-500/25 ring-1 ring-sky-500/20"
              onClick={() => setShowNewThread(true)}
            >
              <Plus size={12} className="mr-1" />
              Create a thread
            </Button>
          </div>
        )}
      </motion.section>
    </div>
  );
};

