"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Copy, Check, Terminal, Globe, HelpCircle } from "lucide-react";

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ShareFormModal({ isOpen, onClose, projectId }: ShareFormModalProps) {
  const [origin, setOrigin] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "task-api" | "upload-api">("form");
  const [copiedForm, setCopiedForm] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [copiedUpload, setCopiedUpload] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicFormUrl = `${origin}/public/projects/${projectId}/tasks/new`;
  const publicApiUrl = `${origin}/api/public/projects/${projectId}/tasks`;
  const publicUploadUrl = `${origin}/api/public/attachments/upload`;

  const copyToClipboard = async (text: string, type: "form" | "api" | "upload") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "form") {
        setCopiedForm(true);
        setTimeout(() => setCopiedForm(false), 2000);
      } else if (type === "api") {
        setCopiedApi(true);
        setTimeout(() => setCopiedApi(false), 2000);
      } else {
        setCopiedUpload(true);
        setTimeout(() => setCopiedUpload(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const apiPayloadExample = JSON.stringify(
    {
      title: "Task title from external setup",
      description: "Detailed description of the task",
      type: "feature", // or "bug"
      acceptanceCriteria: "Optional acceptance criteria for features",
      stepsToReproduce: "Optional steps to reproduce for bugs",
      photoUrls: ["[my-image.png]https://drive.google.com/file/d/..."]
    },
    null,
    2
  );

  const curlExample = `curl -X POST "${publicApiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ title: "New API Task", description: "Created via curl setup", type: "bug" })}'`;

  const uploadResponseExample = JSON.stringify(
    {
      success: true,
      url: "https://drive.google.com/file/d/...",
      name: "filename.png"
    },
    null,
    2
  );

  const curlUploadExample = `curl -X POST "${publicUploadUrl}" \\
  -F "file=@/path/to/your/image.png"`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Public Form & API Integration" maxWidth="max-w-2xl">
      <div className="space-y-6 text-slate-300">
        <p className="text-sm text-slate-400">
          Enable external stakeholders, clients, or automated tools to submit tasks directly to your project backlog.
          All submissions default to the <span className="text-emerald-400 font-semibold">Proposed</span> state in the <span className="text-indigo-400 font-semibold">Backlog</span>.
        </p>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 pb-2 gap-2">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "form"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            Public Form
          </button>
          <button
            onClick={() => setActiveTab("task-api")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "task-api"
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            Task API
          </button>
          <button
            onClick={() => setActiveTab("upload-api")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "upload-api"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            Upload API
          </button>
        </div>

        {/* Public Form Tab */}
        {activeTab === "form" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" /> Public Submission Form URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={publicFormUrl}
                  readOnly
                  className="bg-black/40 border-white/10 text-white font-mono text-xs select-all flex-1 h-10"
                />
                <Button
                  type="button"
                  variant={copiedForm ? "default" : "outline"}
                  onClick={() => copyToClipboard(publicFormUrl, "form")}
                  className={`shrink-0 h-10 px-4 transition-all duration-200 ${
                    copiedForm ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : ""
                  }`}
                >
                  {copiedForm ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Share this link with users so they can submit bugs or features via a styled web interface.
              </p>
            </div>
          </div>
        )}

        {/* Task API Tab */}
        {activeTab === "task-api" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-accent" /> Task Creation Endpoint (POST)
              </label>
              <div className="flex gap-2">
                <Input
                  value={publicApiUrl}
                  readOnly
                  className="bg-black/40 border-white/10 text-white font-mono text-xs select-all flex-1 h-10"
                />
                <Button
                  type="button"
                  variant={copiedApi ? "default" : "outline"}
                  onClick={() => copyToClipboard(publicApiUrl, "api")}
                  className={`shrink-0 h-10 px-4 transition-all duration-200 ${
                    copiedApi ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : ""
                  }`}
                >
                  {copiedApi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Integrate this endpoint into your automated workflows (e.g. Sentry, GitHub Actions, or Webhooks) to automate task ingestion.
              </p>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">JSON Request Body Schema:</p>
                <pre className="bg-black/60 border border-white/5 rounded-lg p-3 text-xs font-mono overflow-x-auto text-indigo-300 max-h-[160px] scrollbar-thin scrollbar-thumb-white/10">
                  {apiPayloadExample}
                </pre>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">cURL Example:</p>
                <pre className="bg-black/60 border border-white/5 rounded-lg p-3 text-xs font-mono overflow-x-auto text-slate-300 whitespace-pre-wrap select-all">
                  {curlExample}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Upload API Tab */}
        {activeTab === "upload-api" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" /> File Upload Endpoint (POST)
              </label>
              <div className="flex gap-2">
                <Input
                  value={publicUploadUrl}
                  readOnly
                  className="bg-black/40 border-white/10 text-white font-mono text-xs select-all flex-1 h-10"
                />
                <Button
                  type="button"
                  variant={copiedUpload ? "default" : "outline"}
                  onClick={() => copyToClipboard(publicUploadUrl, "upload")}
                  className={`shrink-0 h-10 px-4 transition-all duration-200 ${
                    copiedUpload ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : ""
                  }`}
                >
                  {copiedUpload ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload images, logs, PDFs, or documents directly from external tools. File permissions will be set to public view access in Google Drive automatically.
              </p>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Response JSON Schema:</p>
                <pre className="bg-black/60 border border-white/5 rounded-lg p-3 text-xs font-mono overflow-x-auto text-indigo-300 max-h-[160px] scrollbar-thin scrollbar-thumb-white/10">
                  {uploadResponseExample}
                </pre>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">cURL Example (multipart/form-data):</p>
                <pre className="bg-black/60 border border-white/5 rounded-lg p-3 text-xs font-mono overflow-x-auto text-slate-300 whitespace-pre-wrap select-all">
                  {curlUploadExample}
                </pre>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-200">
                <strong>💡 Multi-step integration pattern:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Send your file to the <strong>Upload API</strong> first. It returns a URL.</li>
                  <li>Pass that URL inside the <code>photoUrls</code> array of the <strong>Task API</strong> call, formatted as <code>"[filename.png]https://drive.google.com/..."</code> to preserve the name on your Kanban board.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );

}
