"use client";

import { useEffect, useState, use } from "react";
import { dbApi, Quotation, Client, Company } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { DocumentViewer } from "@/components/DocumentViewer";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ViewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { activeCompany } = useCompany();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const searchParams = new URLSearchParams(window.location.search);
      const isPdfBypass = searchParams.get("pdf_secret") === process.env.NEXT_PUBLIC_PDF_SECRET;
      
      if (!activeCompany && !isPdfBypass) return;
      
      try {
        const doc = await dbApi.getQuotation(resolvedParams.id);
        if (doc) {
          const qData = doc as Quotation;
          setQuotation(qData);
          document.title = `Quotation_${qData.quotationNumber}`;
          
          // Fetch client
          const cData = await dbApi.getClient(qData.clientId);
          setClient(cData as Client);

          // Fetch company (priority to activeCompany, fallback to qData.companyId)
          if (activeCompany) {
            setCompany(activeCompany);
          } else if (isPdfBypass && qData.companyId) {
            const compData = await dbApi.getCompany(qData.companyId);
            setCompany(compData as Company);
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

  if (!quotation || !client || !company) {
    return <div className="p-8 text-center">Quotation not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 w-full animate-in fade-in">
      <Button variant="ghost" size="sm" onClick={() => router.push('/quotations')} className="text-muted-foreground hover:text-white mb-4 px-0 print:hidden">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotations
      </Button>
      <DocumentViewer 
        type="QT" 
        document={quotation} 
        company={company} 
        client={client} 
      />
    </div>
  );
}
