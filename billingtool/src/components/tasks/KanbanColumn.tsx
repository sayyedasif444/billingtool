"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/lib/firebase/db";
import { KanbanCard } from "./KanbanCard";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanColumn({ id, title, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "Column",
      status: id,
    },
  });

  const taskIds = tasks.map((task) => task.id!);

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col bg-black/40 h-full overflow-hidden border-r transition-all duration-300
        ${isCollapsed ? 'w-16 min-w-[64px]' : 'w-[320px] min-w-[320px]'}
        ${isOver ? 'border-primary/50 bg-primary/5' : 'border-white/5'}
      `}
    >
      <div className={`p-4 flex border-b border-white/5 bg-white/5 transition-all
        ${isCollapsed ? 'flex-col items-center gap-4 py-6' : 'items-center justify-between'}
      `}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4 mt-2">
              <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
              <h3 className="font-semibold text-sm text-slate-200 [writing-mode:vertical-lr] rotate-180 tracking-widest uppercase opacity-50 whitespace-nowrap">
                {title}
              </h3>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-sm text-slate-200">{title}</h3>
              <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={() => onAddTask(id)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div 
          className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
