"use client";

import { useState, useEffect } from "react";
import { Task, TaskType, TaskStatus, Sprint } from "@/lib/firebase/db";
import { uploadProjectFile } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { X, Loader2, Bug, Lightbulb, Image as ImageIcon, Trash2, FileText, Paperclip } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  task?: Task | null;
  sprints: Sprint[];
  projectId: string;
  onDelete?: (taskId: string) => Promise<void>;
}

const BACKLOG_STATUSES: TaskStatus[] = ["Proposed", "inDiscussion", "Approved", "No Action"];
const SPRINT_STATUSES: TaskStatus[] = ["Pending", "Blocked", "In Progress", "Development", "To Merge", "Production"];

const STATUSES: TaskStatus[] = [...BACKLOG_STATUSES, ...SPRINT_STATUSES];

export function TaskModal({ isOpen, onClose, onSave, task, projectId, sprints, onDelete }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    projectId,
    title: "",
    type: "feature",
    status: task?.status || "Proposed",
    description: "",
    acceptanceCriteria: "",
    stepsToReproduce: "",
    photoUrls: [],
    estimatedDays: undefined,
    sprintId: task?.sprintId || ""
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (task) {
      const sprintId = task.sprintId || "";
      let status = task.status;
      if (sprintId) {
        if (!SPRINT_STATUSES.includes(status)) {
          status = "Pending";
        }
      } else {
        if (!BACKLOG_STATUSES.includes(status)) {
          status = "Proposed";
        }
      }
      setFormData({
        ...task,
        sprintId,
        status
      });
    } else {
      setFormData({
        projectId,
        title: "",
        type: "feature",
        status: "Proposed",
        description: "",
        acceptanceCriteria: "",
        stepsToReproduce: "",
        photoUrls: [],
        estimatedDays: undefined,
        sprintId: ""
      });
    }
  }, [task, projectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (payload.sprintId === "") delete payload.sprintId;
      await onSave(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id || !onDelete) return;
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (Only images, PDFs, and Excel spreadsheets)
    const allowedExtensions = [".pdf", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isAllowedDoc = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ].includes(file.type);

    if (!isImage && !isAllowedDoc && !allowedExtensions.includes(fileExt)) {
      alert("Invalid file format. Only PDF, Excel spreadsheet (.xls, .xlsx, .csv), and Image files are allowed.");
      e.target.value = '';
      return;
    }

    setUploadingImage(true);

    try {
      // 1. Try uploading to Google Drive via our backend API
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      
      const response = await fetch("/api/public/attachments/upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.status === 201) {
        const result = await response.json();
        if (result.success && result.url) {
          // Store format: [filename]google_drive_url
          const valueToSave = `[${file.name}]${result.url}`;
          setFormData(prev => ({
            ...prev,
            photoUrls: [...(prev.photoUrls || []), valueToSave]
          }));
          setUploadingImage(false);
          e.target.value = '';
          return;
        }
      }

      // If status is 501, it means Drive is not configured. Log and use base64 fallback.
      if (response.status === 501) {
        console.info("[DRIVE_NOT_CONFIGURED] Falling back to local base64 storage.");
      } else {
        console.warn(`[DRIVE_UPLOAD_FAILED] Status: ${response.status}. Falling back to local base64 storage.`);
      }
    } catch (error) {
      console.error("[UPLOAD_API_ERROR] Falling back to local base64 storage:", error);
    }

    // 2. Base64 Fallback (for Free Spark plan with no Google Drive setup)
    const MAX_FILE_SIZE = 600 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Since Google Drive is not configured and this project is on the Firebase Free Plan, please upload files smaller than 600KB.");
      setUploadingImage(false);
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        if (base64Data) {
          const valueToSave = `[${file.name}]${base64Data}`;
          setFormData(prev => ({
            ...prev,
            photoUrls: [...(prev.photoUrls || []), valueToSave]
          }));
        }
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert("Failed to read file.");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to process file.");
      setUploadingImage(false);
    } finally {
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photoUrls: prev.photoUrls?.filter((_, i) => i !== index)
    }));
  };

  const isBug = formData.type === "bug";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">
              {task ? "Edit Task" : "New Task"}
            </h2>
            <div className="flex bg-black/40 p-1 rounded-md border border-white/5">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: "feature"})}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  !isBug ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" /> Feature
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: "bug"})}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  isBug ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Bug className="h-3.5 w-3.5" /> Bug
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Task Title *</label>
              <Input 
                value={formData.title || ""} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Brief summary of the issue or feature" 
                required
                className="bg-black/40 text-lg py-6"
              />
            </div>

            {isBug && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Steps to Reproduce</label>
                <div className="border border-white/10 rounded-md overflow-hidden bg-black/20">
                  <RichTextEditor 
                    value={formData.stepsToReproduce || ""}
                    onChange={(val) => setFormData({...formData, stepsToReproduce: val})}
                    placeholder="1. Go to...\n2. Click on...\n3. Observe..."
                  />
                </div>
              </div>
            )}

            <div className={`grid ${task ? 'grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {task && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => {
                        const newStatus = e.target.value as TaskStatus;
                        setFormData(prev => ({
                          ...prev,
                          status: newStatus
                        }));
                      }}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {(formData.sprintId ? SPRINT_STATUSES : BACKLOG_STATUSES).map(s => (
                        <option key={s} value={s} className="bg-slate-900">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Sprint</label>
                    <select 
                      value={formData.sprintId || ""}
                      onChange={e => {
                        const newSprintId = e.target.value;
                        setFormData(prev => {
                          let newStatus: TaskStatus = prev.status || "Proposed";
                          if (newSprintId) {
                            if (!SPRINT_STATUSES.includes(newStatus)) {
                              newStatus = "Pending";
                            }
                          } else {
                            if (!BACKLOG_STATUSES.includes(newStatus)) {
                              newStatus = "Proposed";
                            }
                          }
                          return {
                            ...prev,
                            sprintId: newSprintId,
                            status: newStatus
                          };
                        });
                      }}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" className="bg-slate-900">Backlog (No Sprint)</option>
                      {sprints.map((s, index) => (
                        <option key={s.id} value={s.id}>Sprint {index + 1} ({new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Est. Days</label>
                <Input 
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedDays || ""} 
                  onChange={e => setFormData({...formData, estimatedDays: parseFloat(e.target.value) || undefined})}
                  placeholder="e.g. 2.5"
                  className="bg-black/40 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <div className="border border-white/10 rounded-md overflow-hidden bg-black/20">
                <RichTextEditor 
                  value={formData.description || ""}
                  onChange={(val) => setFormData({...formData, description: val})}
                  placeholder="Detailed description..."
                />
              </div>
            </div>

            {!isBug && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Acceptance Criteria</label>
                <div className="border border-white/10 rounded-md overflow-hidden bg-black/20">
                  <RichTextEditor 
                    value={formData.acceptanceCriteria || ""}
                    onChange={(val) => setFormData({...formData, acceptanceCriteria: val})}
                    placeholder="Given...\nWhen...\nThen..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-slate-400" /> Attachments (Images or Docs)
              </label>
              <div className="flex flex-wrap gap-4">
                {formData.photoUrls?.map((url, i) => {
                  let attachmentName = "Attachment";
                  let isImg = true;
                  let cleanUrl = url;
                  try {
                    if (url.startsWith("[")) {
                      const match = url.match(/^\[(.*?)\](.*)$/);
                      if (match) {
                        attachmentName = match[1];
                        cleanUrl = match[2];
                      }
                      isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachmentName);
                    } else {
                      const decodedPath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
                      const parts = decodedPath.split("/");
                      const fullName = parts[parts.length - 1];
                      attachmentName = fullName.replace(/^\d+_/g, "");
                      isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachmentName);
                    }
                  } catch (e) {
                    // Fallback
                  }

                  return (
                    <div 
                      key={i} 
                      onClick={() => window.open(cleanUrl, "_blank")}
                      title="Click to view attachment"
                      className="relative group w-32 h-32 rounded-lg border border-white/10 overflow-hidden bg-black/40 flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {isImg ? (
                        <img src={cleanUrl} alt={`Attachment ${i}`} className="max-w-full max-h-full object-contain rounded" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 w-full">
                          <FileText className="h-8 w-8 text-primary" />
                          <span className="text-[10px] text-slate-400 truncate w-full px-1">{attachmentName}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-red-400 rounded hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                
                <label className="w-32 h-32 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 cursor-pointer transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs font-medium">Add File</span>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage} 
                      />
                    </>
                  )}
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-white/10 bg-white/5 shrink-0">
          <div>
            {task && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSaving}>
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isDeleting || isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" disabled={isSaving || isDeleting || !formData.title}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
