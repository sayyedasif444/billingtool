"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/firebase/db";
import { Bug, Lightbulb, Clock, MoreVertical, Paperclip, CalendarDays } from "lucide-react";

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id!, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBug = task.type === "bug";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onClick(task)}
      className={`relative p-4 mb-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing bg-slate-900/90 transition-colors
        ${isDragging ? "opacity-50 border-primary" : "border-white/10 hover:border-white/20"}
      `}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
          ${isBug ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}
        `}>
          {isBug ? <Bug className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
          {task.type}
        </div>
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onClick(task); }}
          className="text-slate-500 hover:text-slate-300 transition-colors relative z-10"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-white leading-tight mb-2 line-clamp-2">
        {task.title}
      </h4>

      <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
             {(() => {
               if (!task.createdAt) return 'New';
               try {
                 let date: Date;
                 if ((task.createdAt as any).toDate && typeof (task.createdAt as any).toDate === 'function') {
                   date = (task.createdAt as any).toDate();
                 } else if ((task.createdAt as any).toMillis && typeof (task.createdAt as any).toMillis === 'function') {
                   date = new Date((task.createdAt as any).toMillis());
                 } else if ((task.createdAt as any).seconds !== undefined) {
                   date = new Date((task.createdAt as any).seconds * 1000);
                 } else {
                   date = new Date(task.createdAt as any);
                 }
                 return isNaN(date.getTime()) ? 'New' : date.toLocaleDateString();
               } catch (e) {
                 return 'New';
               }
             })()}
          </span>
        </div>
        {task.estimatedDays !== undefined && (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>{task.estimatedDays}d</span>
          </div>
        )}
        {task.photoUrls && task.photoUrls.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            <span>{task.photoUrls.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
