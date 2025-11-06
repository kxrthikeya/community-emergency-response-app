import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, otpCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/[^\d\+]/g, '');
}

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

    // Verify OTP from database
    const otpRecords = await db.select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneNumber, normalizedPhone),
          eq(otpCodes.otpCode, otp)
        )
      )
      .limit(1);

    if (otpRecords.length === 0) {
      console.log('[Verify OTP] No matching OTP found');
      return NextResponse.json(
        { error: "Invalid OTP or phone number" },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];
    const currentTime = Date.now();
    const isExpired = otpRecord.expiresAt <= currentTime;

    // Delete OTP after verification attempt
    await db.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
    console.log('[Verify OTP] OTP deleted from database');

    if (isExpired) {
      console.log('[Verify OTP] OTP has expired');
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    console.log('[Verify OTP] OTP is valid');

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
      console.log('[Verify OTP] Created new user:', user.id);
    } else {
      console.log('[Verify OTP] Found existing user:', user.id);
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