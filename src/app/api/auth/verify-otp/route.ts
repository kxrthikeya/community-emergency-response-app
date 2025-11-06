import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, session, otpCodes } from "@/db/schema";
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

    // Find or create user in better-auth user table
    const email = `${normalizedPhone}@phone.local`; // Create email from phone
    let authUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!authUser) {
      // Create new user in better-auth table
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const result = await db.insert(user).values({
        id: userId,
        name: normalizedPhone,
        email: email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      authUser = result[0];
      console.log('[Verify OTP] Created new better-auth user:', authUser.id);
    } else {
      console.log('[Verify OTP] Found existing better-auth user:', authUser.id);
    }

    // Create session in better-auth session table
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const sessionToken = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(session).values({
      id: sessionId,
      userId: authUser.id,
      token: sessionToken,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    console.log('[Verify OTP] Created session:', sessionId);

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
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