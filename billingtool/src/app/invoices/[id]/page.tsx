'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getInvoice, getBusiness, updateInvoiceStatus } from '@/lib/firebase';
import type { Invoice, Business } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import EditInvoiceForm from '@/components/invoices/EditInvoiceForm';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  CheckCircle,
  Edit,
  Building2,
  Receipt,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, getLogoUrl } from '@/lib/utils';
import Image from 'next/image';
import { generateInvoiceEmailHTML, generateInvoiceEmailText } from '@/lib/email-templates';

export default function InvoiceViewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const loadInvoiceData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the specific invoice
      const invoiceData = await getInvoice(invoiceId);
      if (!invoiceData) {
        setError('Invoice not found');
        return;
      }

      setInvoice(invoiceData);

      // Get business details
      if (invoiceData.businessId) {
        const businessData = await getBusiness(invoiceData.businessId);
        setBusiness(businessData);
      }
    } catch (error) {
      console.error('Error loading invoice data:', error);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (invoiceId) {
        loadInvoiceData();
      }
    }
  }, [user, authLoading, invoiceId, router, loadInvoiceData]);

  const handlePrint = () => {
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';

    document.body.appendChild(printFrame);

    const frameDoc =
      printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice?.invoiceNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white; 
              color: black; 
              line-height: 1.2; 
            }
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 15px; 
            }
            .company-details { text-align: left; flex: 1; }
            .logo-section { text-align: right; flex: 1; }
            .invoice-details { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            .customer-info, .invoice-info { flex: 1; }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            .items-table th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
            }
            .invoice-summary { 
              text-align: right; 
              margin-top: 20px; 
            }
            .total { 
              font-size: 18px; 
              font-weight: bold; 
              border-top: 2px solid #333; 
              padding-top: 8px; 
            }
            @media print { 
              body { margin: 0; } 
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="company-details">
              <h2 style="margin: 2px 0;">${
                business?.name || 'Business Name'
              }</h2>
              ${
                business?.address &&
                business.address.street &&
                business.address.street.length > 5
                  ? `<p style="margin: 2px 0;">${business.address.street}, ${
                      business.address.city || ''
                    }, ${business.address.state || ''} ${
                      business.address.zipCode || ''
                    }</p>`
                  : ''
              }
              <p style="margin: 2px 0;">Phone: ${
                business?.phone || ''
              } | Email: ${business?.email || ''}</p>
            </div>
            <div class="logo-section">
              ${
                business?.logo
                  ? `<img src="${
                      business.logo.startsWith('/')
                        ? business.logo
                        : `/${business.logo}`
                    }" alt="Logo" style="max-height: 60px; max-width: 200px;">`
                  : ''
              }
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="customer-info">
              <h3 style="margin: 4px 0;">Bill To:</h3>
              <p style="margin: 2px 0;"><strong>${
                invoice?.customerName || ''
              }</strong></p>
              ${
                invoice?.customerEmail
                  ? `<p style="margin: 2px 0;">Email: ${invoice.customerEmail}</p>`
                  : ''
              }
              ${
                invoice?.customerPhone
                  ? `<p style="margin: 2px 0;">Phone: ${invoice.customerPhone}</p>`
                  : ''
              }
              ${
                invoice?.customerAddress &&
                invoice.customerAddress.street &&
                invoice.customerAddress.street.length > 5
                  ? `
                <p style="margin: 2px 0;">${invoice.customerAddress.street}<br>
                ${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zipCode}<br>
                ${invoice.customerAddress.country}</p>
              `
                  : ''
              }
            </div>
            <div class="invoice-info">
              <h3 style="margin: 4px 0;">Invoice Details:</h3>
              <p style="margin: 2px 0;"><strong>Invoice #:</strong> ${
                invoice?.invoiceNumber || ''
              }</p>
              <p style="margin: 2px 0;"><strong>Date:</strong> ${
                invoice?.createdAt
                  ? new Date(invoice.createdAt).toLocaleDateString()
                  : ''
              }</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                invoice?.items
                  ?.map(
                    (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.description || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(
                    item.unitPrice,
                    business?.currency || 'INR'
                  )}</td>
                  <td>${formatCurrency(
                    item.total,
                    business?.currency || 'INR'
                  )}</td>
                </tr>
              `
                  )
                  .join('') || ''
              }
            </tbody>
          </table>
          
          <div class="invoice-summary">
            <p style="margin: 2px 0;"><strong>Subtotal:</strong> ${formatCurrency(
              invoice?.subtotal || 0,
              business?.currency || 'INR'
            )}</p>
            ${
              invoice?.discountRate && invoice.discountRate > 0
                ? `<p style="margin: 2px 0;"><strong>Discount (${
                    invoice.discountRate
                  }%):</strong> -${formatCurrency(
                    invoice?.discountAmount || 0,
                    business?.currency || 'INR'
                  )}</p>`
                : ''
            }
            ${
              invoice?.discountRate && invoice.discountRate > 0
                ? `<p style="margin: 2px 0;"><strong>Amount After Discount:</strong> ${formatCurrency(
                    (invoice?.subtotal || 0) - (invoice?.discountAmount || 0),
                    business?.currency || 'INR'
                  )}</p>`
                : ''
            }
            ${
              invoice?.taxRate && invoice.taxRate > 0
                ? `<p style="margin: 2px 0;"><strong>Tax (${
                    invoice.taxRate
                  }%):</strong> ${formatCurrency(
                    invoice?.taxAmount || 0,
                    business?.currency || 'INR'
                  )}</p>`
                : ''
            }
            <p class="total" style="margin: 2px 0;"><strong>Total:</strong> ${formatCurrency(
              invoice?.total || 0,
              business?.currency || 'INR'
            )}</p>
          </div>
          
          ${
            invoice?.notes
              ? `
            <div style="margin-top: 20px; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <h3 style="margin: 4px 0;">Notes:</h3>
              <p style="margin: 2px 0;">${invoice.notes}</p>
            </div>
          `
              : ''
          }
        </body>
        </html>
      `);
      frameDoc.close();

      // Use a flag to prevent double printing
      let hasPrinted = false;

      const printAndCleanup = () => {
        if (hasPrinted) return;
        hasPrinted = true;

        try {
          printFrame.contentWindow?.print();
          // Remove the iframe after printing
          setTimeout(() => {
            if (printFrame.parentNode) {
              printFrame.parentNode.removeChild(printFrame);
            }
          }, 1000);
        } catch (error) {
          console.error('Print failed:', error);
          // Remove the iframe if print fails
          if (printFrame.parentNode) {
            printFrame.parentNode.removeChild(printFrame);
          }
        }
      };

      // Wait for the iframe to load, then print
      printFrame.onload = printAndCleanup;

      // Fallback: if onload doesn't fire within 500ms, try printing anyway
      setTimeout(printAndCleanup, 500);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !business) return;

    setDownloading(true);
    try {
      // Import the required libraries dynamically
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Create a temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.padding = '32px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.lineHeight = '1.2';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.boxSizing = 'border-box';

      // Generate the HTML content using the new structure
      tempDiv.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; background: white; color: black; padding: 0px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; text-align: center;">INVOICE</h1>
          
          <!-- Header Section -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid black; padding-bottom: 16px;">
            <div style="flex: 1;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">${business?.name || 'Business Name'}</h1>
              ${business?.address && business.address.street && business.address.street.length > 5 ? 
                `<p style="margin: 0 0 4px 0; font-size: 14px;">${business.address.street}, ${business.address.city || ''}, ${business.address.state || ''} ${business.address.zipCode || ''}</p>` : ''}
              <p style="margin: 0; font-size: 14px;">Phone: ${business?.phone || ''} | Email: ${business?.email || ''}</p>
            </div>
            <div style="flex: 1; text-align: right;">
              ${business?.logo ? `<img src="${business.logo.startsWith('/') ? business.logo : `/${business.logo}`}" alt="Logo" style="max-height: 64px; max-width: 128px; margin-top: 8px; margin-left: auto;">` : ''}
            </div>
          </div>

          <!-- Bill To & Invoice Details Section -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">Bill To:</h3>
              <p style="margin: 0 0 4px 0; font-weight: bold;">${invoice.customerName}</p>
              ${invoice.customerEmail ? `<p style="margin: 0 0 4px 0; font-size: 14px;">Email: ${invoice.customerEmail}</p>` : ''}
              ${invoice.customerPhone ? `<p style="margin: 0 0 4px 0; font-size: 14px;">Phone: ${invoice.customerPhone}</p>` : ''}
              ${invoice.customerAddress && invoice.customerAddress.street && invoice.customerAddress.street.length > 5 ? `
                <div style="font-size: 14px;">
                  <p style="margin: 0 0 4px 0;">${invoice.customerAddress.street}</p>
                  <p style="margin: 0 0 4px 0;">${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zipCode}</p>
                  <p style="margin: 0;">${invoice.customerAddress.country}</p>
                </div>
              ` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">Invoice Details:</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Date:</strong> ${invoice.createdAt.toLocaleDateString()}</p>
              ${invoice.dueDate ? `<p style="margin: 0; font-size: 14px;"><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">Item</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">Quantity</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">Unit Price</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr style="border-bottom: 1px solid black;">
                    <td style="border: 1px solid black; padding: 8px;">${item.productName}</td>
                    <td style="border: 1px solid black; padding: 8px;">${item.description || '-'}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">${item.quantity}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right;">${formatCurrency(item.unitPrice, business?.currency || 'INR')}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(item.total, business?.currency || 'INR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Summary Section -->
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 256px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: bold;">Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal, business?.currency || 'INR')}</span>
              </div>
              ${invoice.discountRate && invoice.discountRate > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Discount (${invoice.discountRate}%):</span>
                  <span>-${formatCurrency(invoice.discountAmount, business?.currency || 'INR')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Amount After Discount:</span>
                  <span>${formatCurrency(invoice.subtotal - invoice.discountAmount, business?.currency || 'INR')}</span>
                </div>
              ` : ''}
              ${invoice.taxRate && invoice.taxRate > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>Tax (${invoice.taxRate}%):</span>
                  <span>${formatCurrency(invoice.taxAmount, business?.currency || 'INR')}</span>
                </div>
              ` : ''}
              <div style="border-top: 2px solid black; padding-top: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
                  <span>Total:</span>
                  <span>${formatCurrency(invoice.total, business?.currency || 'INR')}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${invoice.notes ? `
            <div style="margin-top: 32px; padding: 16px; border: 1px solid #ccc; background-color: #f9f9f9;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">Notes:</h3>
              <p style="margin: 0; font-size: 14px;">${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
      `;

      // Append the temporary div to the document
      document.body.appendChild(tempDiv);

      // Wait for images to load
      const images = tempDiv.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            });
          })
        );
      }

      // Convert the div to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: tempDiv.scrollHeight,
      });

      // Remove the temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`invoice-${invoice.invoiceNumber || 'invoice'}.pdf`);

      console.log('PDF download completed');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(
        `Failed to download PDF: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = () => {
    if (!invoice || !business) return;

    setEmailRecipient(invoice.customerEmail || '');
    setEmailSubject(`Invoice ${invoice.invoiceNumber} - ${business.name}`);
    setEmailMessage(generateInvoiceEmailText({
      invoice,
      business,
      recipientEmail: invoice.customerEmail || '',
      recipientName: invoice.customerName
    }));
    setShowEmailModal(true);
  };

  const sendEmail = async () => {
    if (!invoice || !business || !emailRecipient || !emailSubject) {
      alert('Please fill in all required fields');
      return;
    }

    setSendingEmail(true);
    try {
      const htmlContent = generateInvoiceEmailHTML({
        invoice,
        business,
        recipientEmail: emailRecipient,
        recipientName: invoice.customerName
      });

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailRecipient,
          subject: emailSubject,
          htmlContent,
          textContent: emailMessage,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          businessName: business.name,
          total: invoice.total,
          currency: business.currency
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Email sent successfully!');
        setShowEmailModal(false);
        // Update invoice status to 'sent' if it was 'draft'
        if (invoice.status === 'draft') {
          await updateInvoiceStatus(invoice.id!, 'sent');
          setInvoice((prev) => (prev ? { ...prev, status: 'sent' } : null));
        }
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice) return;
    
    setApproving(true);
    try {
      await updateInvoiceStatus(invoice.id!, 'approved');
      setInvoice((prev) => (prev ? { ...prev, status: 'approved' } : null));
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert('Failed to approve invoice. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleEditSuccess = (updatedInvoice: Invoice) => {
    setInvoice(updatedInvoice);
    setShowEditForm(false);
  };

  const handleBack = () => {
    router.back();
  };

  // Show loading while auth is being checked or data is loading
  if (authLoading || loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black relative'>
        <BackgroundPattern />
        <div className='text-center relative z-10'>
          <LoadingSpinner size='lg' className='mx-auto mb-4' />
          <p className='text-gray-300'>Loading invoice...</p>
        </div>
      </div>
    );
  }

  // If no user after auth loading is complete, show redirect message
  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black relative'>
        <BackgroundPattern />
        <div className='text-center relative z-10'>
          <LoadingSpinner size='lg' className='mx-auto mb-4' />
          <p className='text-gray-300'>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className='min-h-screen bg-black relative p-6'>
        <BackgroundPattern />
        <div className='max-w-4xl mx-auto relative z-10'>
          <div className='text-center py-12'>
            <div className='mx-auto w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mb-6'>
              <Receipt className='w-12 h-12 text-red-400' />
            </div>
            <h3 className='text-xl font-semibold text-white mb-2'>
              Invoice Not Found
            </h3>
            <p className='text-gray-400 mb-6'>
              {error || 'The invoice you are looking for does not exist.'}
            </p>
            <Button
              onClick={handleBack}
              variant='outline'
              className='border-white/20 text-white hover:bg-white/10'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show edit form if editing
  if (showEditForm && business) {
    return (
      <div className='min-h-screen bg-black relative p-6'>
        <BackgroundPattern />
        <div className='max-w-4xl mx-auto relative z-10'>
          <EditInvoiceForm
            invoice={invoice}
            business={business}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black relative p-6'>
      <BackgroundPattern />
      <div className='max-w-4xl mx-auto relative z-10'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <Button
                onClick={handleBack}
                variant='outline'
                className='mb-4 border-white/20 text-white hover:bg-white/10'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back
              </Button>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Invoice #{invoice.invoiceNumber}
              </h1>
              <p className='text-gray-300'>
                {business?.name && (
                  <span className='flex items-center gap-2'>
                    <Building2 className='w-4 h-4' />
                    {business.name}
                  </span>
                )}
              </p>
            </div>
            <div className='flex gap-2 flex-wrap'>
              {invoice.status === 'draft' && (
                <Button
                  onClick={() => setShowEditForm(true)}
                  variant='outline'
                  className='border-white/20 text-white hover:bg-white/10'
                >
                  <Edit className='w-4 h-4 mr-2' />
                  Edit
                </Button>
              )}
              {invoice.status === 'draft' && (
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className='bg-green-600 hover:bg-green-700'
                >
                  {approving ? (
                    <div className='flex items-center gap-2'>
                      <LoadingSpinner size='sm' />
                      Approving...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Approve
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handlePrint}
                variant='outline'
                className='border-white/20 text-white hover:bg-white/10'
              >
                <Printer className='w-4 h-4 mr-2' />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                variant='outline'
                className='border-white/20 text-white hover:bg-white/10'
              >
                {downloading ? (
                  <div className='flex items-center gap-2'>
                    <LoadingSpinner size='sm' />
                    Downloading...
                  </div>
                ) : (
                  <>
                    <Download className='w-4 h-4 mr-2' />
                Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleEmail}
                variant='outline'
                className='border-white/20 text-white hover:bg-white/10'
              >
                <Mail className='w-4 h-4 mr-2' />
                Email
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Invoice Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='shadow-2xl border-white/20'>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-2xl font-bold text-white'>
                    Invoice Details
                  </CardTitle>
                  <CardDescription className='text-gray-300'>
                Generated on {invoice.createdAt.toLocaleDateString()}
              </CardDescription>
                </div>
                {business?.logo && (
                  <Image
                    src={getLogoUrl(business.logo) || ''}
                    alt='Logo'
                    width={128}
                    height={64}
                    className='h-16 w-auto max-w-32 object-contain'
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Customer Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-lg font-semibold text-white mb-3'>
                    Customer Information
                  </h3>
                  <div className='space-y-2 text-gray-300'>
                    <p>
                      <strong>Name:</strong> {invoice.customerName}
                    </p>
                    {invoice.customerEmail && (
                      <p>
                        <strong>Email:</strong> {invoice.customerEmail}
                      </p>
                    )}
                    {invoice.customerPhone && (
                      <p>
                        <strong>Phone:</strong> {invoice.customerPhone}
                      </p>
                    )}
                    {invoice.customerAddress &&
                      invoice.customerAddress.street &&
                      invoice.customerAddress.street.length > 5 && (
                      <div>
                        <strong>Address:</strong>
                          <p className='ml-4'>
                            {invoice.customerAddress.street}
                            <br />
                            {invoice.customerAddress.city},{' '}
                            {invoice.customerAddress.state}{' '}
                            {invoice.customerAddress.zipCode}
                            <br />
                          {invoice.customerAddress.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-white mb-3'>
                    Invoice Information
                  </h3>
                  <div className='space-y-2 text-gray-300'>
                    <p>
                      <strong>Invoice Number:</strong> {invoice.invoiceNumber}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          invoice.status === 'approved'
                            ? 'bg-green-900/50 text-green-300'
                            : invoice.status === 'paid'
                            ? 'bg-green-900/50 text-green-300'
                            : invoice.status === 'sent'
                            ? 'bg-blue-900/50 text-blue-300'
                            : invoice.status === 'overdue'
                            ? 'bg-red-900/50 text-red-300'
                            : 'bg-gray-900/50 text-gray-300'
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <strong>Created:</strong>{' '}
                      {invoice.createdAt.toLocaleDateString()}
                    </p>
                    {invoice.dueDate && (
                      <p>
                        <strong>Due Date:</strong>{' '}
                        {invoice.dueDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className='text-lg font-semibold text-white mb-3'>Items</h3>
                <div className='border border-white/10 rounded-lg overflow-hidden'>
                  <table className='w-full'>
                    <thead className='bg-black/50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-white font-semibold'>
                          Item
                        </th>
                        <th className='px-4 py-3 text-left text-white font-semibold'>
                          Description
                        </th>
                        <th className='px-4 py-3 text-right text-white font-semibold'>
                          Quantity
                        </th>
                        <th className='px-4 py-3 text-right text-white font-semibold'>
                          Unit Price
                        </th>
                        <th className='px-4 py-3 text-right text-white font-semibold'>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className='border-t border-white/10'>
                          <td className='px-4 py-3 text-white'>
                            {item.productName}
                          </td>
                          <td className='px-4 py-3 text-white text-sm'>
                            {item.description || '-'}
                          </td>
                          <td className='px-4 py-3 text-right text-white'>
                            {item.quantity}
                          </td>
                          <td className='px-4 py-3 text-right text-white'>
                            {formatCurrency(
                              item.unitPrice,
                              business?.currency || 'INR'
                            )}
                          </td>
                          <td className='px-4 py-3 text-right text-white font-semibold'>
                            {formatCurrency(
                              item.total,
                              business?.currency || 'INR'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className='border-t border-white/10 pt-6'>
                <div className='flex justify-end'>
                  <div className='w-64 space-y-2'>
                    <div className='flex justify-between text-gray-300'>
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(
                          invoice.subtotal,
                          business?.currency || 'INR'
                        )}
                      </span>
                    </div>
                    {invoice.discountRate && invoice.discountRate > 0 && (
                      <div className='flex justify-between text-gray-300'>
                        <span>Discount ({invoice.discountRate}%):</span>
                        <span>
                          -
                          {formatCurrency(
                            invoice.discountAmount,
                            business?.currency || 'INR'
                          )}
                        </span>
                      </div>
                    )}
                    {invoice.discountRate && invoice.discountRate > 0 && (
                      <div className='flex justify-between text-gray-300'>
                        <span>Amount After Discount:</span>
                        <span>
                          {formatCurrency(
                            invoice.subtotal - invoice.discountAmount,
                            business?.currency || 'INR'
                          )}
                        </span>
                      </div>
                    )}
                    {invoice.taxRate && invoice.taxRate > 0 && (
                      <div className='flex justify-between text-gray-300'>
                        <span>Tax ({invoice.taxRate}%):</span>
                        <span>
                          {formatCurrency(
                            invoice.taxAmount,
                            business?.currency || 'INR'
                          )}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between text-white font-bold text-lg border-t border-white/10 pt-2'>
                      <span>Total:</span>
                      <span>
                        {formatCurrency(
                          invoice.total,
                          business?.currency || 'INR'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className='text-lg font-semibold text-white mb-3'>
                    Notes
                  </h3>
                  <p className='text-gray-300 bg-black/20 p-4 rounded-lg'>
                    {invoice.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* New Invoice Display Div (for PDF) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mt-8'
          data-invoice-display
        >
          <div
            style={{
              display: 'none',
              backgroundColor: 'white',
              color: 'black',
              padding: '32px',
              maxWidth: '800px',
              margin: '0 auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h1
              style={{
                margin: '0',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              INVOICE
            </h1>
            {/* Header Section */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '32px',
                borderBottom: '2px solid black',
                paddingBottom: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '24px',
                    fontWeight: 'bold',
                  }}
                >
                  {business?.name || 'Business Name'}
                </h1>
                {business?.address &&
                  business.address.street &&
                  business.address.street.length > 5 && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                      {business.address.street}, {business.address.city || ''},{' '}
                      {business.address.state || ''}{' '}
                      {business.address.zipCode || ''}
                    </p>
                  )}
                <p style={{ margin: '0', fontSize: '14px' }}>
                  Phone: {business?.phone || ''} | Email:{' '}
                  {business?.email || ''}
                </p>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                {business?.logo && (
                  <Image
                    src={
                      business.logo.startsWith('/')
                        ? business.logo
                        : `/${business.logo}`
                    }
                    alt='Logo'
                    width={64}
                    height={64}
                    style={{
                      marginTop: '8px',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Bill To & Invoice Details Section */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '32px',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                  }}
                >
                  Bill To:
                </h3>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
                  {invoice.customerName}
                </p>
                {invoice.customerEmail && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                    Email: {invoice.customerEmail}
                  </p>
                )}
                {invoice.customerPhone && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                    Phone: {invoice.customerPhone}
                  </p>
                )}
                {invoice.customerAddress &&
                  invoice.customerAddress.street &&
                  invoice.customerAddress.street.length > 5 && (
                    <div style={{ fontSize: '14px' }}>
                      <p style={{ margin: '0 0 4px 0' }}>
                        {invoice.customerAddress.street}
                      </p>
                      <p style={{ margin: '0 0 4px 0' }}>
                        {invoice.customerAddress.city},{' '}
                        {invoice.customerAddress.state}{' '}
                        {invoice.customerAddress.zipCode}
                      </p>
                      <p style={{ margin: '0' }}>
                        {invoice.customerAddress.country}
                      </p>
                    </div>
                  )}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                  }}
                >
                  Invoice Details:
                </h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>Date:</strong>{' '}
                  {invoice.createdAt.toLocaleDateString()}
                </p>
                {invoice.dueDate && (
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Due Date:</strong>{' '}
                    {invoice.dueDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '32px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid black',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      Unit Price
                    </th>
                    <th
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid black' }}>
                      <td style={{ border: '1px solid black', padding: '8px' }}>
                        {item.productName}
                      </td>
                      <td
                        style={{
                          border: '1px solid black',
                          padding: '8px',
                          textAlign: 'left',
                        }}
                      >
                        {item.description || '-'}
                      </td>
                      <td
                        style={{
                          border: '1px solid black',
                          padding: '8px',
                          textAlign: 'right',
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          border: '1px solid black',
                          padding: '8px',
                          textAlign: 'right',
                        }}
                      >
                        {formatCurrency(
                          item.unitPrice,
                          business?.currency || 'INR'
                        )}
                      </td>
                      <td
                        style={{
                          border: '1px solid black',
                          padding: '8px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                        }}
                      >
                        {formatCurrency(
                          item.total,
                          business?.currency || 'INR'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '256px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Subtotal:</span>
                  <span>
                    {formatCurrency(
                      invoice.subtotal,
                      business?.currency || 'INR'
                    )}
                  </span>
                </div>
                {invoice.discountRate && invoice.discountRate > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Discount ({invoice.discountRate}%):</span>
                    <span>
                      -
                      {formatCurrency(
                        invoice.discountAmount,
                        business?.currency || 'INR'
                      )}
                    </span>
                  </div>
                )}
                {invoice.discountRate && invoice.discountRate > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Amount After Discount:</span>
                    <span>
                      {formatCurrency(
                        invoice.subtotal - invoice.discountAmount,
                        business?.currency || 'INR'
                      )}
                    </span>
                  </div>
                )}
                {invoice.taxRate && invoice.taxRate > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span>
                      {formatCurrency(
                        invoice.taxAmount,
                        business?.currency || 'INR'
                      )}
                    </span>
                  </div>
                )}
                <div
                  style={{ borderTop: '2px solid black', paddingTop: '8px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}
                  >
                    <span>Total:</span>
                    <span>
                      {formatCurrency(
                        invoice.total,
                        business?.currency || 'INR'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className='text-lg font-semibold text-white mb-3'>Notes</h3>
                <p className='text-gray-300 bg-black/20 p-4 rounded-lg'>
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-black border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Send Invoice Email
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    placeholder="Invoice subject"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    placeholder="Add a personal message..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setShowEmailModal(false)}
                  variant="outline"
                  disabled={sendingEmail}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmail}
                  disabled={sendingEmail || !emailRecipient || !emailSubject}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendingEmail ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 
