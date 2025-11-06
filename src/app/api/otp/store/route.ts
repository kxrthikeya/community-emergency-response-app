import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/[^\d\+]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode, expiresAt } = body;

    if (!phoneNumber || !otpCode || !expiresAt) {
      return NextResponse.json(
        {
          error: 'phoneNumber, otpCode, and expiresAt are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    const newOtpRecord = await db
      .insert(otpCodes)
      .values({
        phoneNumber: normalizedPhoneNumber,
        otpCode: otpCode.toString(),
        expiresAt: parseInt(expiresAt.toString()),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}