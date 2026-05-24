"use client";

import React, { useState, useEffect, use } from "react";
import { dbApi, Project, Task, TaskType } from "@/lib/firebase/db";
import { uploadProjectFile } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Bug, Lightbulb, CheckCircle2, ChevronRight, Loader2, Image as ImageIcon, Trash2, FileText, Paperclip } from "lucide-react";

interface PublicNewTaskPageProps {
  params: Promise<{ id: string }>;
}

export default function PublicNewTaskPage({ params }: PublicNewTaskPageProps) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [projectNameLoading, setProjectNameLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "feature" as TaskType,
    description: "",
    acceptanceCriteria: "",
    stepsToReproduce: "",
    photoUrls: [] as string[]
  });

  useEffect(() => {
    async function fetchProject() {
      try {
        const proj = await dbApi.getProject(projectId);
        if (proj) {
          setProject(proj as Project);
        }
      } catch (error) {
        console.warn("Could not fetch project name (this is expected if Firestore rules restrict reads for anonymous users):", error);
      } finally {
        setProjectNameLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

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
            photoUrls: [...prev.photoUrls, valueToSave]
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
            photoUrls: [...prev.photoUrls, valueToSave]
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
      photoUrls: prev.photoUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Task = {
        projectId,
        title: formData.title.trim(),
        type: formData.type,
        description: formData.description,
        status: "Proposed",
        sprintId: "", // Enforce backlog
        photoUrls: formData.photoUrls
      };

      if (formData.acceptanceCriteria) {
        payload.acceptanceCriteria = formData.acceptanceCriteria;
      }
      if (formData.stepsToReproduce) {
        payload.stepsToReproduce = formData.stepsToReproduce;
      }

      await dbApi.createTask(payload);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit task:", error);
      alert("Something went wrong while submitting the task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      type: "feature",
      description: "",
      acceptanceCriteria: "",
      stepsToReproduce: "",
      photoUrls: []
    });
    setSubmitted(false);
  };

  const isBug = formData.type === "bug";

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="bg-[#0b0f1d] border border-white/10 rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Task Submitted!</h2>
            <p className="text-slate-400 text-sm">
              Your request has been successfully added to the backlog of <span className="text-slate-200 font-semibold">{project?.name || "the project"}</span> in the <span className="text-emerald-400 font-semibold">Proposed</span> state.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={handleReset} variant="outline" className="w-full h-11 border-white/10 text-white">
              Submit Another Task
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 relative flex items-center justify-center bg-[#020617]">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10" />
      
      <div className="bg-[#0b0f1d] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header decoration */}
        <div className="h-1.5 bg-gradient-to-r from-primary to-accent w-full" />
        
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Submit Task
            </h1>
            <p className="text-sm text-slate-400">
              {projectNameLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" /> Loading project context...
                </span>
              ) : project?.name ? (
                <>For project: <span className="text-slate-200 font-semibold">{project.name}</span></>
              ) : (
                "Submit a bug report or feature request directly to the project team."
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Task Type Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Type</label>
              <div className="flex bg-black/40 p-1.5 rounded-lg border border-white/5 w-fit">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: "feature" }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    !isBug ? "bg-emerald-500/20 text-emerald-400 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" /> Feature Request
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: "bug" }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    isBug ? "bg-red-500/20 text-red-400 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Bug className="h-4 w-4" /> Bug Report
                </button>
              </div>
            </div>

            {/* Task Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Title *</label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={isBug ? "e.g., App crashes when uploading PNG files" : "e.g., Add dark mode toggle in navbar"}
                required
                className="bg-black/40 border-white/10 text-white text-md py-5 focus:ring-primary focus:border-transparent h-11"
              />
            </div>

            {/* Steps to Reproduce (if Bug, shown right below title) */}
            {isBug && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Steps to Reproduce</label>
                <RichTextEditor
                  value={formData.stepsToReproduce}
                  onChange={content => setFormData(prev => ({ ...prev, stepsToReproduce: content }))}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={content => setFormData(prev => ({ ...prev, description: content }))}
              />
            </div>

            {/* Acceptance Criteria (if Feature) */}
            {!isBug && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Acceptance Criteria</label>
                <RichTextEditor
                  value={formData.acceptanceCriteria}
                  onChange={content => setFormData(prev => ({ ...prev, acceptanceCriteria: content }))}
                />
              </div>
            )}

            {/* Attached Photos / Files */}
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" /> Attachments (Images or Docs)
              </label>
              <div className="flex flex-wrap gap-4">
                {formData.photoUrls.map((url, i) => {
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

            {/* Actions */}
            <div className="pt-4 border-t border-white/5 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="h-11 px-6 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Task
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
