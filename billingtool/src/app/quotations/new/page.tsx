"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dbApi, Client, Quotation, ColumnDef, TemplateDef, Project } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Plus, Loader2, Trash2, FileCheck2, ArrowLeft, Settings2 } from "lucide-react";
import { generateRefNumber } from "@/lib/utils/numbering";

const defaultColumns: ColumnDef[] = [
  { id: "col_desc", label: "Description", type: "text" },
  { id: "col_qty", label: "Quantity", type: "number" },
  { id: "col_rate", label: "Rate", type: "number" },
  { id: "col_amount", label: "Amount", type: "calculated", formula: "[Quantity] * [Rate]" }
];

const evaluateFormula = (formula: string, columns: ColumnDef[], row: any) => {
  if (!formula) return 0;
  try {
    let mathStr = formula;
    columns.forEach(col => {
      const escapedLabel = col.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedLabel}\\]`, 'g');
      const val = Number(row[col.id]) || 0;
      mathStr = mathStr.replace(regex, val.toString());
    });
    return Function(`'use strict'; return (${mathStr})`)() || 0;
  } catch (e) {
    return 0;
  }
};


function QuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { activeCompany } = useCompany();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    title: "",
    quotationNumber: "",
    currency: "INR",
    notes: "",
    templateId: "",
    topSection: "",
    bottomSection: "",
    billingMode: "split" as "split" | "free"
  });

  const [dynamicRows, setDynamicRows] = useState<Record<string, any>[]>([
    { id: "1" }
  ]);

  useEffect(() => {
    async function loadData() {
      if (!activeCompany) return;
      try {
        const [cData, pData, qListData] = await Promise.all([
          dbApi.getClients(activeCompany.id!),
          dbApi.getProjects(activeCompany.id!),
          dbApi.getQuotations(activeCompany.id!)
        ]) as [Client[], Project[], Quotation[]];
        
        setClients(cData);
        setProjects(pData);
        
        if (editId) {
          const qData = await dbApi.getQuotation(editId) as Quotation;
          if (qData) {
            setFormData({
              clientId: qData.clientId,
              projectId: qData.projectId || "",
              title: qData.title,
              quotationNumber: qData.quotationNumber,
              currency: qData.currency,
              notes: qData.notes || "",
              templateId: qData.templateId || "",
              topSection: qData.topSection || "",
              bottomSection: qData.bottomSection || "",
              billingMode: qData.billingMode || "split"
            });
            const client = (cData as Client[]).find(c => c.id === qData.clientId);
            if (client) {
              const templates = client.templates || [];
              if (templates.length > 0) {
                setSelectedTemplateId(templates[0].id);
                setColumns(templates[0].columns || defaultColumns);
              }
            }
            
            if (qData.dynamicRows && qData.dynamicRows.length > 0) {
              setDynamicRows(qData.dynamicRows);
            } else if (qData.phases) {
              setDynamicRows(qData.phases.map(p => ({
                id: p.id,
                col_desc: p.name,
                col_qty: 1,
                col_rate: p.amount,
                col_amount: p.amount
              })));
            }
          }
        } else if (cData.length > 0) {
          // Calculate today's count for this company
          const today = new Date().toLocaleDateString();
          const todayCount = (qListData as Quotation[]).filter(q => {
             const qDate = (q.createdAt as any)?.toMillis ? new Date((q.createdAt as any).toMillis()).toLocaleDateString() : new Date(q.date as any).toLocaleDateString();
             return qDate === today;
          }).length;

          handleClientChange((cData[0] as Client).id!, cData as Client[], todayCount);
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCompany, editId]);

  const handleClientChange = (clientId: string, allClients = clients, count = 0) => {
    const client = allClients.find(c => c.id === clientId);
    if (!client) {
      setFormData(prev => ({ ...prev, clientId, projectId: "" }));
      return;
    }

    setFormData(prev => ({ 
      ...prev, 
      clientId, 
      projectId: "",
      ...(!editId && { quotationNumber: generateRefNumber(activeCompany?.name || "", client.name, "QT", count) })
    }));
    
    if (!editId) {
      const templates = client.templates || [];
      if (templates.length > 0) {
        handleTemplateChange(templates[0].id, client);
      } else if ((client as any).template) {
        const legacyTpl = (client as any).template;
        setFormData(prev => ({
          ...prev,
          currency: legacyTpl.defaultCurrency || "INR",
          topSection: legacyTpl.topSection || "",
          bottomSection: legacyTpl.bottomSection || ""
        }));
        setColumns(legacyTpl.columns || defaultColumns);
        setSelectedTemplateId("");
      } else {
        setColumns(defaultColumns);
      }
    }
  };

  const handleAddColumn = () => {
    const newCol: ColumnDef = {
      id: `col_${Math.random().toString(36).substring(7)}`,
      label: "New Column",
      type: "text"
    };
    setColumns([...columns, newCol]);
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter(c => c.id !== colId));
  };

  const handleColumnLabelChange = (colId: string, newLabel: string) => {
    setColumns(columns.map(c => c.id === colId ? { ...c, label: newLabel } : c));
  };

  const handleTemplateChange = (tplId: string, client?: Client) => {
    setSelectedTemplateId(tplId);
    
    const currentClient = client || clients.find(c => c.id === formData.clientId);
    if (!currentClient || !currentClient.templates) return;

    const tpl = currentClient.templates.find(t => t.id === tplId);
    if (tpl) {
      setFormData(prev => ({
        ...prev,
        templateId: tplId,
        currency: tpl.defaultCurrency ?? prev.currency,
        topSection: tpl.topSection ?? "",
        bottomSection: tpl.bottomSection ?? ""
      }));
      setColumns(tpl.columns || defaultColumns);
    }
  };

  const handleAddRow = () => {
    setDynamicRows([...dynamicRows, { id: Date.now().toString() }]);
  };

  const handleRemoveRow = (id: string) => {
    if (dynamicRows.length > 1) {
      setDynamicRows(dynamicRows.filter(r => r.id !== id));
    }
  };

  const handleRowChange = (id: string, fieldId: string, value: any) => {
    setDynamicRows(rows => rows.map(row => {
      if (row.id !== id) return row;
      const newRow = { ...row, [fieldId]: value };
      
      columns.filter(c => c.type === "calculated").forEach(calcCol => {
        newRow[calcCol.id] = evaluateFormula(calcCol.formula || "", columns, newRow);
      });
      
      return newRow;
    }));
  };

  const totalCols = columns.filter(c => c.isTotal);
  const amountColumn = totalCols.length > 0 ? null : (columns.find(c => c.label.toLowerCase().includes("amount") || c.label.toLowerCase().includes("total")) || columns[columns.length - 1]);
  
  const totalAmount = dynamicRows.reduce((sum, row) => {
    if (totalCols.length > 0) {
      const rowSum = totalCols.reduce((acc, col) => acc + (Number(row[col.id]) || 0), 0);
      return sum + rowSum;
    }
    const colId = amountColumn?.id || (columns.length > 0 ? columns[columns.length - 1].id : "");
    return sum + (Number(row[colId]) || 0);
  }, 0);

  const handleSave = async () => {
    if (!formData.clientId || !formData.title) {
      alert("Please fill all required fields.");
      return;
    }
    if (!activeCompany) return;

    setSaving(true);
    try {
      const payload: any = {
        clientId: formData.clientId,
        title: formData.title,
        quotationNumber: formData.quotationNumber,
        totalAmount,
        currency: formData.currency,
        dynamicRows,
        columns, // Save columns
        notes: formData.notes,
        templateId: selectedTemplateId,
        topSection: formData.topSection,
        bottomSection: formData.bottomSection,
        billingMode: formData.billingMode
      };

      if (formData.projectId) {
        payload.projectId = formData.projectId;
      }

      if (editId) {
        await dbApi.updateQuotation(editId, payload);
      } else {
        const newQuote: Quotation = {
          ...payload,
          companyId: activeCompany.id!,
          status: "draft",
          date: new Date().toISOString(),
          phases: dynamicRows.map(r => {
            // Find a suitable amount for the legacy 'phases' field
            let phaseAmount = 0;
            if (amountColumn) {
              phaseAmount = Number(r[amountColumn.id]) || 0;
            } else if (totalCols.length > 0) {
              // Fallback to first total column if amountColumn is null
              phaseAmount = Number(r[totalCols[0].id]) || 0;
            }

            return {
              id: r.id,
              name: String(r[columns[0].id] || "Unnamed Phase"),
              amount: phaseAmount,
              isBilled: r.isBilled || false
            };
          })
        };
        await dbApi.createQuotation(newQuote);
      }
      router.push("/quotations");
    } catch (error) {
      console.error("Error saving quotation:", error);
      alert(`Failed to ${editId ? 'update' : 'save'} quotation. Check console for details.`);
      setSaving(false);
    }
  };

  const currentClient = clients.find(c => c.id === formData.clientId);
  const clientTemplates = currentClient?.templates || [];
  const clientProjects = projects.filter(p => p.clientId === formData.clientId);

  if (!activeCompany) return null;
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/quotations')} className="text-muted-foreground hover:text-white px-0 mb-4 h-auto">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotations
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="h-8 w-8 text-primary" />
            {editId ? "Edit Quotation" : "New Quotation"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Build your estimate using the dynamic template.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Client</label>
                <select 
                  value={formData.clientId}
                  onChange={e => handleClientChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project (Optional)</label>
                <select 
                  value={formData.projectId}
                  onChange={e => setFormData({...formData, projectId: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" className="bg-slate-900">None</option>
                  {clientProjects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                  ))}
                </select>
              </div>

              {clientTemplates.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Template Layout</label>
                  <select 
                    value={selectedTemplateId}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {clientTemplates.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Title</label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Website Redesign" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Quotation #</label>
                <Input 
                  value={formData.quotationNumber} 
                  onChange={e => setFormData({...formData, quotationNumber: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Currency</label>
                <select 
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD" className="bg-slate-900">USD ($)</option>
                  <option value="EUR" className="bg-slate-900">EUR (€)</option>
                  <option value="GBP" className="bg-slate-900">GBP (£)</option>
                  <option value="INR" className="bg-slate-900">INR (₹)</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Billing Mode</label>
                <div className="flex gap-4 p-1 bg-black/20 rounded-lg w-full border border-white/5">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, billingMode: "split"})}
                    className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${formData.billingMode === "split" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Split Billing (Milestones)
                    </div>
                    <span className="text-[10px] opacity-70">Split quotation into multiple partial invoices</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, billingMode: "free"})}
                    className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${formData.billingMode === "free" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4" />
                      Fixed Full Billing (Reusable)
                    </div>
                    <span className="text-[10px] opacity-70">Generate unlimited full-amount invoices</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Top Section (Header Text)
                </label>
                <RichTextEditor 
                  value={formData.topSection}
                  onChange={(val) => setFormData(prev => ({ ...prev, topSection: val }))}
                  placeholder="Enter header text, terms, or introduction..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Bottom Section (Footer Text)
                </label>
                <RichTextEditor 
                  value={formData.bottomSection}
                  onChange={(val) => setFormData(prev => ({ ...prev, bottomSection: val }))}
                  placeholder="Enter footer text, signature, or closing remarks..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        <Card className="animate-in slide-in-from-bottom-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quotation Lines</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAddColumn} className="gap-1 h-8 text-xs">
                  <Plus className="h-3 w-3" /> Add Column
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddRow} className="gap-1 h-8 text-xs">
                  <Plus className="h-3 w-3" /> Add Row
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-w-[600px] overflow-x-auto">
              {/* Header */}
              <div className="flex gap-4 px-4 pb-2 border-b border-white/10 mb-4">
                {columns.map(col => (
                  <div key={col.id} className="group relative" style={{ flex: col.type === 'text' ? 2 : 1 }}>
                    <div className="flex items-center gap-1">
                      <input 
                        className="text-xs font-semibold text-slate-400 bg-transparent border-none focus:ring-0 w-full p-0"
                        value={col.label}
                        onChange={(e) => handleColumnLabelChange(col.id, e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-400"
                        onClick={() => handleRemoveColumn(col.id)}
                      >
                        <Trash2 className="h-2 w-2" />
                      </Button>
                    </div>
                    {col.type === 'calculated' && <div className="text-[10px] text-primary/60">Formula Auto</div>}
                  </div>
                ))}
                <div className="w-10"></div>
              </div>

            {/* Rows */}
            {dynamicRows.map((row, index) => (
              <div key={row.id} className={`flex gap-4 items-start p-2 mb-2 rounded hover:bg-white/5 transition-colors ${row.isBilled ? 'opacity-50' : ''}`}>
                {columns.map(col => (
                  <div key={col.id} style={{ flex: col.type === 'text' ? 2 : 1 }}>
                    {col.type === 'calculated' ? (
                      <div className="h-10 flex items-center px-3 font-medium text-primary bg-primary/5 rounded border border-primary/20">
                        {formData.currency} {Number(row[col.id] || 0).toLocaleString()}
                      </div>
                    ) : (
                      <Input 
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={row[col.id] || ""} 
                        onChange={e => handleRowChange(row.id, col.id, e.target.value)} 
                        disabled={row.isBilled}
                        className="bg-black/40"
                      />
                    )}
                  </div>
                ))}
                <div className="w-10 pt-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleRemoveRow(row.id)} 
                    disabled={dynamicRows.length === 1 || row.isBilled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
            <div>
              <div className="text-slate-400 mb-1">Total Estimated Value</div>
              <div className="text-3xl font-bold text-primary">
                {formData.currency} {totalAmount.toLocaleString()}
              </div>
            </div>
            <Button size="lg" onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editId ? "Update Quotation" : "Save Quotation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>}>
      <QuotationForm />
    </Suspense>
  );
}
