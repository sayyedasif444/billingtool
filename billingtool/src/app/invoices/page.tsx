"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { dbApi, Invoice, Client } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Receipt, Plus, Loader2, Trash2, Pencil, Eye, Mail } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";

export default function InvoicesPage() {
  const { activeCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showMailModal, setShowMailModal] = useState(false);

  const loadData = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [iData, cData] = await Promise.all([
        dbApi.getInvoices(activeCompany.id!),
        dbApi.getClients(activeCompany.id!)
      ]);
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
    const confirm = window.confirm("Are you sure you want to delete this invoice? This cannot be undone.");
    if (!confirm) return;

    try {
      await dbApi.deleteInvoice(id);
      await loadData();
    } catch (error) {
      alert("Failed to delete invoice");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Invoice["status"]) => {
    try {
      await dbApi.updateInvoice(id, { status: newStatus });
      await loadData();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const openMailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowMailModal(true);
  };

  if (!activeCompany) {
    return <div className="p-8 text-center text-muted-foreground">Please create or select a company first.</div>;
  }

  if (loading && invoices.length === 0) {
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
            <Receipt className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Generate and track invoices. Emails are sent manually.
          </p>
        </div>
        <Link href="/invoices/new" className="w-full sm:w-auto">
          <Button className="gap-2 w-full">
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
            No invoices found. Create one directly or from a Quotation.
          </div>
        )}

        {invoices.map(invoice => (
          <Card key={invoice.id} className="hover:border-white/20 transition-all duration-300 group flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                  {invoice.invoiceNumber}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openMailModal(invoice)} className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded" title="Mail Invoice">
                      <Mail className="h-3 w-3" />
                    </button>
                    <Link href={`/invoices/${invoice.id}`}>
                      <button className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded">
                        <Eye className="h-3 w-3" />
                      </button>
                    </Link>
                    <Link href={`/invoices/new?edit=${invoice.id}`}>
                      <button className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </Link>
                    <button onClick={() => handleDelete(invoice.id!)} className="p-1 text-red-400 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg">
                Amount: {(() => {
                  const symbols: Record<string, string> = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
                  return symbols[invoice.currency || 'USD'] || invoice.currency || '$';
                })()} {invoice.amount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm flex-1 flex flex-col">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                  invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                  invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <div className="text-slate-400">
                Client: <span className="text-slate-200 font-medium">{clients[invoice.clientId]?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4 flex-1">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Type</div>
                  <div className="font-medium text-slate-300">
                    {invoice.isIndependent ? 'Direct' : 'Quotation Linked'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => openMailModal(invoice)}>
                  <Mail className="h-3 w-3" /> Mail
                </Button>
                {invoice.status === "draft" && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleStatusUpdate(invoice.id!, "sent")}>
                    Mark Sent
                  </Button>
                )}
                {invoice.status === "sent" && (
                  <Button variant="secondary" size="sm" className="w-full text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" onClick={() => handleStatusUpdate(invoice.id!, "paid")}>
                    Mark Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedInvoice && (
        <EmailModal 
          isOpen={showMailModal}
          onClose={() => setShowMailModal(false)}
          type="INV"
          document={selectedInvoice}
          company={activeCompany}
          client={clients[selectedInvoice.clientId]}
        />
      )}
    </div>
  );
}
