import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, normalizePhoneNumber } from "@/lib/otp-store";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log(`[Verify OTP] Original: ${phoneNumber}, Normalized: ${normalizedPhone}, OTP: ${otp}`);

    // Verify OTP
    const isValid = verifyOTP(normalizedPhone, otp);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, normalizedPhone),
    });

    if (!user) {
      // Create new user
      const result = await db.insert(users).values({
        phoneNumber: normalizedPhone,
        role: "citizen",
        isGuest: false,
        createdAt: new Date().toISOString(),
      }).returning();
      
      user = result[0];
    }

    // Generate session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36)}`;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
      },
      token: sessionToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}