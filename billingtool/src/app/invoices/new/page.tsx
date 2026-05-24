"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dbApi, Quotation, Invoice, Client, ColumnDef, TemplateDef, Project } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Receipt, Loader2, CheckSquare, Square, Plus, Trash2, ArrowLeft } from "lucide-react";
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



function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuotationId = searchParams.get("quotationId");
  const editId = searchParams.get("edit");
  const { activeCompany } = useCompany();

  const [mode, setMode] = useState<"linked" | "direct">(initialQuotationId ? "linked" : "direct");
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  // Track the partial amount selected for each row
  const [selectedItems, setSelectedItems] = useState<{id: string, amount: number}[]>([]);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [dynamicRows, setDynamicRows] = useState<Record<string, any>[]>([
    { id: "1" }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!activeCompany) return;
      try {
        const [qData, cData, pData, invListData] = await Promise.all([
          dbApi.getQuotations(activeCompany.id!),
          dbApi.getClients(activeCompany.id!),
          dbApi.getProjects(activeCompany.id!),
          dbApi.getInvoices(activeCompany.id!)
        ]) as [Quotation[], Client[], Project[], Invoice[]];

        setClients(cData);
        setProjects(pData);
        setAllInvoices(invListData);
        
        const allQuotes = qData as Quotation[];
        const availableQuotes = allQuotes.filter(q => {
          if (q.status === "draft") return false;
          // Keep the "has unbilled items" check to ensure we don't bill empty quotes
          if (q.dynamicRows) return q.dynamicRows.some(r => !r.isBilled);
          if (q.phases) return q.phases.some(p => !p.isBilled);
          return false;
        });
        setQuotations(availableQuotes);

        if (editId) {
          const inv = await dbApi.getInvoice(editId) as Invoice;
          if (inv) {
            setMode(inv.isIndependent ? "direct" : "linked");
            setSelectedProjectId(inv.projectId || "");
            setInvoiceNumber(inv.invoiceNumber);
            
            if (inv.isIndependent) {
              setSelectedClientId(inv.clientId);
              const client = (cData as Client[]).find(c => c.id === inv.clientId);
              if (client) {
                const templates = client.templates || [];
                if (templates.length > 0) {
                  setSelectedTemplateId(templates[0].id);
                  setColumns(templates[0].columns || defaultColumns);
                }
              }
              
              if (inv.dynamicRows && inv.dynamicRows.length > 0) {
                setDynamicRows(inv.dynamicRows);
              } else if (inv.lineItems) {
                setDynamicRows(inv.lineItems.map(li => ({
                  id: li.id,
                  col_desc: li.description,
                  col_qty: li.quantity,
                  col_rate: li.rate,
                  col_amount: li.amount
                })));
              }
            } else {
              const q = allQuotes.find(q => q.id === inv.quotationId);
              if (q) setSelectedQuotation(q);
              if (inv.linkedItems) {
                setSelectedItems(inv.linkedItems);
              } else if (inv.linkedPhases) {
                // Legacy support
                const legacyItems = inv.linkedPhases.map(id => {
                  let amt = 0;
                  if (q) {
                    const row = (q.dynamicRows || q.phases || []).find((r:any) => r.id === id);
                    if (row) {
                      if (row.amount !== undefined) amt = Number(row.amount) || 0;
                      else Object.values(row).forEach(v => { if (typeof v === 'number' && v > amt) amt = v; });
                    }
                  }
                  return { id, amount: amt };
                });
                setSelectedItems(legacyItems);
              }
            }
          }
        } else {
          // New Invoice
          const today = new Date().toLocaleDateString();
          const todayCount = (invListData as Invoice[]).filter(i => {
             const iDate = (i.createdAt as any)?.toMillis ? new Date((i.createdAt as any).toMillis()).toLocaleDateString() : new Date(i.date as any).toLocaleDateString();
             return iDate === today;
          }).length;

          if (cData.length > 0) {
            handleClientSelect((cData[0] as Client).id!, cData as Client[], todayCount);
          }
          if (initialQuotationId) {
            const q = availableQuotes.find(q => q.id === initialQuotationId);
            if (q) {
              const client = cData.find(c => c.id === q.clientId);
              let cols = defaultColumns;
              if (client && (client as Client).templates?.[0]) cols = (client as Client).templates![0].columns || defaultColumns;
              handleQuotationSelect(q, cData as Client[], todayCount, invListData as Invoice[], cols);
            }
          } else if (availableQuotes.length > 0 && mode === "linked") {
            const q = availableQuotes[0];
            const client = cData.find(c => c.id === q.clientId);
            let cols = defaultColumns;
            if (client && (client as Client).templates?.[0]) cols = (client as Client).templates![0].columns || defaultColumns;
            handleQuotationSelect(q, cData as Client[], todayCount, invListData as Invoice[], cols);
          }
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCompany, initialQuotationId, editId]);

  const handleClientSelect = (clientId: string, allClients: Client[] = clients, count = 0) => {
    setSelectedClientId(clientId);
    setSelectedProjectId("");
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;
    
    if (!editId) {
      setInvoiceNumber(generateRefNumber(activeCompany?.name || "", client.name, "INV", count));
    }

    if (!editId) {
      const templates = client.templates || [];
      if (templates.length > 0) {
        handleTemplateChange(templates[0].id, client);
      } else if ((client as any).template) {
        const legacyTpl = (client as any).template;
        setColumns(legacyTpl.columns || defaultColumns);
        setSelectedTemplateId("");
      } else {
        setColumns(defaultColumns);
        setSelectedTemplateId("");
      }
    }
  };

  const handleTemplateChange = (tplId: string, client?: Client) => {
    setSelectedTemplateId(tplId);
    if (editId) return; // Don't overwrite when editing
    
    const currentClient = client || clients.find(c => c.id === selectedClientId);
    if (!currentClient || !currentClient.templates) return;

    const tpl = currentClient.templates.find(t => t.id === tplId);
    if (tpl) {
      setColumns(tpl.columns || defaultColumns);
      if (tpl.defaultCurrency) setCurrency(tpl.defaultCurrency);
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

  const handleQuotationSelect = (q: Quotation, allClients: Client[] = clients, count = 0, invList: Invoice[] = allInvoices, cols: ColumnDef[] = columns) => {
    setSelectedQuotation(q);
    if (q.currency) setCurrency(q.currency);
    
    // Use provided columns or fallback to state
    const activeCols = cols.length > 0 ? cols : columns;
    const amtCol = activeCols.find(c => c.label.toLowerCase().includes("amount") || c.label.toLowerCase().includes("total")) || activeCols[activeCols.length - 1];

    const initialRows = (q.dynamicRows || q.phases || []).map((item: any) => {
      const row: any = { 
        id: item.id, 
        _isLinked: true,
        _originalId: item.id
      };

      // Exact copy: just pull everything from the quotation item into the row
      activeCols.forEach(col => {
        const colLabel = col.label.toLowerCase();
        const possibleKeys = [col.id, colLabel, colLabel.replace(' ', '_'), colLabel.replace(' ', '')];
        if (colLabel.includes('qty')) possibleKeys.push('quantity', 'qty');
        if (colLabel.includes('rate')) possibleKeys.push('rate', 'price', 'unit_cost');
        
        let rawVal: any = undefined;
        for (const key of possibleKeys) {
          if (item[key] !== undefined) {
            rawVal = item[key];
            break;
          }
        }

        if (col.type !== 'calculated') {
          row[col.id] = rawVal !== undefined ? rawVal : "";
        }
      });

      // Track max allowed (total row amount) for validation/tracking
      const totalAmtKey = amtCol.id;
      const qAmount = Number(item[totalAmtKey] || item.amount) || 0;
      row._maxRemaining = qAmount - (item.billedAmount || 0);

      // Trigger formula evaluation for calculated columns
      activeCols.filter(c => c.type === "calculated").forEach(calcCol => {
        row[calcCol.id] = evaluateFormula(calcCol.formula || "", activeCols, row);
      });

      return row;
    }).filter(Boolean);

    setDynamicRows(initialRows as any[]);
    
    // Auto-inherit project and template from Quotation
    if (q.projectId) setSelectedProjectId(q.projectId);
    if (q.templateId) handleTemplateChange(q.templateId);

    if (!editId) {
      const client = allClients.find(c => c.id === q.clientId);
      if (client) {
        setInvoiceNumber(generateRefNumber(activeCompany?.name || "", client.name, "INV", count));
      }
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
  const mainAmtCol = amountColumn || totalCols[0];
  
  // Uniform total calculation for both modes
  const totalAmount = dynamicRows.reduce((sum, row) => {
    if (totalCols.length > 0) {
      const rowSum = totalCols.reduce((acc, col) => acc + (Number(row[col.id]) || 0), 0);
      return sum + rowSum;
    }
    return sum + (Number(row[amountColumn!.id]) || 0);
  }, 0);
  const directTotalAmount = totalAmount; 
  const linkedTotalAmount = totalAmount;

  const updateLinkedItemAmount = (id: string, newAmount: number, maxAllowed: number) => {
    const val = Math.min(Math.max(0, newAmount), maxAllowed);
    setSelectedItems(items => items.map(i => i.id === id ? { ...i, amount: val } : i));
  };

  const handleSave = async () => {
    if (!activeCompany) return;
    
    if (mode === "linked" && selectedQuotation) {
      if (dynamicRows.length === 0) {
        alert("Please ensure the invoice has at least one item.");
        return;
      }

      // Check for over-billing
      const amtCol = columns.find(c => c.label.toLowerCase().includes("amount") || c.label.toLowerCase().includes("total")) || columns[columns.length - 1];
      
      // Calculate total for this quotation from all previous invoices (excluding current one if editing)
      const otherInvoices = allInvoices.filter(inv => inv.quotationId === selectedQuotation.id && inv.id !== editId);
      const totalAlreadyBilled = otherInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const currentInvoiceAmount = linkedTotalAmount;
      
      // Use the actual total amount saved on the quotation
      const quotationTotal = selectedQuotation.totalAmount;

      // Handle Free Mode (Unrestricted but must be full amount)
      if (selectedQuotation.billingMode === "free") {
        if (Math.abs(currentInvoiceAmount - quotationTotal) > 0.1) {
          alert(`In "Fixed Full Billing" mode, the invoice must be for the full quotation amount (${getCurrencySymbol(currency)} ${quotationTotal.toLocaleString()}).\n\nPlease reset the rows to match the quotation.`);
          return;
        }
        // No over-billing check needed for free mode since it's reusable
      } else {
        // Standard Split Mode over-billing check
        const newTotal = totalAlreadyBilled + currentInvoiceAmount;
        
        if (newTotal > quotationTotal + 0.01) { 
          const exceededBy = newTotal - quotationTotal;
          alert(`Warning: Total billing for this quotation (${newTotal.toLocaleString()}) would exceed the original quotation price (${quotationTotal.toLocaleString()}) by ${exceededBy.toLocaleString()}.\n\nPlease adjust the amounts before proceeding.`);
          return;
        }
      }
    } else if (mode === "linked" && !selectedQuotation) {
      alert("Please select a quotation first.");
      return;
    }

    if (mode === "direct" && (!selectedClientId || dynamicRows.length === 0)) {
      alert("Please select a client and ensure all rows are valid.");
      return;
    }

    setSaving(true);
    try {
      const amount = mode === "linked" ? linkedTotalAmount : directTotalAmount;
      const clientId = mode === "linked" ? selectedQuotation!.clientId : selectedClientId;

      const payload: any = {
        clientId,
        amount,
        currency: currency || "USD",
        isIndependent: mode === "direct",
        templateId: selectedTemplateId,
      };

      if (selectedProjectId) {
        payload.projectId = selectedProjectId;
      }

      if (mode === "linked" && selectedQuotation) {
        payload.quotationId = selectedQuotation.id!;
        // Link rows that came from the quotation back to their IDs
        payload.linkedItems = dynamicRows
          .filter(r => r._isLinked)
          .map(r => ({ 
            id: r._originalId, 
            amount: Number(r[mainAmtCol.id]) || 0 
          }));
        payload.linkedPhases = payload.linkedItems.map((i:any) => i.id);
        payload.dynamicRows = dynamicRows;
      } else {
        payload.dynamicRows = dynamicRows;
        payload.lineItems = dynamicRows.map(r => ({
          id: r.id,
          description: r[columns[0].id] || "",
          quantity: 1,
          rate: Number(r[mainAmtCol.id]) || 0,
          amount: Number(r[mainAmtCol.id]) || 0
        }));
      }

      if (editId) {
        await dbApi.updateInvoice(editId, payload);
      } else {
        const newInvoice: Invoice = {
          ...payload,
          companyId: activeCompany.id!,
          invoiceNumber: invoiceNumber || `INV-${Math.floor(Math.random() * 10000)}`,
          status: "draft",
          date: new Date().toISOString(),
          notes: "",
        };
        await dbApi.createInvoice(newInvoice);
      }
      router.push("/invoices");
    } catch (error) {
      
      alert(`Failed to ${editId ? 'update' : 'generate'} invoice.`);
      setSaving(false);
    }
  };

  const currentClient = clients.find(c => c.id === selectedClientId);
  const clientTemplates = currentClient?.templates || [];
  const clientProjects = projects.filter(p => p.clientId === selectedClientId);

  const getCurrencySymbol = (code: string = 'INR') => {
    const symbols: Record<string, string> = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
    return symbols[code] || code;
  };

  if (!activeCompany) return null;
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/invoices')} className="text-muted-foreground hover:text-white px-0 mb-4 h-auto">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            {editId ? "Edit Invoice" : "Generate Invoice"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Create an independent invoice or generate one from an existing project.
          </p>
        </div>
      </div>

      {!editId && (
        <div className="flex gap-4 p-1 bg-black/20 rounded-lg w-fit border border-white/5">
          <button
            onClick={() => setMode("direct")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "direct" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            Direct Invoice
          </button>
          <button
            onClick={() => setMode("linked")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "linked" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            From Quotation
          </button>
        </div>
      )}

      {mode === "linked" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>1. Select Quotation</CardTitle>
            </CardHeader>
            <CardContent>
              {quotations.length === 0 && !editId ? (
                <div className="text-sm text-muted-foreground text-center py-4">No available quotations.</div>
              ) : (
                <div className="space-y-4">
                  {editId && selectedQuotation && !quotations.find(q => q.id === selectedQuotation.id) && (
                    <div className="p-3 rounded-lg border border-primary bg-primary/10">
                      <div className="font-medium text-sm">{selectedQuotation.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{selectedQuotation.quotationNumber}</div>
                    </div>
                  )}
                  {quotations.map(q => (
                    <div 
                      key={q.id}
                      onClick={() => handleQuotationSelect(q)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedQuotation?.id === q.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="font-medium text-sm">{q.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{q.quotationNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2. Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedQuotation ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-400">Linked Quotation</span>
                        <span className="text-sm font-bold text-primary">{selectedQuotation.quotationNumber}</span>
                      </div>
                      <div className="text-lg font-bold text-white">{selectedQuotation.title}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {selectedQuotation.billingMode === "free" 
                          ? "This quotation is in 'Fixed Full Billing' mode. Invoices will always be generated for the full amount."
                          : "This quotation is in 'Split Billing' mode. You can adjust the amounts below to bill in milestones."
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Invoice #</label>
                        <Input 
                          value={invoiceNumber} 
                          onChange={e => setInvoiceNumber(e.target.value)} 
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Project (Optional)</label>
                        <select 
                          value={selectedProjectId}
                          onChange={e => setSelectedProjectId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="" className="bg-slate-900">None</option>
                          {clientProjects.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Select a quotation first to link it to the invoice.</div>
                )}
              </CardContent>
            </Card>

            {selectedQuotation && (
              <>
                <Card className="animate-in slide-in-from-bottom-4">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Invoice Lines</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleQuotationSelect(selectedQuotation!)} className="text-xs h-8">
                          Reset to Full Amount
                        </Button>
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

                      {dynamicRows.map((row) => (
                        <div key={row.id} className={`flex gap-4 items-start p-2 mb-2 rounded hover:bg-white/5 transition-colors ${row._isLinked ? 'border-l-2 border-primary/40 bg-primary/5' : ''}`}>
                          {columns.map(col => {
                            const isAmt = col.id === mainAmtCol.id;
                            return (
                              <div key={col.id} style={{ flex: col.type === 'text' ? 2 : 1 }}>
                                {col.type === 'calculated' ? (
                                  <div className="h-10 flex items-center px-3 font-medium text-primary bg-primary/5 rounded border border-primary/20">
                                    {getCurrencySymbol(currency)} {Number(row[col.id] || 0).toLocaleString()}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Input 
                                      type={col.type === 'number' ? 'number' : 'text'}
                                      value={row[col.id] || ""} 
                                      onChange={e => handleRowChange(row.id, col.id, e.target.value)} 
                                      className="bg-black/40"
                                      placeholder={isAmt && row._isLinked ? `Max: ${row._maxRemaining}` : ""}
                                      disabled={selectedQuotation?.billingMode === "free" && (isAmt || col.label.toLowerCase().includes("rate"))}
                                    />
                                    {isAmt && row._isLinked && selectedQuotation?.billingMode === "split" && (
                                      <div className="text-[10px] text-slate-500 pl-1">
                                        Quota Remaining: {row._maxRemaining}
                                      </div>
                                    )}
                                    {isAmt && row._isLinked && selectedQuotation?.billingMode === "free" && (
                                      <div className="text-[10px] text-primary/60 pl-1 italic">
                                        Fixed Full Amount
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="w-10 pt-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleRemoveRow(row.id)} 
                              disabled={dynamicRows.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-in slide-in-from-bottom-8">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400 uppercase tracking-wider">Previous Billing History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allInvoices.filter(i => i.quotationId === selectedQuotation.id).length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground italic">No previous invoices for this quotation.</div>
                    ) : (
                      <div className="rounded-md border border-white/5 overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                              <th className="px-4 py-2">Invoice #</th>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {allInvoices
                              .filter(i => i.quotationId === selectedQuotation.id)
                              .sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime())
                              .map(inv => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-2 font-medium text-slate-200">{inv.invoiceNumber}</td>
                                  <td className="px-4 py-2 text-slate-400">{new Date(inv.date as any).toLocaleDateString()}</td>
                                  <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-right font-bold text-white">
                                    {getCurrencySymbol(inv.currency || currency)} {inv.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="animate-in slide-in-from-left-4 duration-300">
            <CardHeader>
              <CardTitle>Direct Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Select Client</label>
                  <select 
                    value={selectedClientId}
                    onChange={e => handleClientSelect(e.target.value)}
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
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
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
                  <label className="text-sm font-medium text-slate-300">Invoice #</label>
                  <Input 
                    value={invoiceNumber} 
                    onChange={(e:any) => setInvoiceNumber(e.target.value)} 
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Currency</label>
                  <select 
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USD" className="bg-slate-900">USD ($)</option>
                    <option value="INR" className="bg-slate-900">INR (₹)</option>
                    <option value="EUR" className="bg-slate-900">EUR (€)</option>
                    <option value="GBP" className="bg-slate-900">GBP (£)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-bottom-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoice Lines</CardTitle>
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

                {dynamicRows.map((row) => (
                  <div key={row.id} className="flex gap-4 items-start p-2 mb-2 rounded hover:bg-white/5 transition-colors">
                    {columns.map(col => (
                      <div key={col.id} style={{ flex: col.type === 'text' ? 2 : 1 }}>
                        {col.type === 'calculated' ? (
                          <div className="h-10 flex items-center px-3 font-medium text-primary bg-primary/5 rounded border border-primary/20">
                            {getCurrencySymbol(currency)} {Number(row[col.id] || 0).toLocaleString()}
                          </div>
                        ) : (
                          <Input 
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={row[col.id] || ""} 
                            onChange={e => handleRowChange(row.id, col.id, e.target.value)} 
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
                        disabled={dynamicRows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-end justify-between pt-6 border-t border-white/10 mt-6">
        <div>
          <div className="text-slate-400 mb-1">Invoice Total</div>
          <div className="text-3xl font-bold text-primary">
            {getCurrencySymbol(currency)} {(mode === "linked" ? linkedTotalAmount : directTotalAmount).toLocaleString()}
          </div>
        </div>
        <Button size="lg" onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editId ? "Update Invoice" : "Generate Invoice"}
        </Button>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>}>
      <InvoiceForm />
    </Suspense>
  );
}
