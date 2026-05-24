"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { dbApi, Client, ColumnDef, TemplateDef } from "@/lib/firebase/db";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileText, Loader2, Save, Plus, Trash2, HelpCircle } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const defaultColumns: ColumnDef[] = [
  { id: "col_desc", label: "Description", type: "text" },
  { id: "col_qty", label: "Quantity", type: "number" },
  { id: "col_rate", label: "Rate", type: "number" },
  { id: "col_amount", label: "Amount", type: "calculated", formula: "[Quantity] * [Rate]" }
];

const generateNewTemplate = (): TemplateDef => ({
  id: `tpl_${Date.now()}`,
  name: "New Template",
  defaultCurrency: "USD",
  topSection: "<p>Thank you for choosing our services.</p>",
  bottomSection: "<p>Payment is due within 14 days of invoice date.</p>",
  columns: defaultColumns
});

export default function TemplatesPage() {
  const { activeCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allQuotations, setAllQuotations] = useState<Quotation[]>([]);
  const [templateData, setTemplateData] = useState<TemplateDef | null>(null);

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    let clientTemplates = client.templates || [];
    
    // Legacy fallback visually
    if (clientTemplates.length === 0 && (client as any).template) {
      clientTemplates = [{
        id: `tpl_${Date.now()}`,
        name: "Default Template",
        defaultCurrency: (client as any).template.defaultCurrency || "USD",
        topSection: (client as any).template.topSection || "",
        bottomSection: (client as any).template.bottomSection || "",
        columns: (client as any).template.columns || defaultColumns
      }];
    }

    if (clientTemplates.length > 0) {
      setSelectedTemplateId(clientTemplates[0].id);
      setTemplateData(clientTemplates[0]);
    } else {
      const newTpl = generateNewTemplate();
      setSelectedTemplateId(newTpl.id);
      setTemplateData(newTpl);
    }
  };

  const handleTemplateChange = (tplId: string) => {
    if (tplId === "NEW_TEMPLATE") {
      const newTpl = generateNewTemplate();
      setSelectedTemplateId(newTpl.id);
      setTemplateData(newTpl);
      return;
    }

    setSelectedTemplateId(tplId);
    const client = clients.find(c => c.id === selectedClient);
    if (client && client.templates) {
      const tpl = client.templates.find(t => t.id === tplId);
      if (tpl) setTemplateData(tpl);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!activeCompany) return;
      try {
        const [cData, qData, iData] = await Promise.all([
          dbApi.getClients(activeCompany.id!),
          dbApi.getQuotations(activeCompany.id!),
          dbApi.getInvoices(activeCompany.id!)
        ]);
        setClients(cData as Client[]);
        setAllQuotations(qData as Quotation[]);
        setAllInvoices(iData as Invoice[]);

        if (cData.length > 0) {
          const firstClient = cData[0] as Client;
          setSelectedClient(firstClient.id!);
          
          let clientTemplates = firstClient.templates || [];
          
          // Legacy migration
          if (clientTemplates.length === 0 && (firstClient as any).template) {
            clientTemplates = [{
              id: `tpl_${Date.now()}`,
              name: "Default Template",
              defaultCurrency: (firstClient as any).template.defaultCurrency || "USD",
              topSection: (firstClient as any).template.topSection || "",
              bottomSection: (firstClient as any).template.bottomSection || "",
              columns: (firstClient as any).template.columns || defaultColumns
            }];
          }
          
          if (clientTemplates.length > 0) {
            setSelectedTemplateId(clientTemplates[0].id);
            setTemplateData(clientTemplates[0]);
          } else {
            const newTpl = generateNewTemplate();
            setSelectedTemplateId(newTpl.id);
            setTemplateData(newTpl);
          }
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCompany]);

  const handleDeleteTemplate = async () => {
    if (!selectedClient || !templateData) return;

    // Check usage
    const isUsedInQuotes = allQuotations.some(q => q.templateId === templateData.id);
    const isUsedInInvoices = allInvoices.some(i => i.templateId === templateData.id);

    if (isUsedInQuotes || isUsedInInvoices) {
      alert("Cannot delete template because it is used in existing Quotations or Invoices.");
      return;
    }

    if (!confirm("Are you sure you want to delete this template?")) return;

    setSaving(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      if (!client) return;
      
      const newTemplates = (client.templates || []).filter(t => t.id !== templateData.id);
      await dbApi.updateClient(selectedClient, { templates: newTemplates });
      
      // Update local state
      const updatedClients = clients.map(c => c.id === selectedClient ? { ...c, templates: newTemplates } : c);
      setClients(updatedClients);
      
      if (newTemplates.length > 0) {
        setSelectedTemplateId(newTemplates[0].id);
        setTemplateData(newTemplates[0]);
      } else {
        const newTpl = generateNewTemplate();
        setSelectedTemplateId(newTpl.id);
        setTemplateData(newTpl);
      }
    } catch (error) {
      alert("Failed to delete template");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClient || !templateData) return;
    setSaving(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      if (!client) return;

      let newTemplates = client.templates || [];
      const existingIndex = newTemplates.findIndex(t => t.id === templateData.id);
      
      if (existingIndex >= 0) {
        newTemplates[existingIndex] = templateData;
      } else {
        newTemplates.push(templateData);
      }

      await dbApi.updateClient(selectedClient, { templates: newTemplates });
      
      setClients(clients.map(c => c.id === selectedClient ? { ...c, templates: newTemplates } : c));
      alert("Template saved successfully!");
    } catch (error) {
      
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Column Builders
  const addColumn = () => {
    if (!templateData) return;
    setTemplateData({
      ...templateData,
      columns: [...templateData.columns, { id: `col_${Date.now()}`, label: "New Field", type: "text" }]
    });
  };

  const removeColumn = (id: string) => {
    if (!templateData) return;
    if (templateData.columns.length <= 1) return;
    setTemplateData({
      ...templateData,
      columns: templateData.columns.filter(c => c.id !== id)
    });
  };

  const updateColumn = (id: string, field: keyof ColumnDef, value: any) => {
    if (!templateData) return;
    setTemplateData({
      ...templateData,
      columns: templateData.columns.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please create or select a company first.</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const currentClient = clients.find(c => c.id === selectedClient);
  const clientTemplates = currentClient?.templates || [];

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Template Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Design dynamic invoice and quotation layouts per client.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedClient || !templateData} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Template
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">1. Select Client</label>
            <select 
              value={selectedClient}
              onChange={e => handleClientChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>
          </div>
          
          {selectedClient && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">2. Select Template</label>
              <select 
                value={selectedTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {clientTemplates.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                ))}
                {(clientTemplates.length === 0 || !clientTemplates.find(t => t.id === selectedTemplateId)) && templateData?.id && (
                  <option value={templateData.id} className="bg-slate-900">Unsaved Template</option>
                )}
                <option value="NEW_TEMPLATE" className="bg-primary/20 text-primary font-medium">✨ Create New Template...</option>
              </select>
            </div>
          )}
        </div>

        {selectedClient && templateData ? (
          <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Template Details</CardTitle>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteTemplate} disabled={clientTemplates.length === 0} className="gap-2">
                  <Trash2 className="h-4 w-4" /> Delete Template
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Template Name</label>
                  <Input 
                    value={templateData.name} 
                    onChange={e => setTemplateData({...templateData, name: e.target.value})} 
                    placeholder="e.g. Standard Invoice" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Default Currency</label>
                  <select 
                    value={templateData.defaultCurrency}
                    onChange={e => setTemplateData({...templateData, defaultCurrency: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD" className="bg-slate-900">USD ($)</option>
                    <option value="EUR" className="bg-slate-900">EUR (€)</option>
                    <option value="GBP" className="bg-slate-900">GBP (£)</option>
                    <option value="INR" className="bg-slate-900">INR (₹)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Section</CardTitle>
                <CardDescription>Introductory text appearing before the line items.</CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor 
                  value={templateData.topSection} 
                  onChange={(val) => setTemplateData({...templateData, topSection: val})} 
                />
              </CardContent>
            </Card>

            <Card className="border-primary/50 shadow-primary/5 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-primary">Dynamic Fields Builder</CardTitle>
                  <CardDescription>Define the input format (columns) for this client's invoices and quotes.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addColumn} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Field
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {templateData.columns.map((col, index) => (
                  <div key={col.id} className="flex flex-col gap-3 p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs text-slate-400">Field Label</label>
                        <Input 
                          value={col.label} 
                          onChange={e => updateColumn(col.id, "label", e.target.value)} 
                          placeholder="e.g. Quantity"
                        />
                      </div>
                      <div className="w-48 space-y-2">
                        <label className="text-xs text-slate-400">Value Type</label>
                        <select 
                          value={col.type}
                          onChange={e => updateColumn(col.id, "type", e.target.value as any)}
                          className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="text" className="bg-slate-900">Text</option>
                          <option value="number" className="bg-slate-900">Number</option>
                          <option value="calculated" className="bg-slate-900">Auto Calculated</option>
                        </select>
                      </div>
                      {(col.type === "number" || col.type === "calculated") && (
                        <div className="flex-none pt-9">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${col.isTotal ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}
                                 onClick={() => updateColumn(col.id, "isTotal", !col.isTotal)}>
                              {col.isTotal && <Save className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">Sum in Total</span>
                          </label>
                        </div>
                      )}
                      <div className="pt-8 ml-auto">
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => removeColumn(col.id)} disabled={templateData.columns.length <= 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {col.type === "calculated" && (
                      <div className="flex gap-2 items-center bg-primary/10 p-3 rounded border border-primary/20 mt-1">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-primary font-medium flex items-center gap-1">
                            Formula <HelpCircle className="h-3 w-3" />
                          </label>
                          <Input 
                            value={col.formula || ""} 
                            onChange={e => updateColumn(col.id, "formula", e.target.value)} 
                            placeholder="e.g. [Quantity] * [Rate]"
                            className="bg-black/40 border-primary/20 font-mono text-sm"
                          />
                        </div>
                        <div className="text-xs text-slate-400 max-w-xs mt-4">
                          Wrap field labels in brackets, e.g. <code className="bg-black/40 px-1 py-0.5 rounded text-primary">[Quantity] * [Rate]</code>. Supported operators: +, -, *, /
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bottom Section</CardTitle>
                <CardDescription>Terms, conditions, and payment details.</CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor 
                  value={templateData.bottomSection} 
                  onChange={(val) => setTemplateData({...templateData, bottomSection: val})} 
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-muted-foreground py-8">
            You don't have any clients to configure yet.
          </div>
        )}
      </div>
    </div>
  );
}
