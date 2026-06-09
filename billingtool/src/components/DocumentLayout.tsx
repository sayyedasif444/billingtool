"use client";

import React from "react";
import { Company, Client, Quotation, Invoice, ColumnDef } from "@/lib/firebase/db";

interface DocumentLayoutProps {
  type: "QT" | "INV";
  document: Quotation | Invoice;
  company: Company;
  client: Client;
  previousPayments?: Invoice[];
  linkedQuotation?: Quotation;
  showPaymentDetails?: boolean;
  showLogoAndHeader?: boolean;
  showTopSection?: boolean;
  showBottomSection?: boolean;
}

export function DocumentLayout({ 
  type, 
  document, 
  company, 
  client, 
  previousPayments = [], 
  linkedQuotation,
  showPaymentDetails = true,
  showLogoAndHeader = true,
  showTopSection = true,
  showBottomSection = true
}: DocumentLayoutProps) {
  const currency = (document as Quotation).currency || "USD";
  const docNumber = (document as Quotation).quotationNumber || (document as Invoice).invoiceNumber || "";
  const docDate = document.date ? new Date(document.date as any).toLocaleDateString('en-GB') : "";

  // Determine columns and sections
  let columns: ColumnDef[] = document.columns || [];
  let topSection = showTopSection ? ((document as any)?.topSection) : null;
  let bottomSection = showBottomSection ? ((document as any)?.bottomSection) : null;

  const effectiveTemplateId = document.templateId || linkedQuotation?.templateId;
  let activeTemplate = null;

  if (effectiveTemplateId && client.templates) {
    activeTemplate = client.templates.find(t => t.id === effectiveTemplateId);
  }

  if (!activeTemplate && client.templates && client.templates.length > 0) {
    activeTemplate = client.templates[0];
  }

  if (activeTemplate) {
    if (columns.length === 0) {
      columns = activeTemplate.columns || [];
    }
    if (!topSection && showTopSection) {
      topSection = activeTemplate.topSection;
    }
    if (!bottomSection && showBottomSection) {
      bottomSection = activeTemplate.bottomSection;
    }
  }

  if (columns.length === 0) {
    if ((client as any)?.template?.columns) {
      columns = (client as any).template.columns;
    }
  }

  if (!topSection && showTopSection && (client as any)?.template?.topSection) {
    topSection = (client as any).template.topSection;
  }
  if (!bottomSection && showBottomSection && (client as any)?.template?.bottomSection) {
    bottomSection = (client as any).template.bottomSection;
  }

  const rows = document.dynamicRows || 
               (document as Invoice).lineItems || 
               (document as Quotation).phases || 
               linkedQuotation?.dynamicRows || 
               linkedQuotation?.phases || 
               [];

  if (columns.length === 0 && rows.length > 0) {
    if ((document as Quotation).phases) {
      columns = [
        { id: "name", label: "Description", type: "text" },
        { id: "amount", label: "Amount", type: "number" }
      ];
    } else if ((document as Invoice).lineItems) {
       columns = [
        { id: "description", label: "Description", type: "text" },
        { id: "quantity", label: "Quantity", type: "number" },
        { id: "rate", label: "Rate", type: "number" },
        { id: "amount", label: "Amount", type: "number" }
      ];
    }
  }

  // Find the index of the main total/amount column
  // 1. First priority: columns marked with isTotal (excluding ones that are clearly not currency, like hours/days/qty)
  let amountColIndex = columns.findIndex(c => {
    if (!c.isTotal) return false;
    const lbl = c.label.toLowerCase();
    const hasQualifier = lbl.includes("hrs") || lbl.includes("hours") || lbl.includes("days") || lbl.includes("qty") || lbl.includes("quantity");
    return !hasQualifier;
  });

  // 2. Second priority: exact match on "total" or "amount"
  if (amountColIndex === -1) {
    amountColIndex = columns.findIndex(c => {
      const lbl = c.label.toLowerCase().trim();
      return lbl === "total" || lbl === "amount";
    });
  }

  // 3. Third priority: contains total or amount but does not have qualifiers
  if (amountColIndex === -1) {
    amountColIndex = columns.findIndex(c => {
      const lbl = c.label.toLowerCase();
      const isTotalOrAmt = lbl.includes("total") || lbl.includes("amount");
      const hasQualifier = lbl.includes("hrs") || lbl.includes("hours") || lbl.includes("days") || lbl.includes("rate") || lbl.includes("price") || lbl.includes("qty") || lbl.includes("quantity");
      return isTotalOrAmt && !hasQualifier;
    });
  }

  // 4. Fourth priority: any column containing amount or total
  if (amountColIndex === -1) {
    amountColIndex = columns.findIndex(c => c.label.toLowerCase().includes("amount") || c.label.toLowerCase().includes("total"));
  }

  const mainAmtCol = amountColIndex !== -1 ? columns[amountColIndex] : null;
  let finalColumns = [...columns];
  if (amountColIndex !== -1 && amountColIndex !== finalColumns.length - 1) {
     const amtCol = finalColumns.splice(amountColIndex, 1)[0];
     finalColumns.push(amtCol);
  }

  return (
    <div 
      className="relative w-[210mm] bg-white text-black p-[15mm] shadow-2xl print:shadow-none print:w-[210mm] print:mx-auto print:min-h-0"
      style={{ boxSizing: "border-box", minHeight: "296mm" }}
    >
      {showLogoAndHeader && (
        <div className="print-avoid-break grid grid-cols-3 border-b border-gray-100 pb-2 mb-0 items-start">
          {/* Bill To */}
          <div className="text-left">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Bill To</h3>
            <div className="text-gray-800 space-y-0.5 text-[13px]">
              <p className="font-bold text-sm text-gray-900 mb-0.5">{client.name}</p>
              {client.address && <p className="whitespace-pre-wrap max-w-[200px] text-gray-600 leading-tight">{client.address}</p>}
              {client.phone && <p className="text-gray-600 leading-tight">{client.phone}</p>}
              {client.email && <p className="text-gray-600 leading-tight">{client.email}</p>}
            </div>
          </div>

          {/* Center Logo */}
          <div className="flex flex-col items-center justify-center pt-2">
            {company.logoUrl && (
              <img src={company.logoUrl} alt="Company Logo" className="w-[80px] h-auto object-contain max-h-[80px]" />
            )}
          </div>
          
          {/* Company Info (From) */}
          <div className="text-right flex flex-col items-end">
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">From</h3>
            <div className="text-right flex flex-col items-end text-[13px]">
              <p className="font-bold text-sm text-gray-900 mb-0.5">{company.name}</p>
              <div className="text-gray-600 space-y-0.5 leading-tight">
                {company.address && <p className="whitespace-pre-wrap max-w-xs">{company.address}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.email && <p>{company.email}</p>}
                {company.taxId && <p className="text-[10px] text-gray-400 mt-0.5">TAX ID: {company.taxId}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Bar (Compact) */}
      <div className="flex justify-between items-center mb-2 py-0.5 border-b border-gray-100">
        <div className="text-[10px] uppercase tracking-wider text-gray-400">
          {type === "QT" ? "Quotation" : "Invoice"} No: <span className="font-bold text-gray-900 text-[13px] ml-1">{docNumber}</span>
        </div>
        
        <div className="text-[10px] uppercase tracking-wider text-gray-400">
          Date: <span className="font-bold text-gray-900 text-[13px] ml-1">{docDate}</span>
        </div>
      </div>

      {topSection && (
        <div 
          className="prose prose-sm max-w-none mb-2 text-gray-700 leading-tight pt-1 template-content-13px"
          dangerouslySetInnerHTML={{ __html: topSection }}
        />
      )}

      {/* Line Items Table */}
      <div className="mb-3 print-avoid-break">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-900">
              {finalColumns.map((col, idx) => {
                const isMainAmount = mainAmtCol && col.id === mainAmtCol.id;
                const isNumber = col.type === "number" || col.type === "calculated";
                return (
                  <th key={col.id} className={`py-1.5 text-[13px] font-bold text-gray-900 ${isMainAmount || isNumber ? "text-right" : ""}`}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={row.id || i} className="border-b border-gray-50 last:border-b-0">
                {finalColumns.map((col, idx) => {
                  const isMainAmount = mainAmtCol && col.id === mainAmtCol.id;
                  const isNumber = col.type === "number" || col.type === "calculated";
                  const val = row[col.id] ?? row[col.label.toLowerCase()] ?? "";
                  let displayVal = val;
                  
                  if (isMainAmount) {
                    const numericVal = Number(val) || 0;
                    displayVal = `${currency} ${numericVal.toLocaleString()}`;
                  } else if (isNumber && val !== "") {
                    const numericVal = Number(val);
                    displayVal = isNaN(numericVal) ? val : numericVal.toLocaleString();
                  }
                  
                  return (
                    <td key={col.id} className={`py-1 text-[12px] text-gray-700 ${isMainAmount || isNumber ? "text-right" : ""}`}>
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end mb-4 print-avoid-break">
        <div className="w-56 space-y-1">
          {finalColumns.filter(c => c.isTotal).map(totalCol => {
            const sum = rows.reduce((acc: number, row: any) => {
              const val = Number(row[totalCol.id] ?? row[totalCol.label.toLowerCase()]) || 0;
              return acc + val;
            }, 0);
            
            const isMainAmount = mainAmtCol && totalCol.id === mainAmtCol.id;
            return (
              <div key={totalCol.id} className="flex justify-between text-[12px] text-gray-600 border-b border-gray-100 pb-0.5">
                <span className="font-medium">{totalCol.label}</span>
                <span>{isMainAmount ? `${currency} ` : ""}{sum.toLocaleString()}</span>
              </div>
            );
          })}
          
          <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-900 pt-1.5 mt-1">
            <span>{type === "QT" ? "Quotation Total" : "Invoice Total"}</span>
            <span>{currency} {Number((document as Quotation).totalAmount || (document as Invoice).amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Old Payments Section */}
      {type === "INV" && previousPayments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-100 pb-0.5">Old Payments Paid</h4>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 text-[12px] font-bold text-gray-900">Invoice No</th>
                <th className="py-1 text-[12px] font-bold text-gray-900">Payment Date</th>
                <th className="py-1 text-[12px] font-bold text-gray-900 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {previousPayments.map((payment, idx) => (
                <tr key={payment.id || idx} className="border-b border-gray-50 last:border-b-0">
                  <td className="py-1 text-[12px] text-gray-700">{payment.invoiceNumber}</td>
                  <td className="py-1 text-[12px] text-gray-700">
                    {payment.date ? new Date(payment.date as any).toLocaleDateString('en-GB') : "N/A"}
                  </td>
                  <td className="py-1 text-[12px] text-gray-700 text-right font-medium">
                    {currency} {Number(payment.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-900">
                <td colSpan={2} className="py-1 text-[12px] font-bold text-gray-900">Total Paid Previously</td>
                <td className="py-1 text-[12px] font-bold text-gray-900 text-right">
                  {currency} {Number(previousPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0)).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {bottomSection && (
        <div 
          className="prose prose-sm max-w-none mb-3 text-gray-600 leading-tight template-content-11px"
          dangerouslySetInnerHTML={{ __html: bottomSection }}
        />
      )}

      {/* Footer: Notes & Bank Details (Tightened) */}
      {(document.notes || (showPaymentDetails && company.bankDetails)) && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-start gap-6 text-[10px]">
          <div className="flex-1">
            {document.notes && (
              <div>
                <h4 className="font-bold text-gray-900 mb-0.5 uppercase tracking-tighter opacity-50">Notes</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{document.notes}</p>
              </div>
            )}
          </div>
          {showPaymentDetails && company.bankDetails && (
            <div className="text-right min-w-[180px]">
              <h4 className="font-bold text-gray-900 mb-0.5 uppercase tracking-tighter opacity-50">Payment Details</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{company.bankDetails}</p>
            </div>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          #billing-document {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page { margin: 0; size: auto; }
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
        .template-content-13px, .template-content-13px * {
          font-size: 13px !important;
        }
        .template-content-11px, .template-content-11px * {
          font-size: 11px !important;
        }
      `}} />
    </div>
  );
}
