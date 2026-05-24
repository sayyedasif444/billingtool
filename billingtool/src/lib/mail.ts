import nodemailer from "nodemailer";

console.log(`[MAIL] Initializing transporter with ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

export async function sendEmail({ 
  to, 
  subject, 
  text, 
  html, 
  attachments 
}: { 
  to: string; 
  subject: string; 
  text?: string; 
  html?: string; 
  attachments?: any[] 
}) {
  const mailOptions = {
    from: `"Dev & Debate" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAIL] Error sending email:`, error);
    throw error;
  }
}

export async function sendOTPEmail(email: string, otp: string) {
  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Please use the following OTP to complete the process:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 Dev & Debate. All rights reserved.</p>
      </div>
    `;
  
  return sendEmail({
    to: email,
    subject: "Reset Your Password - OTP",
    html
  });
}
