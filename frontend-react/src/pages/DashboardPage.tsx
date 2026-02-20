import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { processDocument, getJobStatus } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

interface JobState {
  id: number;
  status: string;
  original_filename: string;
  num_questions?: number;
  error_message?: string;
}

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice (MCQ)" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "mixed", label: "Mixed" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "bengali", label: "Bengali" },
  { value: "auto", label: "Auto-detect" },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState("mcq");
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);
  const [polling, setPolling] = useState(false);

  const { toast } = useToast();

  // Drop zone
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  // Poll job status
  useEffect(() => {
    if (!job || !polling) return;
    if (["completed", "failed"].includes(job.status)) {
      setPolling(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getJobStatus(job.id);
        setJob((prev) => prev ? { ...prev, status: res.status } : null);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [job, polling]);

  async function handleGenerate() {
    if (!file) return toast("Please drop a file first", "error");
    setLoading(true);
    setJob(null);
    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("num_questions", String(numQuestions));
      fd.append("question_type", questionType);
      fd.append("language", language);
      const res = await processDocument(fd);
      toast("Document submitted! Processing started.", "success");
      setJob({ id: res.job_id, status: "pending", original_filename: file.name });
      setPolling(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    pending: "text-yellow-400",
    processing: "text-blue-400",
    completed: "text-green-400",
    failed: "text-red-400",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Create New Quiz</h1>
        <p className="text-white/40 text-sm mt-1">
          Upload a document and we&apos;ll generate quiz questions for you.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "glass border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition",
          isDragActive
            ? "border-purple-400 bg-purple-500/10"
            : "border-white/20 hover:border-purple-400/50 hover:bg-white/[0.03]"
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-2">
            <i className="ri-file-text-line text-4xl text-purple-400" />
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-white/40 text-xs">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setJob(null);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              <i className="ri-close-line" /> Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <i className="ri-upload-cloud-2-line text-5xl text-white/20" />
            <div>
              <p className="text-white/70 font-medium">
                {isDragActive ? "Drop it here…" : "Drag & drop a file"}
              </p>
              <p className="text-white/30 text-sm mt-1">
                or click to browse — PDF, JPG, PNG, TXT up to 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Config */}
      <div className="glass border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Quiz Configuration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Question count */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">Number of Questions</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className={selectCls}
            >
              {QUESTION_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>

          {/* Question type */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className={selectCls}
            >
              {QUESTION_TYPES.map((qt) => (
                <option key={qt.value} value={qt.value}>
                  {qt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs text-white/50">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={selectCls}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-white transition",
          "bg-gradient-to-r from-purple-600 to-blue-600",
          "hover:from-purple-500 hover:to-blue-500 shadow-lg",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <i className="ri-loader-4-line animate-spin" /> Uploading…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <i className="ri-sparkling-2-line" /> Generate Quiz
          </span>
        )}
      </button>

      {/* Processing status */}
      {job && (
        <div className="glass border border-white/10 rounded-2xl p-6 space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Processing Status</h3>
            <span className={cn("text-xs font-medium capitalize", statusColor[job.status] ?? "text-white/50")}>
              <i className={cn(
                job.status === "processing" && "ri-loader-4-line animate-spin",
                job.status === "completed" && "ri-check-line",
                job.status === "failed" && "ri-error-warning-line",
                job.status === "pending" && "ri-time-line"
              )} />{" "}
              {job.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm text-white/60">
                <span className="text-white/40">Document: </span>{job.original_filename}
            </p>
            {job.num_questions !== undefined && (
              <p className="text-sm text-white/60">
                <span className="text-white/40">Questions: </span>{job.num_questions}
              </p>
            )}
          </div>

          {job.status === "completed" && (
            <div className="flex gap-3 pt-2">
              <Link
                to="/my-quizzes"
                className="flex-1 py-2 rounded-lg text-sm font-medium text-center
                  bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
              >
                <i className="ri-book-2-line mr-1.5" />Go to My Quizzes
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectCls =
  "w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 " +
  "text-sm text-white outline-none focus:border-purple-500/50 transition " +
  "appearance-none cursor-pointer";
