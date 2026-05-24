"use client";

import { useState, useEffect } from "react";
import { dbApi, Client } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Users, Plus, Loader2, Mail, Phone, MapPin, X, Pencil, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const { activeCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [hasDependents, setHasDependents] = useState<Record<string, boolean>>({});

  const loadClients = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [cData, pData, qData, iData, eData] = await Promise.all([
        dbApi.getClients(activeCompany.id!),
        dbApi.getProjects(activeCompany.id!),
        dbApi.getQuotations(activeCompany.id!),
        dbApi.getInvoices(activeCompany.id!),
        dbApi.getExpenses(activeCompany.id!)
      ]);
      
      const clientList = cData as Client[];
      setClients(clientList);

      // Check dependencies
      const dependents: Record<string, boolean> = {};
      clientList.forEach(client => {
        const hasProjects = (pData as any[]).some(p => p.clientId === client.id);
        const hasQuotes = (qData as any[]).some(q => q.clientId === client.id);
        const hasInvoices = (iData as any[]).some(i => i.clientId === client.id);
        const hasExpenses = (eData as any[]).some(e => e.clientId === client.id);
        dependents[client.id!] = hasProjects || hasQuotes || hasInvoices || hasExpenses;
      });
      setHasDependents(dependents);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [activeCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !activeCompany) {
      alert("Name and email are required, and a company must be selected.");
      return;
    }
    
    setSaving(true);
    try {
      if (editingId) {
        await dbApi.updateClient(editingId, formData);
      } else {
        await dbApi.createClient({
          ...formData,
          companyId: activeCompany.id!,
        } as Client);
      }
      
      closeForm();
      await loadClients();
    } catch (error) {
      
      alert("Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (hasDependents[id]) {
      alert("Cannot delete client because they have associated Projects, Quotations, Invoices, or Expenses. Delete those items first.");
      return;
    }

    const confirm = window.confirm("Are you sure you want to delete this client? This cannot be undone.");
    if (!confirm) return;

    try {
      await dbApi.deleteClient(id);
      await loadClients();
    } catch (error) {
      
      alert("Failed to delete client");
    }
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id!);
    setFormData(client);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please create or select a company first.</div>;
  }

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your client list for {activeCompany.name}.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/50 shadow-primary/10 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>{editingId ? "Edit Client" : "Add New Client"}</CardTitle>
              <CardDescription>Enter the client's contact and billing information</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Client Name / Company</label>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="billing@acme.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Phone Number</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Billing Address</label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="123 Business Rd, City" />
              </div>
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Client" : "Save Client"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 && !loading && !showForm && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
            No clients found for this company. Click "Add Client" to create your first one.
          </div>
        )}
        
        {clients.map(client => (
          <Card key={client.id} className="hover:border-white/20 transition-all duration-300 group flex flex-col h-full">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{client.name}</CardTitle>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(client)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(client.id!)} className="p-1.5 text-red-400 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-slate-300 flex-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
