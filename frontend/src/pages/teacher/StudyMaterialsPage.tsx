import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  StudyMaterialsApi,
  type StudyMaterial
} from "../../api/studyMaterials";
import { Button } from "../../components/ui/button";
import { cn } from "../../utils/cn";
import { CalendarRange, Trash2, UploadCloud, FileUp, Link } from "lucide-react";

export const TeacherStudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [subjectFilter, setSubjectFilter] = React.useState<string>("");

  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [section, setSection] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadMode, setUploadMode] = React.useState<"link" | "file">("link");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(
    (pageNum: number) => {
      setLoading(true);
      setError(null);
      StudyMaterialsApi.list({
        page: pageNum,
        limit: 6,
        section: section || undefined,
        subject: subjectFilter || undefined
      })
        .then((res) => {
          setMaterials(res.data.materials);
          setPage(res.data.currentPage);
          setPages(res.data.totalPages);
        })
        .catch((err: unknown) => {
          const message =
            (err as any)?.response?.data?.message ??
            "Failed to load study materials.";
          setError(message);
        })
        .finally(() => setLoading(false));
    },
    [subjectFilter, section]
  );

  React.useEffect(() => {
    load(1);
  }, [load]);

  const handleUpload = async () => {
    if (!title.trim() || !subject.trim() || !section.trim()) return;
    if (uploadMode === "link" && !fileUrl.trim()) return;
    if (uploadMode === "file" && !selectedFile) return;

    setUploading(true);
    setError(null);
    try {
      if (uploadMode === "file" && selectedFile) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("subject", subject.trim());
        fd.append("section", section.trim());
        if (description.trim()) fd.append("description", description.trim());
        fd.append("file", selectedFile);
        await StudyMaterialsApi.uploadFile(fd);
      } else {
        await StudyMaterialsApi.upload({
          title: title.trim(),
          subject: subject.trim(),
          section: section.trim(),
          fileUrl: fileUrl.trim(),
          description: description.trim() || undefined
        });
      }
      setTitle("");
      setSubject("");
      setSection("");
      setFileUrl("");
      setDescription("");
      setSelectedFile(null);
      load(1);
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ??
        "Failed to upload study material.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await StudyMaterialsApi.remove(id);
    load(page);
  };

  const subjects = Array.from(
    new Set(materials.map((m) => m.subject).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Study materials
            </p>
            <p className="text-xs text-slate-300">
              Curate slides, notes, and links for your section.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <CalendarRange className="h-3 w-3" />
            {user?.section ?? "Global"}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] text-[11px]">
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. DP Masterclass slides)"
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
              {/* Mode toggle */}
              <div className="flex rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setUploadMode("link"); setSelectedFile(null); }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-2 text-[10px] transition",
                    uploadMode === "link"
                      ? "bg-sky-500/10 text-sky-300"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Link className="h-3 w-3" /> Link
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMode("file"); setFileUrl(""); }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-2 text-[10px] transition",
                    uploadMode === "file"
                      ? "bg-sky-500/10 text-sky-300"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <FileUp className="h-3 w-3" /> File
                </button>
              </div>
            </div>
            {uploadMode === "link" ? (
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Public link (Drive, PDF, etc.)"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-400 transition hover:border-sky-500/40 hover:text-sky-300"
              >
                <FileUp className="h-4 w-4" />
                {selectedFile ? selectedFile.name : "Click to select a file from your device (max 25 MB)"}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or reading instructions"
              className="min-h-[52px] w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-900/80 px-3 py-2">
                <span className="text-[10px] text-slate-400">
                  Filter by subject
                </span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-slate-200 outline-none"
                >
                  <option value="">All</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              className="mt-1 w-full justify-center gap-2 text-xs"
              onClick={handleUpload}
              disabled={uploading}
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload material"}
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
        <div className="space-y-2 text-[11px] max-h-[360px] overflow-y-auto scroll-thin">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-3 py-3"
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded-full bg-slate-800/80" />
                  <div className="h-2 w-24 rounded-full bg-slate-800/80" />
                </div>
                <div className="h-6 w-16 rounded-full bg-slate-800/80" />
              </div>
            ))
          ) : materials.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/80 px-3 py-4 text-slate-400">
              No materials yet. When you upload slides, notes or references for
              this section, they&apos;ll appear here.
            </div>
          ) : (
            materials.map((m) => (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between rounded-2xl bg-slate-900/80 px-3 py-2.5"
              >
                <div>
                  <p className="text-xs font-medium text-slate-50">{m.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {m.subject} · {m.section} · by {m.uploadedBy?.name ?? "You"}
                  </p>
                  {m.description && (
                    <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    Open material
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => handleDelete(m._id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </motion.div>
            ))
          )}
        </div>
        {pages > 1 && (
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              Page {page} of {pages}
            </span>
            <div className="space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={page >= pages}
                onClick={() => load(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

