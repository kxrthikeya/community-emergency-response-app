import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/[^\d\+]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber: userPhone } = await request.json();

    if (!userPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(userPhone);
    console.log(`[Send OTP] Original: ${userPhone}, Normalized: ${normalizedPhone}`);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    try {
      await db.insert(otpCodes).values({
        phoneNumber: normalizedPhone,
        otpCode: otp,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      console.log(`[Send OTP] OTP stored in database for ${normalizedPhone}: ${otp}`);
    } catch (error) {
      console.error('[Send OTP] Error storing OTP:', error);
      return NextResponse.json(
        { error: "Failed to store OTP" },
        { status: 500 }
      );
    }

    // Check if Twilio is configured
    const twilioConfigured = accountSid && authToken && phoneNumber;
    console.log(`[Send OTP] Twilio configured: ${twilioConfigured}`);

    let smsSent = false;
    let twilioError = null;

    // Try to send via Twilio if configured
    if (twilioConfigured) {
      try {
        console.log(`[Send OTP] Attempting to send SMS via Twilio...`);
        console.log(`[Send OTP] From: ${phoneNumber}, To: ${normalizedPhone}`);
        
        const client = twilio(accountSid, authToken);
        
        const message = await client.messages.create({
          body: `Your EmergencyConnect verification code is: ${otp}`,
          from: phoneNumber,
          to: normalizedPhone,
        });

        console.log(`[Send OTP] SMS sent successfully! Message SID: ${message.sid}`);
        smsSent = true;
      } catch (error: any) {
        twilioError = error;
        console.error("[Send OTP] Twilio error details:", {
          message: error?.message,
          code: error?.code,
          moreInfo: error?.moreInfo,
          status: error?.status,
        });
      }
    }

    // Always return success with OTP (for development/testing and as fallback)
    return NextResponse.json({
      success: true,
      message: smsSent ? "OTP sent via SMS" : "OTP sent successfully",
      otp: smsSent ? undefined : otp, // Only return OTP if SMS wasn't sent
      mode: smsSent ? "sms" : "console",
      twilioError: twilioError ? {
        message: twilioError.message,
        code: twilioError.code
      } : undefined,
    });
  } catch (error: any) {
    console.error("[Send OTP] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send OTP",
        details: error?.message 
      },
      { status: 500 }
    );
  }
}