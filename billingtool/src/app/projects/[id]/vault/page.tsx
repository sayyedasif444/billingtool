"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, ProjectAsset, dbApi } from '@/lib/firebase/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Key, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Paperclip, 
  Loader2, 
  Save, 
  Copy, 
  Check,
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { uploadProjectFile } from '@/lib/firebase/storage';

export default function ProjectVaultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newAsset, setNewAsset] = useState<{
    key: string;
    value: string;
    file: File | null;
  }>({
    key: '',
    value: '',
    file: null
  });

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      try {
        const pData = await dbApi.getProject(id as string) as Project;
        if (pData) {
          setProject(pData);
          setAssets(pData.assets || []);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const handleCopy = (text: string, assetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(assetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.key || !project) return;

    setSaving(true);
    try {
      let fileData = {};
      if (newAsset.file) {
        const { url, name } = await uploadProjectFile(project.id!, newAsset.file);
        fileData = { fileUrl: url, fileName: name };
      }

      const asset: ProjectAsset = {
        id: Math.random().toString(36).substr(2, 9),
        key: newAsset.key,
        value: newAsset.value,
        ...fileData,
        createdAt: new Date().toISOString()
      };

      const updatedAssets = [...assets, asset];
      await dbApi.updateProject(project.id!, { assets: updatedAssets });
      
      setAssets(updatedAssets);
      setIsAdding(false);
      setNewAsset({ key: '', value: '', file: null });
    } catch (error) {
      alert("Failed to add credential/asset");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to remove this entry?")) return;

    const updatedAssets = assets.filter(a => a.id !== assetId);
    try {
      await dbApi.updateProject(project!.id!, { assets: updatedAssets });
      setAssets(updatedAssets);
    } catch (error) {
      alert("Failed to delete asset");
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.value?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              Credentials & Assets
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
              placeholder="Search keys..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 w-full md:w-64"
            />
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500">
            <Plus className="h-4 w-4" /> New Asset
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-400">Add New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key / Label</label>
                <Input 
                  value={newAsset.key}
                  onChange={e => setNewAsset({ ...newAsset, key: e.target.value })}
                  placeholder="e.g. AWS Access Key"
                  className="bg-black/40 border-white/10 h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Value / Account (Optional)</label>
                <Input 
                  value={newAsset.value}
                  onChange={e => setNewAsset({ ...newAsset, value: e.target.value })}
                  placeholder="e.g. AKIA..."
                  className="bg-black/40 border-white/10 h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attachment (Optional)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    onChange={e => setNewAsset({ ...newAsset, file: e.target.files?.[0] || null })}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex h-11 items-center justify-between px-3 w-full rounded-md border border-white/10 bg-black/40 text-sm text-slate-300">
                    <span className="truncate">{newAsset.file ? newAsset.file.name : "Select File"}</span>
                    <Paperclip className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="gap-2 px-6 bg-emerald-600 hover:bg-emerald-500">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save to Vault
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Asset Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Key / Asset</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Value / Data</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-32">File</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                    {searchQuery ? "No assets matching your search." : "No entries yet. Build your project vault above."}
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10 text-primary">
                          <Key className="h-4 w-4" />
                        </div>
                        {asset.key}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-300 font-mono text-sm break-all flex-1 bg-black/20 p-2 rounded border border-white/5 min-h-[36px] flex items-center">
                          {asset.value || <span className="text-slate-600 italic">No value</span>}
                        </div>
                        {asset.value && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopy(asset.value!, asset.id)}
                            className="h-9 w-9 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                          >
                            {copiedId === asset.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {asset.fileUrl ? (
                        <a 
                          href={asset.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                          title={asset.fileName}
                        >
                          <Paperclip className="h-3 w-3" />
                          View
                        </a>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="h-9 w-9 text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
