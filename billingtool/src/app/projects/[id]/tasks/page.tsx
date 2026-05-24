"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, rectIntersection } from "@dnd-kit/core";
import { dbApi, Project, Sprint, Task, TaskStatus } from "@/lib/firebase/db";
import { KanbanColumn } from "@/components/tasks/KanbanColumn";
import { SprintModal } from "@/components/tasks/SprintModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { ShareFormModal } from "@/components/tasks/ShareFormModal";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Plus, Loader2, Target, Share2, Download, Edit } from "lucide-react";
import { exportTasksToExcel } from "@/lib/utils/excelExport";

const BACKLOG_STATUSES: TaskStatus[] = [
  "Proposed", "inDiscussion", "Approved", "No Action"
];

const SPRINT_STATUSES: TaskStatus[] = [
  "Pending", "Blocked", "In Progress", "Development", "To Merge", "Production"
];

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSprintId, setActiveSprintId] = useState<string>(""); // "" = backlog
  
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, sData, tData] = await Promise.all([
          dbApi.getProject(projectId),
          dbApi.getSprintsByProject(projectId),
          dbApi.getTasksByProject(projectId)
        ]);

        if (pData) setProject(pData as Project);
        setSprints(sData);
        setTasks(tData);

        // Auto select first sprint if any (sorted chronologically)
        if (sData.length > 0) {
          const sorted = [...sData].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          setActiveSprintId(sorted[0].id!);
        }
      } catch (error) {
        console.error("Failed to load task data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const currentTasks = useMemo(() => {
    return tasks
      .map(t => {
        const sprintId = t.sprintId || "";
        let status = t.status;
        if (sprintId) {
          if (!SPRINT_STATUSES.includes(status)) {
            status = "Pending";
          }
        } else {
          if (!BACKLOG_STATUSES.includes(status)) {
            status = "Proposed";
          }
        }
        return { ...t, sprintId, status };
      })
      .filter(t => t.sprintId === activeSprintId);
  }, [tasks, activeSprintId]);

  const activeSprint = useMemo(() => {
    return sprints.find(s => s.id === activeSprintId);
  }, [sprints, activeSprintId]);

  const sortedSprints = useMemo(() => {
    return [...sprints].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [sprints]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    
    const activeTask = tasks.find(t => t.id === taskId);
    if (!activeTask) return;

    let newStatus: TaskStatus;
    
    const ALL_STATUSES = [...BACKLOG_STATUSES, ...SPRINT_STATUSES];
    // Check if dropped over a column directly
    if (ALL_STATUSES.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
    } else {
      // Dropped over a task card
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        return;
      }
    }

    if (activeTask.status !== newStatus) {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      try {
        await dbApi.updateTask(taskId, { status: newStatus });
      } catch (error) {
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: activeTask.status } : t));
        alert("Failed to update task status.");
      }
    }
  };

  const handleSaveSprint = async (sprintData: Partial<Sprint>) => {
    if (sprintData.id) {
      await dbApi.updateSprint(sprintData.id, sprintData);
      setSprints(prev => prev.map(s => s.id === sprintData.id ? { ...s, ...sprintData } as Sprint : s));
    } else {
      const newId = await dbApi.createSprint(sprintData as Sprint);
      const newSprint = { ...sprintData, id: newId } as Sprint;
      setSprints(prev => [...prev, newSprint]);
      setActiveSprintId(newId);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await dbApi.updateTask(taskData.id, taskData);
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newId = await dbApi.createTask(taskData as Task);
      setTasks(prev => [...prev, { ...taskData, id: newId } as Task]);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    // Check if there are tasks assigned to this sprint
    const hasTasks = tasks.some(t => t.sprintId === sprintId);
    if (hasTasks) {
      alert("Cannot delete sprint because there are tasks assigned to it.");
      return;
    }
    
    await dbApi.deleteSprint(sprintId);

    // 2. Update local state
    setSprints(prev => prev.filter(s => s.id !== sprintId));
    
    // 3. Reset active sprint view
    if (activeSprintId === sprintId) {
      setActiveSprintId("");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await dbApi.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleExportExcel = async () => {
    try {
      await exportTasksToExcel(project, activeSprint, currentTasks, sortedSprints);
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("Failed to export Excel spreadsheet.");
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black/40">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/5 bg-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/projects')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{project?.name} - Board</h1>
            <p className="text-sm text-slate-400">Kanban & Sprint Planning</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <select
              value={activeSprintId}
              onChange={(e) => setActiveSprintId(e.target.value)}
              className="h-10 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary w-[200px]"
            >
              <option value="">Backlog (No Sprint)</option>
              {sortedSprints.map((s, index) => (
                <option key={s.id} value={s.id}>
                  Sprint {index + 1} ({new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()})
                </option>
              ))}
            </select>

            {activeSprintId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const sprintToEdit = sprints.find(s => s.id === activeSprintId);
                  if (sprintToEdit) {
                    setEditingSprint(sprintToEdit);
                    setIsSprintModalOpen(true);
                  }
                }}
                title="Edit Sprint Dates"
                className="h-10 w-10 p-0 text-slate-300 hover:text-white border-white/10 hover:bg-white/5"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              setEditingSprint(null);
              setIsSprintModalOpen(true);
            }}
          >
            New Sprint
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setIsShareModalOpen(true)}
            className="border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 hover:text-white"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Form
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            className="border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          
          <Button onClick={() => openNewTaskModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Task
          </Button>
        </div>
      </header>



      {/* Kanban Board Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
          <div className="flex h-full items-start">
            {(activeSprintId === "" ? BACKLOG_STATUSES : SPRINT_STATUSES).map(status => {
              const columnTasks = currentTasks.filter(t => t.status === status);
              return (
                <KanbanColumn 
                  key={status}
                  id={status}
                  title={status}
                  tasks={columnTasks}
                  onAddTask={() => openNewTaskModal()}
                  onTaskClick={(t) => {
                    setEditingTask(t);
                    setIsTaskModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </DndContext>
      </main>

      <SprintModal 
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleSaveSprint}
        onDelete={handleDeleteSprint}
        sprint={editingSprint}
        projectId={projectId}
        hasTasks={editingSprint ? tasks.some(t => t.sprintId === editingSprint.id) : false}
      />

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={editingTask}
        projectId={projectId}
        sprints={sortedSprints}
      />

      <ShareFormModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}
