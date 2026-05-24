"use client";

import { useState, useEffect } from "react";
import { dbApi, Client, Project } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Briefcase, Loader2, Plus, Edit, Trash2, StickyNote, CheckSquare, Key, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    clientId: "",
    name: "",
    description: "",
    status: "active"
  });

  const [hasDependents, setHasDependents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      if (!activeCompany) return;
      try {
        const [cData, pData, qData, iData, eData] = await Promise.all([
          dbApi.getClients(activeCompany.id!),
          dbApi.getProjects(activeCompany.id!),
          dbApi.getQuotations(activeCompany.id!),
          dbApi.getInvoices(activeCompany.id!),
          dbApi.getExpenses(activeCompany.id!)
        ]);
        
        const projectList = pData as Project[];
        setClients(cData as Client[]);
        setProjects(projectList);

        // Check dependencies
        const dependents: Record<string, boolean> = {};
        projectList.forEach(project => {
          const hasQuotes = (qData as any[]).some(q => q.projectId === project.id);
          const hasInvoices = (iData as any[]).some(i => i.projectId === project.id);
          const hasExpenses = (eData as any[]).some(e => e.projectId === project.id);
          dependents[project.id!] = hasQuotes || hasInvoices || hasExpenses;
        });
        setHasDependents(dependents);
        
        if (cData.length > 0) {
          setFormData(prev => ({ ...prev, clientId: (cData[0] as Client).id }));
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCompany]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !formData.clientId || !formData.name) return;
    
    setSaving(true);
    try {
      if (formData.id) {
        await dbApi.updateProject(formData.id, formData);
        setProjects(projects.map(p => p.id === formData.id ? { ...p, ...formData } as Project : p));
      } else {
        const newProject = {
          ...formData,
          companyId: activeCompany.id!,
          assets: [],
          notes: [],
          tasks: []
        } as Project;
        const newId = await dbApi.createProject(newProject);
        setProjects([{ ...newProject, id: newId }, ...projects]);
      }
      setIsEditing(false);
      setFormData({
        clientId: clients.length > 0 ? clients[0].id : "",
        name: "",
        description: "",
        status: "active"
      });
    } catch (error) {
      alert("Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData(project);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (hasDependents[id]) {
      alert("Cannot delete project because it has linked Quotations, Invoices, or Expenses. Delete those items first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await dbApi.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      alert("Failed to delete project");
    }
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please create or select a company first.</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Extended control over your client engagements, assets, and tasks.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="border-primary/50 shadow-lg shadow-primary/10 animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{formData.id ? 'Edit Project' : 'Add New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Client</label>
                  <select 
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as "active" | "completed"})}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active" className="bg-slate-900">Active</option>
                    <option value="completed" className="bg-slate-900">Completed</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Project Name</label>
                  <Input 
                    value={formData.name || ""} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Website Redesign" 
                    required 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Description (Optional)</label>
                  <textarea 
                    value={formData.description || ""} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Brief details about the project..."
                    className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    clientId: clients.length > 0 ? clients[0].id : "",
                    name: "",
                    description: "",
                    status: "active"
                  });
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !formData.clientId || !formData.name} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formData.id ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {projects.length === 0 && !isEditing && (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-slate-300">No projects yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Create projects to organize quotations and invoices for specific client engagements.
            </p>
            <Button onClick={() => setIsEditing(true)} className="mt-6" variant="outline">
              Create First Project
            </Button>
          </div>
        )}

        {projects.map((project) => {
          const client = clients.find(c => c.id === project.clientId);
          return (
            <Card key={project.id} className="group hover:border-white/20 transition-all bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white leading-tight">{project.name}</h3>
                          <p className="text-xs text-primary font-medium uppercase tracking-wider mt-0.5">{client?.name || 'Unknown Client'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} className="h-8 w-8 text-slate-400 hover:text-white">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id!)} className="h-8 w-8 text-slate-400 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Project Management Buttons */}
                  <div className="flex divide-x divide-white/5 bg-black/20">
                    <Link 
                      href={`/projects/${project.id}/notes`}
                      className="flex-1 md:w-32 flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors gap-2 text-slate-400 hover:text-white group/btn"
                    >
                      <StickyNote className="h-5 w-5 text-yellow-500/70 group-hover/btn:text-yellow-400 transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Notes</span>
                    </Link>
                    <Link 
                      href={`/projects/${project.id}/meetings`}
                      className="flex-1 md:w-32 flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors gap-2 text-slate-400 hover:text-white group/btn"
                    >
                      <Calendar className="h-5 w-5 text-purple-500/70 group-hover/btn:text-purple-400 transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Meetings</span>
                    </Link>
                    <button 
                      className="flex-1 md:w-32 flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors gap-2 text-slate-400 hover:text-white group/btn"
                      onClick={() => router.push(`/projects/${project.id}/tasks`)}
                    >
                      <CheckSquare className="h-5 w-5 text-blue-500/70 group-hover/btn:text-blue-400 transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Tasks</span>
                    </button>
                    <Link 
                      href={`/projects/${project.id}/vault`}
                      className="flex-1 md:w-40 flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors gap-2 text-slate-400 hover:text-white group/btn border-r border-white/5"
                    >
                      <Key className="h-5 w-5 text-emerald-500/70 group-hover/btn:text-emerald-400 transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight">Credentials & Assets</span>
                    </Link>
                    <div className="hidden lg:flex items-center px-4">
                      <ChevronRight className="h-5 w-5 text-slate-700" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
