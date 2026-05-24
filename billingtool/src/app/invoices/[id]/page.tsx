"use client";

import { useEffect, useState, use } from "react";
import { dbApi, Invoice, Client, Company, Quotation } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { DocumentViewer } from "@/components/DocumentViewer";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { activeCompany } = useCompany();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [payments, setPayments] = useState<Invoice[]>([]);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const searchParams = new URLSearchParams(window.location.search);
      const isPdfBypass = searchParams.get("pdf_secret") === process.env.NEXT_PUBLIC_PDF_SECRET;

      if (!activeCompany && !isPdfBypass) return;

      try {
        const doc = await dbApi.getInvoice(resolvedParams.id) as Invoice;
        if (doc) {
          const iData = doc as Invoice;
          setInvoice(iData);
          document.title = `Invoice_${iData.invoiceNumber}`;
          
          // Fetch client
          const cData = await dbApi.getClient(doc.clientId);
          setClient(cData as Client);

          // Fetch company (priority to activeCompany, fallback to doc.companyId)
          if (activeCompany) {
            setCompany(activeCompany);
          } else if (isPdfBypass && doc.companyId) {
            const compData = await dbApi.getCompany(doc.companyId);
            setCompany(compData as Company);
          }

          // Fetch previous paid payments and the quotation itself
          if (iData.quotationId) {
            const qData = await dbApi.getQuotation(iData.quotationId);
            if (qData) setQuotation(qData as Quotation);

            const allInvoices = await dbApi.getInvoices(iData.companyId) as Invoice[];
            const previousPaid = allInvoices.filter(inv => 
              inv.quotationId === iData.quotationId && 
              inv.status === "paid" && 
              inv.id !== resolvedParams.id
            );
            setPayments(previousPaid as Invoice[]);
          }
        }
      } catch (e) {
        
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeCompany, resolvedParams.id]);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isPdfBypass = searchParams?.get("pdf_secret") === process.env.NEXT_PUBLIC_PDF_SECRET;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!invoice || !client || !company) {
    return <div className="p-8 text-center">Invoice not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 w-full animate-in fade-in">
      <Button variant="ghost" size="sm" onClick={() => router.push('/invoices')} className="text-muted-foreground hover:text-white mb-4 px-0 print:hidden">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
      </Button>
      <DocumentViewer 
        type="INV" 
        document={invoice} 
        company={company} 
        client={client} 
        previousPayments={payments}
        linkedQuotation={quotation || undefined}
      />
    </div>
  );
}
