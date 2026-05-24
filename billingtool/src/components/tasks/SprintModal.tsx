"use client";

import { useState, useEffect } from "react";
import { Sprint } from "@/lib/firebase/db";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { X, Loader2 } from "lucide-react";

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprint: Partial<Sprint>) => Promise<void>;
  sprint?: Sprint | null;
  projectId: string;
  onDelete?: (sprintId: string) => Promise<void>;
  hasTasks?: boolean;
}

export function SprintModal({ isOpen, onClose, onSave, sprint, projectId, onDelete, hasTasks = false }: SprintModalProps) {
  const [formData, setFormData] = useState<Partial<Sprint>>({
    projectId,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (sprint) {
      setFormData(sprint);
    } else {
      setFormData({
        projectId,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });
    }
  }, [sprint, projectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sprint?.id || !onDelete) return;

    if (hasTasks) {
      alert("Cannot delete sprint because there are tasks assigned to it. Please move or delete the tasks first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this sprint? This action cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await onDelete(sprint.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">
            {sprint ? "Edit Sprint" : "Plan New Sprint"}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Start Date *</label>
              <Input 
                type="date"
                value={formData.startDate || ""} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
                required
                className="bg-black/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">End Date *</label>
              <Input 
                type="date"
                value={formData.endDate || ""} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
                required
                className="bg-black/40"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-6">
            <div>
              {sprint && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isDeleting || isSaving}
                  className={hasTasks ? "opacity-50 cursor-not-allowed" : ""}
                  title={hasTasks ? "Cannot delete sprint because there are tasks assigned to it" : undefined}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Delete Sprint"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isDeleting || isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting || !formData.startDate || !formData.endDate}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {sprint ? "Update Sprint" : "Create Sprint"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
