import { Invoice, Business } from './firebase';
import { formatCurrency, formatDate } from './utils';

export interface EmailTemplateData {
  invoice: Invoice;
  business: Business;
  recipientEmail: string;
  recipientName: string;
}

export function generateInvoiceEmailHTML(data: EmailTemplateData): string {
  const { invoice, business } = data;
  
  const itemsHTML = invoice.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; text-align: left; font-size: 14px; color: #374151;">${item.productName}</td>
      <td style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280;">${item.description || '-'}</td>
      <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #374151;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #374151;">${formatCurrency(item.unitPrice, business.currency)}</td>
      <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #374151; font-weight: 600;">${formatCurrency(item.total, business.currency)}</td>
    </tr>
  `).join('');

  const logoHTML = business.logo ? 
    `<img src="${business.logo.startsWith('/') ? business.logo : `/${business.logo}`}" alt="${business.name} Logo" style="max-height: 60px; max-width: 120px; object-fit: contain;">` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #374151; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="background-color: white; padding: 0; border-radius: 0; box-shadow: none;">
        
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="flex: 1;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #111827; line-height: 1.2;">${business.name}</h1>
            ${business.address && business.address.street && business.address.street.length > 5 ? 
              `<p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${business.address.street}, ${business.address.city || ''}, ${business.address.state || ''} ${business.address.zipCode || ''}</p>` : ''}
            <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.4;">Phone: ${business.phone || ''} | Email: ${business.email || ''}</p>
          </div>
          <div style="flex: 1; text-align: right;">
          </div>
        </div>

        <!-- Bill To and Invoice Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="flex: 1; width: 50%;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Bill To:</h3>
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #111827;">${invoice.customerName}</p>
            ${invoice.customerEmail ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Email: ${invoice.customerEmail}</p>` : ''}
            ${invoice.customerPhone ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Phone: ${invoice.customerPhone}</p>` : ''}
            ${invoice.customerAddress && invoice.customerAddress.street && invoice.customerAddress.street.length > 5 ? `
              <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
                <p style="margin: 0 0 4px 0;">${invoice.customerAddress.street}</p>
                <p style="margin: 0 0 4px 0;">${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zipCode}</p>
                <p style="margin: 0;">${invoice.customerAddress.country}</p>
              </div>
            ` : ''}
          </div>
          <div style="flex: 1; text-align: right; width: 50%;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Invoice Details:</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
            ${invoice.dueDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: left; font-weight: 600; color: #111827; font-size: 14px;">${invoice.preferences?.columnHeaders?.item || 'Item'}</th>
                <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: left; font-weight: 600; color: #111827; font-size: 14px;">${invoice.preferences?.columnHeaders?.description || 'Description'}</th>
                <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-weight: 600; color: #111827; font-size: 14px;">${invoice.preferences?.columnHeaders?.quantity || 'Quantity'}</th>
                <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-weight: 600; color: #111827; font-size: 14px;">${invoice.preferences?.columnHeaders?.price || 'Unit Price'}</th>
                <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-weight: 600; color: #111827; font-size: 14px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #111827; font-size: 14px;">Subtotal:</span>
              <span style="color: #111827; font-size: 14px;">${formatCurrency(invoice.subtotal, business.currency)}</span>
            </div>
            ${invoice.discountRate && invoice.discountRate > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Discount (${invoice.discountRate}%):</span>
                <span style="color: #6b7280; font-size: 14px;">-${formatCurrency(invoice.discountAmount, business.currency)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Amount After Discount:</span>
                <span style="color: #6b7280; font-size: 14px;">${formatCurrency(invoice.subtotal - invoice.discountAmount, business.currency)}</span>
              </div>
            ` : ''}
            ${invoice.taxRate && invoice.taxRate > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Tax (${invoice.taxRate}%):</span>
                <span style="color: #6b7280; font-size: 14px;">${formatCurrency(invoice.taxAmount, business.currency)}</span>
              </div>
            ` : ''}
            <div style="border-top: 2px solid #d1d5db; padding-top: 12px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; color: #111827;">
                <span>Total:</span>
                <span>${formatCurrency(invoice.total, business.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
          <div style="margin-top: 40px; padding: 20px; border: 1px solid #d1d5db; background-color: #f9fafb; border-radius: 6px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #111827; font-size: 16px;">Notes:</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${invoice.notes}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">Thank you for your business!</p>
          <p style="margin: 0;">This is an automated invoice from ${business.name}.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

export function generateInvoiceEmailText(data: EmailTemplateData): string {
  const { invoice, business } = data;
  
  const itemsText = invoice.items.map(item => 
    `${item.productName} - ${item.description || 'No description'} - Qty: ${item.quantity} - Price: ${formatCurrency(item.unitPrice, business.currency)} - Total: ${formatCurrency(item.total, business.currency)}`
  ).join('\n');

  return `
INVOICE ${invoice.invoiceNumber}

From: ${business.name}
${business.address && business.address.street ? `${business.address.street}, ${business.address.city || ''}, ${business.address.state || ''} ${business.address.zipCode || ''}` : ''}
Phone: ${business.phone || ''} | Email: ${business.email || ''}

Bill To: ${invoice.customerName}
${invoice.customerEmail ? `Email: ${invoice.customerEmail}` : ''}
${invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : ''}
${invoice.customerAddress && invoice.customerAddress.street ? `
Address:
${invoice.customerAddress.street}
${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zipCode}
${invoice.customerAddress.country}
` : ''}

Invoice Details:
Invoice #: ${invoice.invoiceNumber}
Date: ${formatDate(invoice.createdAt)}
${invoice.dueDate ? `Due Date: ${formatDate(invoice.dueDate)}` : ''}

Items:
${itemsText}

Summary:
Subtotal: ${formatCurrency(invoice.subtotal, business.currency)}
${invoice.discountRate && invoice.discountRate > 0 ? `Discount (${invoice.discountRate}%): -${formatCurrency(invoice.discountAmount, business.currency)}` : ''}
${invoice.taxRate && invoice.taxRate > 0 ? `Tax (${invoice.taxRate}%): ${formatCurrency(invoice.taxAmount, business.currency)}` : ''}
Total: ${formatCurrency(invoice.total, business.currency)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!
  `.trim();
} 