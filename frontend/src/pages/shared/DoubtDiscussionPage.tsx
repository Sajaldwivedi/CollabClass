import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { DoubtsApi, DoubtMessage, DoubtThread } from "../../api/doubts";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import {
  Hash,
  MessageCircle,
  Search,
  Filter,
  CheckCircle2,
  BookmarkCheck,
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

export const DoubtDiscussionPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [threads, setThreads] = React.useState<DoubtThread[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null
  );
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [composer, setComposer] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [subjectFilter, setSubjectFilter] = React.useState<string | undefined>(
    undefined
  );
  const [creatingThread, setCreatingThread] = React.useState(false);
  const [newThreadTitle, setNewThreadTitle] = React.useState("");
  const [newThreadSubject, setNewThreadSubject] = React.useState("");
  const [newThreadTags, setNewThreadTags] = React.useState("");
  const [newThreadBody, setNewThreadBody] = React.useState("");
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  React.useEffect(() => {
    let active = true;
    setLoadingThreads(true);
    DoubtsApi.listThreads()
      .then((res) => {
        if (!active) return;
        setThreads(res.data);
        if (res.data[0]) setActiveThreadId(res.data[0].id);
      })
      .finally(() => active && setLoadingThreads(false));
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!socket) return;

    const onThreadCreated = (thread: DoubtThread) => {
      setThreads((prev) => [thread, ...prev]);
    };

    const onThreadUpdated = (thread: DoubtThread) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? thread : t))
      );
    };

    const onTyping = (payload: { threadId: string; userName: string }) => {
      if (!activeThreadId || payload.threadId !== activeThreadId) return;
      setTypingUsers((prev) => {
        if (prev.includes(payload.userName)) return prev;
        return [...prev, payload.userName];
      });
      setTimeout(() => {
        setTypingUsers((prev) =>
          prev.filter((name) => name !== payload.userName)
        );
      }, 2000);
    };

    socket.on("doubt:thread-created", onThreadCreated);
    socket.on("doubt:thread-updated", onThreadUpdated);
    socket.on("doubt:typing", onTyping);

    return () => {
      socket.off("doubt:thread-created", onThreadCreated);
      socket.off("doubt:thread-updated", onThreadUpdated);
      socket.off("doubt:typing", onTyping);
    };
  }, [socket, activeThreadId]);

  const loadThread = React.useCallback((id: string) => {
    setLoadingThread(true);
    DoubtsApi.getThread(id)
      .then((res) => {
        setThreads((prev) => {
          const exists = prev.some((t) => t.id === id);
          return exists
            ? prev.map((t) => (t.id === id ? res.data : t))
            : [res.data, ...prev];
        });
      })
      .finally(() => setLoadingThread(false));
  }, []);

  const handleSend = async () => {
    if (!composer.trim() || !activeThread) return;
    setSending(true);
    const pendingId = `pending-${Date.now()}`;
    const optimistic: DoubtMessage = {
      id: pendingId,
      authorName: user?.name ?? "You",
      authorRole: user?.role ?? "student",
      content: composer,
      createdAt: new Date().toISOString(),
      isResolved: false,
      isPinned: false
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, optimistic] }
          : t
      )
    );
    setComposer("");
    socket?.emit("doubt:typing", {
      threadId: activeThread.id,
      userName: user?.name
    });
    try {
      const res = await DoubtsApi.replyToThread(activeThread.id, {
        content: optimistic.content
      });
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === pendingId ? res.data : m
                )
              }
            : t
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async () => {
    if (
      !newThreadTitle.trim() ||
      !newThreadSubject.trim() ||
      !newThreadBody.trim()
    )
      return;
    setCreatingThread(true);
    const tags =
      newThreadTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) ?? [];
    try {
      const res = await DoubtsApi.createThread({
        title: newThreadTitle,
        subject: newThreadSubject,
        tags,
        content: newThreadBody
      });
      setThreads((prev) => [res.data, ...prev]);
      setActiveThreadId(res.data.id);
      setNewThreadTitle("");
      setNewThreadSubject("");
      setNewThreadTags("");
      setNewThreadBody("");
    } finally {
      setCreatingThread(false);
    }
  };

  const handleResolve = async (thread: DoubtThread) => {
    await DoubtsApi.markResolved(thread.id);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id ? { ...t, isResolved: true } : t
      )
    );
  };

  const handlePin = async (thread: DoubtThread) => {
    await DoubtsApi.pinThread(thread.id);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === thread.id ? { ...t, pinnedByTeacher: true } : t
      )
    );
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );
    const matchesSubject =
      !subjectFilter || t.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const subjectOptions = Array.from(
    new Set(threads.map((t) => t.subject))
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
              placeholder="Search by title or tag"
              className="w-full bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={subjectFilter ?? ""}
              onChange={(e) =>
                setSubjectFilter(e.target.value || undefined)
              }
              className="bg-transparent text-[11px] text-slate-200 outline-none"
            >
              <option value="">All</option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-2xl bg-slate-950/80 px-3 py-3 text-[11px]">
          <p className="flex items-center gap-1 text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Threads update in real time. Watch replies ripple across sessions.
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
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)]">
            <input
              value={newThreadTags}
              onChange={(e) => setNewThreadTags(e.target.value)}
              placeholder="#tags, comma separated"
              className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
            <textarea
              value={newThreadBody}
              onChange={(e) => setNewThreadBody(e.target.value)}
              placeholder="Describe your doubt with examples. Markdown supported."
              className="min-h-[36px] rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
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
                const isActive = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveThreadId(t.id);
                      loadThread(t.id);
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
                        {t.pinnedByTeacher && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                            <BookmarkCheck className="mr-1 h-3 w-3" />
                            Pinned
                          </span>
                        )}
                        {t.isResolved && (
                          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolved
                          </span>
                        )}
                        <span className="truncate">{t.title}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {t.subject} ·{" "}
                        {new Date(t.lastActivityAt).toLocaleString()}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[9px] text-slate-300"
                          >
                            <Hash className="h-3 w-3 text-slate-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-2 text-right text-[10px] text-slate-400">
                      <p>{t.repliesCount} replies</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
                  {activeThread.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {activeThread.subject} · asked by {activeThread.createdBy} ·{" "}
                  {new Date(activeThread.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1">
                {user?.role === "teacher" && (
                  <>
                    {!activeThread.isResolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full px-3 text-[10px]"
                        onClick={() => handleResolve(activeThread)}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark resolved
                      </Button>
                    )}
                    {!activeThread.pinnedByTeacher && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full px-3 text-[10px]"
                        onClick={() => handlePin(activeThread)}
                      >
                        <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" />
                        Pin for section
                      </Button>
                    )}
                  </>
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
              {activeThread.messages.map((m) => {
                const fromCurrentUser = m.authorName === user?.name;
                const highlight = m.isPinned || m.isResolved;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mb-2 flex",
                      fromCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3 py-2 shadow-soft-xl",
                        fromCurrentUser
                          ? "bg-gradient-to-br from-sky-500/80 to-emerald-500/80 text-slate-950"
                          : "bg-slate-900/90 text-slate-50",
                        highlight &&
                          "ring-1 ring-emerald-400/70 ring-offset-2 ring-offset-slate-950"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium">
                          {m.authorName}
                          {m.authorRole === "teacher" && (
                            <span className="ml-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                              Faculty
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        className="prose prose-invert max-w-none text-[11px] leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatContentToHtml(m.content)
                        }}
                      />
                      {m.isResolved && (
                        <p className="mt-1 text-[9px] text-emerald-200">
                          Resolved answer
                        </p>
                      )}
                      {m.isPinned && (
                        <p className="mt-1 text-[9px] text-sky-200">
                          Pinned for this section
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {typingUsers.length > 0 && (
                <p className="mt-1 text-[10px] text-slate-400">
                  {typingUsers.join(", ")} typing...
                </p>
              )}
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
                    socket?.emit("doubt:typing", {
                      threadId: activeThread.id,
                      userName: user?.name
                    });
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

