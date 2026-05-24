import { NextRequest, NextResponse } from "next/server";
import { app } from "@/lib/firebase/config";
import { getFirestore, doc, setDoc } from "firebase/firestore/lite";
import { sendOTPEmail } from "@/lib/mail";

const dbLite = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate OTP
    console.log(`[AUTH] Generating OTP for ${email}`);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Store OTP in Firestore
    console.log(`[AUTH] Storing OTP in Firestore using Lite SDK...`);
    await setDoc(doc(dbLite, "password_resets", email), {
      otp,
      expiresAt: expiresAt.toISOString(), // Use ISO string for maximum compatibility
      createdAt: new Date().toISOString()
    });

    // 3. Send Email
    console.log(`[AUTH] Sending OTP email via SMTP...`);
    await sendOTPEmail(email, otp);
    console.log(`[AUTH] OTP flow completed successfully`);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.error(`[AUTH] Forgot Password Error:`, error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
