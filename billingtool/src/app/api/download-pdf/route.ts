import { NextResponse } from 'next/server'

interface InvoiceItem {
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id?: string
  invoiceNumber?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  createdAt?: string | number
  items?: InvoiceItem[]
  subtotal?: number
  discountRate?: number
  discountAmount?: number
  taxRate?: number
  taxAmount?: number
  total?: number
  notes?: string
}

interface Business {
  name?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  phone?: string
  email?: string
  currency?: string
  logo?: string
}

export async function POST(request: Request) {
  try {
    const {
      invoice,
      business,
      htmlContent,
    }: { invoice: Invoice; business: Business; htmlContent?: string } = await request.json()

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice data is required' },
        { status: 400 },
      )
    }

    // If HTML content is provided, use it for PDF generation
    if (htmlContent) {
      try {
        const puppeteer = await import('puppeteer-core')
        const chromium = await import('@sparticuz/chromium')
        
        const browser = await puppeteer.default.launch({
          args: chromium.default.args,
          defaultViewport: chromium.default.defaultViewport,
          executablePath: await chromium.default.executablePath(),
          headless: chromium.default.headless,
        })

        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
        })

        await browser.close()

        return new NextResponse(pdf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${
              invoice?.invoiceNumber || 'invoice'
            }.pdf"`,
          },
        })
      } catch (puppeteerError) {
        console.error('Puppeteer failed:', puppeteerError)
        // Fall back to jsPDF if Puppeteer fails
      }
    }

    // Fallback to jsPDF if no HTML content or Puppeteer fails
    const jsPDF = (await import('jspdf')).default
    const doc = new jsPDF()
    
    // Simple fallback content
    doc.setFontSize(12)
    doc.text(`Invoice: ${invoice?.invoiceNumber || ''}`, 20, 20)
    doc.text(`Business: ${business?.name || ''}`, 20, 30)
    doc.text(`Customer: ${invoice?.customerName || ''}`, 20, 40)
    doc.text(`Total: ${invoice?.total || 0}`, 20, 50)
    
    const pdfBytes = doc.output('arraybuffer')
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${
          invoice?.invoiceNumber || 'invoice'
        }.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: errorMessage },
      { status: 500 },
    )
  }
}
