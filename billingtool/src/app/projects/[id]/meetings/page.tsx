"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, ProjectMeeting, dbApi } from '@/lib/firebase/db';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  ArrowLeft,
  Clock,
  Video,
  MapPin,
  Bell,
  Mail,
  Search,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function ProjectMeetingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeCompany } = useCompany();
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<ProjectMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Partial<ProjectMeeting>>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    link: '',
    status: 'scheduled'
  });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const pData = await dbApi.getProject(id as string) as Project;
        if (pData) {
          setProject(pData);
          setMeetings(pData.meetings || []);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [id]);

  const showPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body
      });
    }
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !project) return;

    setSaving(true);
    try {
      const meeting: ProjectMeeting = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime || '',
        location: formData.location,
        link: formData.link,
        status: 'scheduled',
        remindersSent: {
          email15: false,
          push: false
        },
        createdAt: new Date().toISOString()
      };

      const updatedMeetings = [meeting, ...meetings];
      await dbApi.updateProject(project.id!, { meetings: updatedMeetings });
      
      setMeetings(updatedMeetings);
      setIsAdding(false);
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        link: '',
        status: 'scheduled'
      });

      // 1. Immediate Push Notification
      showPushNotification(
        "Meeting Scheduled!",
        `"${meeting.title}" is set for ${new Date(meeting.startTime).toLocaleString()}`
      );

      // 2. Send immediate confirmation mail to COMPANY
      if (activeCompany?.email) {
        try {
          const mailRes = await fetch('/api/mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: activeCompany.email,
              subject: `Meeting Scheduled: ${meeting.title}`,
              body: `A new meeting has been scheduled for your project "${project.name}".\n\nTitle: ${meeting.title}\nTime: ${new Date(meeting.startTime).toLocaleString('en-GB')}\nLocation: ${meeting.location || 'Online'}\n${meeting.link ? `Link: ${meeting.link}` : ''}\n\nThis is an automated reminder for your company.`,
              secret: process.env.NEXT_PUBLIC_PDF_SECRET
            })
          });
          
          if (!mailRes.ok) {
            const errorData = await mailRes.json();
            console.error("Mail API Error:", errorData);
            alert(`Meeting saved, but email notification failed: ${errorData.error || 'Unknown error'}`);
          } else {
            alert("Meeting scheduled successfully! Notification sent and confirmation email triggered.");
          }
        } catch (mailErr) {
          console.error("Mail Network Error:", mailErr);
          alert("Meeting saved, but could not connect to Mail API.");
        }
      }
    } catch (error) {
      alert("Failed to schedule meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel/delete this meeting?")) return;

    const updatedMeetings = meetings.filter(m => m.id !== meetingId);
    try {
      await dbApi.updateProject(project!.id!, { meetings: updatedMeetings });
      setMeetings(updatedMeetings);
    } catch (error) {
      alert("Failed to delete meeting");
    }
  };

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Calendar className="h-6 w-6 text-purple-500" />
              Project Meetings
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
              placeholder="Search meetings..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 w-full md:w-64"
            />
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-500 text-white border-none">
            <Plus className="h-4 w-4" /> Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Warning/Info Box for Reminders */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-200">
        <AlertCircle className="h-5 w-5 shrink-0 text-blue-400" />
        <p>
          <strong>Reminder Note:</strong> Scheduled notifications will show on your browser. A confirmation email is sent to <strong>your company email ({activeCompany?.email})</strong> immediately upon scheduling. Client notifications are not sent.
        </p>
      </div>

      {/* Schedule Form */}
      {isAdding && (
        <Card className="border-purple-500/30 bg-purple-500/5 shadow-xl shadow-purple-500/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-400">New Meeting Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveMeeting} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Title</label>
                  <Input 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Design Review with Client"
                    className="bg-black/40 border-white/10 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Start Time
                  </label>
                  <Input 
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-black/40 border-white/10 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> End Time (Optional)
                  </label>
                  <Input 
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-black/40 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </label>
                  <Input 
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Google Meet / Office"
                    className="bg-black/40 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Video className="h-3 w-3 text-blue-400" /> Meeting Link
                  </label>
                  <Input 
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="bg-black/40 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Agenda, notes, etc."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="gap-2 px-8 bg-purple-600 hover:bg-purple-500 text-white border-none shadow-lg shadow-purple-500/30">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Schedule & Notify
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 italic bg-white/5 border border-dashed border-white/10 rounded-xl">
            {searchQuery ? "No meetings matching your search." : "No meetings scheduled yet."}
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px] h-[60px] bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 px-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500">{new Date(meeting.startTime).toLocaleString('en-GB', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none text-white">{new Date(meeting.startTime).getDate().toString().padStart(2, '0')}</span>
                      <span className="text-[10px] font-bold text-slate-500">{new Date(meeting.startTime).getFullYear()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight group-hover:text-purple-400 transition-colors">{meeting.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-primary font-medium">
                          {new Date(meeting.startTime).toLocaleDateString('en-GB')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {meeting.endTime && ` - ${new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteMeeting(meeting.id)} className="h-8 w-8 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {meeting.location}
                    </div>
                  )}
                  {meeting.link && (
                    <a 
                      href={meeting.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 p-2 rounded border border-blue-500/10"
                    >
                      <Video className="h-4 w-4" />
                      Join Meeting
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {meeting.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      <Bell className="h-3 w-3" /> Push
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      <Mail className="h-3 w-3" /> Email
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    Scheduled
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
