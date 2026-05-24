import React, { useState } from 'react';
import { Project, ProjectAsset, dbApi } from '@/lib/firebase/db';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Key, Plus, Trash2, ExternalLink, Paperclip, Loader2, Save, Copy, Check } from 'lucide-react';
import { uploadProjectFile } from '@/lib/firebase/storage';

interface ProjectVaultProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: (updatedProject: Project) => void;
}

export function ProjectVault({ isOpen, onClose, project, onUpdate }: ProjectVaultProps) {
  const [assets, setAssets] = useState<ProjectAsset[]>(project.assets || []);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.key) return;

    setLoading(true);
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
      onUpdate({ ...project, assets: updatedAssets });
      
      setIsAdding(false);
      setNewAsset({ key: '', value: '', file: null });
    } catch (error) {
      console.error("Error adding asset:", error);
      alert("Failed to add credential/asset");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to remove this entry?")) return;

    const updatedAssets = assets.filter(a => a.id !== assetId);
    try {
      await dbApi.updateProject(project.id!, { assets: updatedAssets });
      setAssets(updatedAssets);
      onUpdate({ ...project, assets: updatedAssets });
    } catch (error) {
      alert("Failed to delete asset");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Credentials & Assets: ${project.name}`} maxWidth="max-w-4xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-400">
            Store and manage all associated keys, accounts, and assets for this project in one place.
          </p>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add New
            </Button>
          )}
        </div>

        {isAdding && (
          <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2">
            <CardContent className="p-4">
              <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Key / Label</label>
                  <Input 
                    value={newAsset.key}
                    onChange={e => setNewAsset({ ...newAsset, key: e.target.value })}
                    placeholder="e.g. AWS Access Key"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Value / Account (Optional)</label>
                  <Input 
                    value={newAsset.value}
                    onChange={e => setNewAsset({ ...newAsset, value: e.target.value })}
                    placeholder="e.g. AKIA..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Attachment (Optional)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={e => setNewAsset({ ...newAsset, file: e.target.files?.[0] || null })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button type="button" variant="outline" className="w-full gap-2 text-xs h-10 border-white/10 bg-black/40">
                      <Paperclip className="h-3 w-3" />
                      {newAsset.file ? newAsset.file.name : "Attach File"}
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Entry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Key / Asset</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Value</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-24">File</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                    No entries yet. Click "Add New" to start building your project vault.
                  </td>
                </tr>
              )}
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-3">
                    <div className="font-medium text-white flex items-center gap-2">
                      <Key className="h-3 w-3 text-primary" />
                      {asset.key}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-slate-300 break-all flex-1">
                        {asset.value || <span className="text-slate-600">—</span>}
                      </div>
                      {asset.value && (
                        <button 
                          onClick={() => handleCopy(asset.value!, asset.id)}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                          title="Copy to clipboard"
                        >
                          {copiedId === asset.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {asset.fileUrl ? (
                      <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 rounded bg-white/5 text-primary hover:bg-primary/20 transition-colors" title={asset.fileName}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

// Re-using UI components if they are not exported correctly
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-slate-900/50 border border-white/10 rounded-xl ${className}`}>{children}</div>;
}
function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
