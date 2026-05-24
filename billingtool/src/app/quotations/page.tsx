"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dbApi, Quotation, Client } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileCheck2, Plus, Loader2, ArrowRight, Trash2, Pencil, CheckCircle, Eye, Mail } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";

export default function QuotationsPage() {
  const { activeCompany } = useCompany();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showMailModal, setShowMailModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadData = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [qData, cData, iData] = await Promise.all([
        dbApi.getQuotations(activeCompany.id!),
        dbApi.getClients(activeCompany.id!),
        dbApi.getInvoices(activeCompany.id!)
      ]);
      setQuotations(qData as Quotation[]);
      setInvoices(iData as Invoice[]);
      
      const clientMap: Record<string, Client> = {};
      (cData as Client[]).forEach(c => {
        if (c.id) clientMap[c.id] = c;
      });
      setClients(clientMap);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  const handleDelete = async (id: string) => {
    const hasInvoices = invoices.some(inv => inv.quotationId === id);
    if (hasInvoices) {
      alert("Cannot delete quotation because it has linked invoices. Delete the invoices first.");
      return;
    }

    const confirm = window.confirm("Are you sure you want to delete this quotation? This cannot be undone.");
    if (!confirm) return;

    try {
      await dbApi.deleteQuotation(id);
      await loadData();
    } catch (error) {
      alert("Failed to delete quotation");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Quotation["status"]) => {
    try {
      await dbApi.updateQuotation(id, { status: newStatus });
      await loadData();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const openMailModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowMailModal(true);
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please create or select a company first.</div>;
  }

  if (loading && quotations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Quotations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your project estimates. Emails are sent manually.
          </p>
        </div>
        <Link href="/quotations/new" className="w-full sm:w-auto">
          <Button className="gap-2 w-full">
            <Plus className="h-4 w-4" /> Create Quotation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotations.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
            No quotations found. Create one to get started.
          </div>
        )}

        {quotations.map(quote => (
          <Card key={quote.id} className="hover:border-white/20 transition-all duration-300 group flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                  {quote.quotationNumber}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openMailModal(quote)} className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded" title="Mail Quotation">
                    <Mail className="h-3 w-3" />
                  </button>
                  <Link href={`/quotations/${quote.id}`}>
                    <button className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded">
                      <Eye className="h-3 w-3" />
                    </button>
                  </Link>
                  <Link href={`/quotations/new?edit=${quote.id}`}>
                    <button className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </Link>
                  <button onClick={() => handleDelete(quote.id!)} className="p-1 text-red-400 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-1">{quote.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm flex-1 flex flex-col">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                  quote.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  quote.status === 'accepted' ? 'bg-indigo-500/20 text-indigo-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {quote.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-slate-400">
                Client: <span className="text-slate-200 font-medium">{clients[quote.clientId]?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4 flex-1">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Total Value</div>
                  <div className="text-xl font-bold text-white">
                    {quote.currency} {quote.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs mb-1">Phases</div>
                  <div className="font-medium text-slate-300">
                    {quote.phases?.filter(p => p.isBilled).length || 0} / {quote.phases?.length || 0} Billed
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => openMailModal(quote)}>
                  <Mail className="h-3 w-3" /> Mail
                </Button>
                {quote.status === "draft" && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleStatusUpdate(quote.id!, "accepted")}>
                    Mark Accepted
                  </Button>
                )}
                {quote.status === "accepted" && (
                  <div className="flex gap-2 w-full">
                    <Link href={`/invoices/new?quotationId=${quote.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-2 text-xs">
                        Invoice <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white" onClick={() => handleStatusUpdate(quote.id!, "draft")}>
                      Revert
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedQuotation && (
        <EmailModal 
          isOpen={showMailModal}
          onClose={() => setShowMailModal(false)}
          type="QT"
          document={selectedQuotation}
          company={activeCompany}
          client={clients[selectedQuotation.clientId]}
        />
      )}
    </div>
  );
}
