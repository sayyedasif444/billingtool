import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, body: emailBody, type, document: doc, secret, pdfBase64 } = body;

    console.log(`[MAIL_API] Attempting to send email to: ${to}, subject: ${subject}`);
    console.log(`[MAIL_API] Received secret: ${secret ? '***' + secret.slice(-4) : 'MISSING'}`);
    console.log(`[MAIL_API] Expected secret: ${process.env.NEXT_PUBLIC_PDF_SECRET ? '***' + process.env.NEXT_PUBLIC_PDF_SECRET.slice(-4) : 'MISSING'}`);

    // Check secret for security
    if (secret !== process.env.PDF_SECRET && secret !== process.env.NEXT_PUBLIC_PDF_SECRET) {
      console.warn("[MAIL_AUTH_FAILED] Invalid secret provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!to || !subject) {
      return NextResponse.json({ error: "To and Subject are required" }, { status: 400 });
    }

    // Send Email
    await sendEmail({
      to,
      subject,
      text: emailBody,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${emailBody}</div>`,
      attachments: pdfBase64 ? [
        {
          filename: `${type === "QT" ? "Quotation" : "Invoice"}_${doc?.quotationNumber || doc?.invoiceNumber || "document"}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: "application/pdf"
        }
      ] : []
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("[MAIL_API_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
