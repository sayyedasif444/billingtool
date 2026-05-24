"use client";

import React, { useRef, useState } from "react";
import { Company, Client, Quotation, Invoice } from "@/lib/firebase/db";
import { Button } from "@/components/ui/Button";
import { Download, Printer, Loader2, Mail } from "lucide-react";
import { EmailModal } from "@/components/EmailModal";
import { DocumentLayout } from "./DocumentLayout";
import Script from "next/script";

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface DocumentViewerProps {
  type: "QT" | "INV";
  document: Quotation | Invoice;
  company: Company;
  client: Client;
  previousPayments?: Invoice[];
  linkedQuotation?: Quotation;
  initialShowTopSection?: boolean;
  initialShowBottomSection?: boolean;
  initialShowPaymentDetails?: boolean;
}

export function DocumentViewer({ 
  type, 
  document: doc, 
  company, 
  client, 
  previousPayments = [], 
  linkedQuotation,
  initialShowTopSection = true,
  initialShowBottomSection = true,
  initialShowPaymentDetails = true
}: DocumentViewerProps) {
  const docNumber = (doc as Quotation).quotationNumber || (doc as Invoice).invoiceNumber || "";

  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);

  const [showBottomSection, setShowBottomSection] = useState(initialShowBottomSection);
  const [showPaymentDetails, setShowPaymentDetails] = useState(initialShowPaymentDetails);
  const [showLogoAndHeader, setShowLogoAndHeader] = useState(true);
  const [showTopSection, setShowTopSection] = useState(initialShowTopSection);

  const handleDownloadPdf = async () => {
    if (typeof html2pdf === "undefined") {
      alert("PDF library still loading. Please try again in a moment.");
      return;
    }

    const element = document.getElementById("billing-document");
    if (!element) {
      alert("Document content not found.");
      return;
    }

    setDownloading(true);
    // Temporary reset for clean capture
    const originalTransform = element.style.transform;
    const originalMargin = element.style.margin;
    
    try {
      element.style.transform = 'none';
      element.style.margin = '0';

      const filename = `${type === "QT" ? "Quotation" : "Invoice"}_${docNumber}.pdf`;
      
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          width: 794, // 210mm at 96 DPI
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try the Print button instead.");
    } finally {
      // Restore
      element.style.transform = originalTransform;
      element.style.margin = originalMargin;
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = window.document.title;
    const fileName = `${type === "QT" ? "Quotation" : "Invoice"}_${docNumber}`;
    window.document.title = fileName;
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        window.document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  React.useEffect(() => {
    if (docNumber) {
      const originalTitle = window.document.title;
      const displayTitle = `${type === "QT" ? "Quotation" : "Invoice"}_${docNumber}`;
      window.document.title = displayTitle;
      window.dispatchEvent(new CustomEvent('docTitleChanged', { detail: displayTitle }));
      
      return () => {
        window.document.title = originalTitle;
        window.dispatchEvent(new CustomEvent('docTitleChanged', { detail: null }));
      };
    }
  }, [docNumber, type]);

  return (
    <div className="flex flex-col items-center w-full py-8 print:py-0 print:block">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />
      
      {/* Action Bar - Responsive Wrapper */}
      <div className="w-full max-w-[210mm] px-4 md:px-0 mb-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="flex flex-wrap gap-4 text-xs md:text-sm text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={showTopSection} 
                onChange={e => setShowTopSection(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
              />
              Header
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={showBottomSection} 
                onChange={e => setShowBottomSection(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
              />
              Bottom Section
            </label>
            {company.bankDetails && (
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={showPaymentDetails} 
                  onChange={e => setShowPaymentDetails(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                />
                Payment Details
              </label>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handlePrint} size="sm" className="flex-1 md:flex-none gap-2 bg-black/20 text-slate-200 border-white/10 hover:bg-white/10 hover:text-white">
              <Printer className="h-4 w-4" /> <span className="hidden md:inline">Print</span>
            </Button>
            <Button variant="outline" onClick={() => setShowMailModal(true)} size="sm" className="flex-1 md:flex-none gap-2 bg-black/20 text-slate-200 border-white/10 hover:bg-white/10 hover:text-white">
              <Mail className="h-4 w-4" /> <span className="hidden md:inline">Mail</span>
            </Button>
            <Button 
              onClick={handleDownloadPdf} 
              disabled={downloading}
              size="sm"
              className="flex-1 md:flex-none gap-2 shadow-lg shadow-primary/20"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>{downloading ? "..." : "PDF"}</span>
            </Button>
          </div>
        </div>
      </div>

      <EmailModal 
        isOpen={showMailModal} 
        onClose={() => setShowMailModal(false)}
        type={type}
        document={doc}
        company={company}
        client={client}
        previousPayments={previousPayments}
        linkedQuotation={linkedQuotation}
        showPaymentDetails={showPaymentDetails}
        showTopSection={showTopSection}
        showBottomSection={showBottomSection}
      />

      {/* A4 Document Container - Horizontal Scroll for Mobile */}
      <div id="billing-document-wrapper" className="w-full overflow-x-auto pb-10 scrollbar-hide flex justify-start md:justify-center print:block print:overflow-visible print:pb-0">
        <div 
          ref={printRef} 
          id="billing-document" 
          className="print:m-0 shadow-2xl scale-[0.65] origin-top-left md:scale-100 md:origin-top ml-4 md:ml-0 print:scale-100 print:ml-0 print:shadow-none"
        >
          <DocumentLayout 
             type={type}
             document={doc}
             company={company}
             client={client}
             previousPayments={previousPayments}
             linkedQuotation={linkedQuotation}
             showPaymentDetails={showPaymentDetails}
             showLogoAndHeader={showLogoAndHeader}
             showTopSection={showTopSection}
             showBottomSection={showBottomSection}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* 1. Hide UI elements */
          header, nav, aside, footer, button, .print-hidden, [class*="print:hidden"], .lg\\:hidden {
            display: none !important;
          }

          /* 2. Reset Layout for Print */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            width: 100% !important;
          }

          /* Remove all fixed/sticky positioning that might interfere */
          .fixed, .sticky {
            position: static !important;
          }

          /* Reset main content containers */
          main, .flex, .flex-1 {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* 3. Position the Document */
          #billing-document-wrapper {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 210mm !important;
            z-index: 9999 !important;
          }

          #billing-document {
            width: 210mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            background: white !important;
            border: none !important;
          }

          /* 4. Ensure table elements render correctly */
          table { display: table !important; width: 100% !important; }
          tr { display: table-row !important; }
          td, th { display: table-cell !important; }

          @page {
            margin: 0;
            size: A4;
          }
        }
      `}} />
    </div>
  );
}
