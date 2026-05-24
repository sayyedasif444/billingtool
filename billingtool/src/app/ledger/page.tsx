"use client";

import { useState, useEffect } from "react";
import { dbApi, Client, Quotation, Invoice, Project, Expense } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Loader2, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  FileCheck2, 
  Receipt, 
  Users, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  LayoutGrid,
  List,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LedgerPage() {
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    clients: Client[];
    projects: Project[];
    quotations: Quotation[];
    invoices: Invoice[];
    expenses: Expense[];
  }>({ clients: [], projects: [], quotations: [], invoices: [], expenses: [] });
  
  const [viewMode, setViewMode] = useState<"client" | "project">("client");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadAllData() {
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
        setData({ 
          clients: cData as Client[], 
          projects: pData as Project[],
          quotations: qData as Quotation[], 
          invoices: iData as Invoice[],
          expenses: eData as Expense[]
        });
        
        // Auto-expand first few items
        if (cData.length > 0) setExpandedClients({ [(cData[0] as any).id]: true });
        if (pData.length > 0) setExpandedProjects({ [(pData[0] as any).id]: true });
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, [activeCompany]);

  const toggleClient = (id: string) => {
    setExpandedClients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleQuote = (id: string) => {
    setExpandedQuotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInvoiceStatusUpdate = async (id: string, status: 'sent' | 'paid') => {
    try {
      await dbApi.updateInvoice(id, { status });
      // Refresh data
      const iData = await dbApi.getInvoices(activeCompany!.id!);
      setData(prev => ({ ...prev, invoices: iData as Invoice[] }));
    } catch (e) {
      alert("Failed to update invoice status");
    }
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please select a company first.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredClients = data.clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getCurrencySymbol = (code: string = 'INR') => {
    const symbols: Record<string, string> = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
    return symbols[code] || code;
  };

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Filter className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Freelancer Pro Ledger
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            A unified view of all financial data, grouped by client and project.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg border border-white/10 w-full md:w-auto">
          <Button 
            variant={viewMode === 'client' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="text-xs h-8 flex-1"
            onClick={() => setViewMode('client')}
          >
            <Users className="h-3 w-3 mr-2" /> Client Wise
          </Button>
          <Button 
            variant={viewMode === 'project' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="text-xs h-8"
            onClick={() => setViewMode('project')}
          >
            <Briefcase className="h-3 w-3 mr-2" /> Project Wise
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full sm:w-48 h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="all" className="bg-slate-900">All Clients</option>
            {data.clients.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
            ))}
          </select>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder={viewMode === 'client' ? "Search..." : "Search projects..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {viewMode === 'client' ? filteredClients
          .filter(c => selectedClientId === "all" || c.id === selectedClientId)
          .map(client => {
          const clientQuotes = data.quotations.filter(q => q.clientId === client.id);
          const clientDirectInvoices = data.invoices.filter(i => i.clientId === client.id && i.isIndependent);
          const isExpanded = expandedClients[client.id!];
          
          return (
            <div key={client.id} className="group border border-white/5 rounded-xl bg-white/5 overflow-hidden transition-all duration-300">
              <div 
                onClick={() => toggleClient(client.id!)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors">{client.name}</h3>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block border-r border-white/5 pr-8">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Earnings</div>
                    <div className="text-sm font-bold text-emerald-400">
                      ₹{data.invoices
                        .filter(i => i.clientId === client.id && i.status === 'paid')
                        .reduce((sum, i) => sum + i.amount, 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block border-r border-white/5 pr-8">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Expenses</div>
                    <div className="text-sm font-bold text-red-400">
                      ₹{data.expenses
                        .filter(e => e.clientId === client.id)
                        .reduce((sum, e) => sum + Number(e.amount), 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-bold">Net Profit</div>
                    <div className="text-sm font-bold text-primary flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ₹{(
                        data.invoices
                          .filter(i => i.clientId === client.id && i.status === 'paid')
                          .reduce((sum, i) => sum + i.amount, 0) -
                        data.expenses
                          .filter(e => e.clientId === client.id)
                          .reduce((sum, e) => sum + Number(e.amount), 0)
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Quotations</div>
                    <div className="text-sm font-bold text-white">{clientQuotes.length}</div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                  {/* Quotations Section */}
                  <div className="mt-4 space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                      <FileCheck2 className="h-3 w-3" /> Quotations & Linked Invoices
                    </div>
                    
                    {clientQuotes.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic px-2 py-2">No quotations found for this client.</div>
                    ) : (
                      <div className="space-y-3">
                        {clientQuotes.map(quote => renderQuotationItem(quote))}
                      </div>
                    )}
                  </div>

                  {/* Direct Invoices Section */}
                  <div className="mt-8 space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                      <Receipt className="h-3 w-3" /> Direct Invoices (No Quotation)
                    </div>
                    
                    {clientDirectInvoices.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic px-2 py-2">No independent invoices for this client.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2">
                        {clientDirectInvoices.map(inv => renderInvoiceCard(inv))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          /* Project Wise View */
          <>
            {data.projects
              .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
              .filter(p => selectedClientId === "all" || p.clientId === selectedClientId)
              .map(project => {
                const projectQuotes = data.quotations.filter(q => q.projectId === project.id);
                const projectInvoices = data.invoices.filter(i => i.projectId === project.id);
                const isExpanded = expandedProjects[project.id!];
                const client = data.clients.find(c => c.id === project.clientId);

                return (
                  <div key={project.id} className="group border border-white/5 rounded-xl bg-white/5 overflow-hidden transition-all duration-300">
                    <div 
                      onClick={() => toggleProject(project.id!)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                          <p className="text-xs text-muted-foreground">Client: {client?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block border-r border-white/5 pr-8">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Earnings</div>
                          <div className="text-sm font-bold text-emerald-400">
                            ₹{projectInvoices
                              .filter(i => i.status === 'paid')
                              .reduce((sum, i) => sum + i.amount, 0)
                              .toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right hidden sm:block border-r border-white/5 pr-8">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Expenses</div>
                          <div className="text-sm font-bold text-red-400">
                            ₹{data.expenses
                              .filter(e => e.projectId === project.id)
                              .reduce((sum, e) => sum + Number(e.amount), 0)
                              .toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-bold">Net Profit</div>
                          <div className="text-sm font-bold text-primary flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            ₹{(
                              projectInvoices
                                .filter(i => i.status === 'paid')
                                .reduce((sum, i) => sum + i.amount, 0) -
                              data.expenses
                                .filter(e => e.projectId === project.id)
                                .reduce((sum, e) => sum + Number(e.amount), 0)
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Quotations</div>
                          <div className="text-sm font-bold text-white">{projectQuotes.length}</div>
                        </div>
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                        <div className="mt-4 space-y-6">
                          {/* Project Quotations */}
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                              <FileCheck2 className="h-3 w-3" /> Project Quotations
                            </div>
                            {projectQuotes.length === 0 ? (
                              <div className="text-sm text-muted-foreground italic px-2">No quotations linked to this project.</div>
                            ) : (
                              projectQuotes.map(quote => renderQuotationItem(quote))
                            )}
                          </div>

                          {/* Independent Project Invoices (not linked to a project quote but linked to project) */}
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                              <Receipt className="h-3 w-3" /> Independent Project Invoices
                            </div>
                            {projectInvoices.filter(i => !i.quotationId).length === 0 ? (
                              <div className="text-sm text-muted-foreground italic px-2">No independent invoices for this project.</div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2">
                                {projectInvoices.filter(i => !i.quotationId).map(inv => renderInvoiceCard(inv))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Unassigned Section */}
            {(data.quotations.some(q => !q.projectId) || data.invoices.some(i => !i.projectId)) && (
              <div className="mt-12 space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                  Unassigned Items (No Project)
                </div>
                <div className="space-y-6 px-4">
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Unassigned Quotations</div>
                    {data.quotations.filter(q => !q.projectId).map(quote => renderQuotationItem(quote))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Unassigned Direct Invoices</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data.invoices.filter(i => !i.projectId && i.isIndependent).map(inv => renderInvoiceCard(inv))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Helper renderers to keep code clean
  function renderQuotationItem(quote: Quotation) {
    const quoteInvoices = data.invoices.filter(i => i.quotationId === quote.id && i.status === 'paid');
    const totalBilled = quoteInvoices.reduce((sum, i) => sum + i.amount, 0);
    const balance = quote.totalAmount - totalBilled;
    const isQuoteExpanded = expandedQuotes[quote.id!];
    
    return (
      <div key={quote.id} className="border border-white/5 bg-black/20 rounded-lg overflow-hidden">
        <div 
          onClick={() => toggleQuote(quote.id!)}
          className="p-3 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{quote.title}</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">{quote.quotationNumber}</div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Total Value</div>
              <div className="text-sm font-bold text-white">{getCurrencySymbol(quote.currency)} {quote.totalAmount.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Billed</div>
              <div className="text-sm font-bold text-emerald-400">{getCurrencySymbol(quote.currency)} {totalBilled.toLocaleString()}</div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Balance</div>
              <div className={cn("text-sm font-bold", balance > 0 ? "text-amber-400" : "text-slate-400")}>
                {getCurrencySymbol(quote.currency)} {balance.toLocaleString()}
              </div>
            </div>
            {isQuoteExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {isQuoteExpanded && (
          <div className="px-3 pb-4 space-y-6 animate-in slide-in-from-top-1 duration-200">
            {/* Breakdown Items */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Item Breakdown</div>
              <div className="bg-white/5 rounded-md overflow-hidden border border-white/5 overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[500px]">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Description</th>
                      <th className="px-4 py-2 text-right font-medium">Original Amount</th>
                      <th className="px-4 py-2 text-right font-medium">Billed to Date</th>
                      <th className="px-4 py-2 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(quote.dynamicRows || []).map((row, idx) => {
                      const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc')) || Object.keys(row)[0];
                      const amtKey = Object.keys(row).find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('total')) || Object.keys(row)[Object.keys(row).length-1];
                      const total = Number((row as any)[amtKey]) || 0;
                      const billed = Number(row.billedAmount) || 0;
                      const isFullyBilled = billed >= total - 0.01;
                      
                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-2 text-slate-300">{(row as any)[descKey] || 'Untitled Item'}</td>
                          <td className="px-4 py-2 text-right text-slate-400">{getCurrencySymbol(quote.currency)} {total.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-emerald-400/80 font-medium">{getCurrencySymbol(quote.currency)} {billed.toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">
                            {isFullyBilled ? 
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> FULLY BILLED</span> :
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20"><Clock className="h-3 w-3" /> PENDING</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Linked Invoices List */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Invoices Generated</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {quoteInvoices.length === 0 ? (
                  <div className="col-span-full text-xs text-muted-foreground italic py-2">No invoices generated yet.</div>
                ) : (
                  quoteInvoices.map(inv => renderInvoiceCard(inv))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderInvoiceCard(inv: Invoice) {
    return (
      <Link key={inv.id} href={`/invoices/${inv.id}`}>
        <div className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all group/inv">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-mono text-muted-foreground group-hover/inv:text-primary transition-colors">{inv.invoiceNumber}</div>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase", 
              inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'
            )}>
              {inv.status}
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="text-sm font-bold text-white">{getCurrencySymbol(inv.currency)} {inv.amount.toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-[10px] text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</div>
              {inv.status !== 'paid' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-[10px] px-2 py-0 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInvoiceStatusUpdate(inv.id!, 'paid');
                  }}
                >
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }
}
