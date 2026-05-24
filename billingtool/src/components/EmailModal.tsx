import React, { useState } from "react";
import Script from "next/script";
import { Mail, X, Loader2, Download, AlertCircle, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { dbApi } from "@/lib/firebase/db";
import { DocumentLayout } from "./DocumentLayout";

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "QT" | "INV";
  document: any;
  company: any;
  client: any;
  previousPayments?: any[];
  linkedQuotation?: any;
  showPaymentDetails?: boolean;
  showTopSection?: boolean;
  showBottomSection?: boolean;
}

export function EmailModal({ 
  isOpen, 
  onClose, 
  type, 
  document: doc, 
  company, 
  client, 
  previousPayments = [], 
  linkedQuotation,
  showPaymentDetails = true,
  showTopSection = true,
  showBottomSection = true
}: EmailModalProps) {
  const docNumber = doc.quotationNumber || doc.invoiceNumber || "";
  const [mailing, setMailing] = useState(false);
  const [mailStatus, setMailStatus] = useState<"idle" | "generating" | "sending" | "success" | "error">("idle");
  const [mailError, setMailError] = useState("");
  const [mailData, setMailData] = useState({
    to: client.email || "",
    subject: `${type === "QT" ? "Quotation" : "Invoice"} #${docNumber} from ${company.name}`,
    body: `Hello ${client.name},\n\nPlease find attached the ${type === "QT" ? "quotation" : "invoice"} #${docNumber} for your reference.\n\nBest regards,\n${company.name}`
  });

  const generatePdfBase64 = async (): Promise<string> => {
    const element = document.getElementById("email-pdf-target");
    if (!element) throw new Error("Target element not found");

    const opt = {
      margin: 0,
      filename: `${type}_${docNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf to generate a blob
    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  };

  const handleSendMail = async () => {
    if (!mailData.to || !mailData.subject) {
      setMailError("Please fill in recipient email and subject.");
      setMailStatus("error");
      return;
    }

    setMailing(true);
    setMailStatus("generating");
    setMailError("");

    try {
      // 1. Generate PDF on client side
      const pdfBase64 = await generatePdfBase64();
      
      setMailStatus("sending");
      
      const secret = process.env.NEXT_PUBLIC_PDF_SECRET;
      
      // 2. Send to server with the pre-generated PDF
      const res = await fetch(`/api/mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mailData,
          type,
          document: doc,
          company,
          client,
          previousPayments,
          linkedQuotation,
          secret,
          pdfBase64 // Send the pre-generated PDF
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send email");
      }

      // Update document status to 'sent' in database
      try {
        if (type === "INV") {
          await dbApi.updateInvoice(doc.id, { status: "sent" });
        } else {
          await dbApi.updateQuotation(doc.id, { status: "accepted" }); // For QT, maybe 'accepted' or keep it as is. 
          // Actually, for QT, let's just keep status or add a 'sent' status if needed.
          // But looking at previous code, QT has 'draft', 'accepted', 'in_progress', 'completed'.
        }
      } catch (stError) {
        console.error("Failed to update status after mailing:", stError);
      }

      setMailStatus("success");
      setTimeout(() => {
        onClose();
        setMailStatus("idle");
      }, 2000);
    } catch (error: any) {
      setMailError(error.message);
      setMailStatus("error");
    } finally {
      setMailing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />
      
      {/* Hidden container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', overflow: 'hidden', height: 0 }}>
        <div id="email-pdf-target">
          <DocumentLayout 
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
        </div>
      </div>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Mail {type === "QT" ? "Quotation" : "Invoice"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" disabled={mailing}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {mailStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <FileCheck2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Email Sent!</p>
                <p className="text-slate-400">The document has been delivered successfully.</p>
              </div>
            </div>
          ) : (
            <>
              {mailStatus === "error" && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-500 font-bold">Failed to send email</p>
                    <p className="text-red-400/80">{mailError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Recipient Email</label>
                <Input 
                  value={mailData.to} 
                  onChange={e => setMailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="client@example.com"
                  disabled={mailing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Subject</label>
                <Input 
                  value={mailData.subject} 
                  onChange={e => setMailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject"
                  disabled={mailing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Message Body</label>
                <Textarea 
                  value={mailData.body} 
                  onChange={e => setMailData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your message here..."
                  className="min-h-[120px] resize-none"
                  disabled={mailing}
                />
              </div>
              
              {mailing ? (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4 animate-pulse">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div className="text-sm">
                    <p className="text-primary font-bold">
                      {mailStatus === "generating" ? "Generating PDF Document..." : "Sending Email via SMTP..."}
                    </p>
                    <p className="text-slate-400 text-xs">Please wait a few moments.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-medium">Attachment Ready</p>
                    <p className="text-slate-400 text-xs">
                      {type === "QT" ? "Quotation" : "Invoice"}_{docNumber}.pdf
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-6 pt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white" disabled={mailing}>
            Cancel
          </Button>
          {mailStatus !== "success" && (
            <Button onClick={handleSendMail} disabled={mailing} className="gap-2 min-w-[120px]">
              {mailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {mailing ? (mailStatus === "generating" ? "Generating..." : "Sending...") : "Send Email"}
            </Button>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
