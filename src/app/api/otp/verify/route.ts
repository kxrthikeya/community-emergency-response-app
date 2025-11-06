import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/[^\d+]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode } = body;

    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { 
          error: "phoneNumber and otpCode are required",
          code: "MISSING_FIELDS" 
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const otpRecords = await db.select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneNumber, normalizedPhone),
          eq(otpCodes.otpCode, otpCode)
        )
      )
      .limit(1);

    if (otpRecords.length === 0) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          reason: "Invalid OTP or phone number"
        },
        { status: 200 }
      );
    }

    const otpRecord = otpRecords[0];
    const currentTime = Date.now();
    const isExpired = otpRecord.expiresAt <= currentTime;

    await db.delete(otpCodes)
      .where(eq(otpCodes.id, otpRecord.id));

    if (isExpired) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          reason: "OTP has expired"
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}