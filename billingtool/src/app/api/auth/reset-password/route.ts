import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { app } from "@/lib/firebase/config";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore/lite";

const dbLite = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify OTP
    console.log(`[AUTH] Verifying OTP for ${email}...`);
    const resetDoc = await getDoc(doc(dbLite, "password_resets", email));
    
    if (!resetDoc.exists()) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
    }

    const data = resetDoc.data();
    const now = new Date();
    
    // Check expiration and correctness
    if (data?.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    const expiresAt = new Date(data?.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // 2. Update Password in Firebase Auth
    try {
      console.log(`[AUTH] Updating password for user: ${email}`);
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(user.uid, {
        password: newPassword
      });

      // 3. Cleanup OTP
      await deleteDoc(doc(dbLite, "password_resets", email));

      return NextResponse.json({ message: "Password updated successfully" });
    } catch (authError: any) {
      console.error(`[AUTH] Reset Password Auth Error:`, authError);
      return NextResponse.json({ error: "User not found or failed to update password" }, { status: 404 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Reset failed" }, { status: 500 });
  }
}
