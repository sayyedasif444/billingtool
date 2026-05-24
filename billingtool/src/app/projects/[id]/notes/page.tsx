"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, ProjectNote, dbApi } from '@/lib/firebase/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  ArrowLeft,
  Search,
  Edit,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ProjectNotesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState<{
    title: string;
    content: string;
  }>({
    title: '',
    content: ''
  });

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      try {
        const pData = await dbApi.getProject(id as string) as Project;
        if (pData) {
          setProject(pData);
          setNotes(pData.notes || []);
          // Expand the most recent note by default
          if (pData.notes && pData.notes.length > 0) {
            setExpandedNoteId(pData.notes[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title || !project) return;

    setSaving(true);
    try {
      const note: ProjectNote = {
        id: editingNoteId || Math.random().toString(36).substr(2, 9),
        title: newNote.title,
        content: newNote.content,
        createdAt: editingNoteId ? notes.find(n => n.id === editingNoteId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedNotes;
      if (editingNoteId) {
        updatedNotes = notes.map(n => n.id === editingNoteId ? note : n);
      } else {
        updatedNotes = [note, ...notes];
      }

      await dbApi.updateProject(project.id!, { notes: updatedNotes });
      
      setNotes(updatedNotes);
      setIsAdding(false);
      setEditingNoteId(null);
      setNewNote({ title: '', content: '' });
      setExpandedNoteId(note.id);
    } catch (error) {
      alert("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    const updatedNotes = notes.filter(n => n.id !== noteId);
    try {
      await dbApi.updateProject(project!.id!, { notes: updatedNotes });
      setNotes(updatedNotes);
    } catch (error) {
      alert("Failed to delete note");
    }
  };

  const handleEditNote = (note: ProjectNote) => {
    setEditingNoteId(note.id);
    setNewNote({
      title: note.title,
      content: note.content
    });
    setIsAdding(true);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  if (!project) {
    return <div className="p-12 text-center text-slate-400">Project not found.</div>;
  }

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <StickyNote className="h-6 w-6 text-yellow-500" />
              Project Notes
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Project: <span className="text-primary font-medium">{project.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 w-full md:w-64"
            />
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-lg shadow-yellow-500/20 bg-yellow-600 hover:bg-yellow-500 text-white border-none">
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </div>
      </div>

      {/* Note Editor Card */}
      {isAdding && (
        <Card className="border-yellow-500/30 bg-yellow-500/5 shadow-xl shadow-yellow-500/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-yellow-500">
              {editingNoteId ? 'Edit Note' : 'Create New Note'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Note Title</label>
                <Input 
                  value={newNote.title}
                  onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="e.g. Kickoff Meeting Notes"
                  className="bg-black/40 border-white/10 h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content</label>
                <RichTextEditor 
                  value={newNote.content}
                  onChange={content => setNewNote({ ...newNote, content })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => {
                  setIsAdding(false);
                  setEditingNoteId(null);
                  setNewNote({ title: '', content: '' });
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="gap-2 px-6 bg-yellow-600 hover:bg-yellow-500 text-white border-none">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingNoteId ? 'Update Note' : 'Save Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12 text-center text-slate-500 italic">
            {searchQuery ? "No notes matching your search." : "No notes yet. Click 'New Note' to add one."}
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className={`bg-white/5 border-white/10 overflow-hidden transition-all duration-300 ${expandedNoteId === note.id ? 'ring-1 ring-yellow-500/30 shadow-lg shadow-yellow-500/5' : ''}`}>
              <div 
                className="p-4 cursor-pointer flex items-center justify-between group"
                onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded bg-yellow-500/10 text-yellow-500 transition-colors ${expandedNoteId === note.id ? 'bg-yellow-500 text-white' : ''}`}>
                    <StickyNote className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{note.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> 
                        {new Date(note.updatedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditNote(note);
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {expandedNoteId === note.id ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5 text-slate-600" />}
                </div>
              </div>
              
              {expandedNoteId === note.id && (
                <CardContent className="p-6 pt-0 border-t border-white/5 bg-black/10 animate-in slide-in-from-top-2 duration-300">
                  <div className="prose prose-invert max-w-none prose-sm prose-tight mt-4 text-slate-300" dangerouslySetInnerHTML={{ __html: note.content }} />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
