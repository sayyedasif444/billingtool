import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Check if email credentials are configured
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Email configuration
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured) {
  // Check if custom SMTP settings are provided
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    // Use custom SMTP settings
    const port = parseInt(process.env.EMAIL_PORT);
    const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
    
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: port,
      secure: secure, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Use service-based configuration (Gmail, Outlook, etc.)
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if email is configured
    if (!isEmailConfigured) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' },
        { status: 500 }
      );
    }

    if (!transporter) {
      return NextResponse.json(
        { error: 'Email transporter not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      to, 
      subject, 
      htmlContent, 
      textContent
    } = body;

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, htmlContent' },
        { status: 400 }
      );
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || 'Please view this email in HTML format.',
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Email connection timed out. Please check your SMTP settings and try again.';
      } else if (error.message.includes('EAUTH')) {
        errorMessage = 'Email authentication failed. Please check your email credentials.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Email connection refused. Please check your SMTP host and port settings.';
      } else if (error.message.includes('ESOCKET')) {
        errorMessage = 'Email socket error. Please check your SMTP configuration.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 