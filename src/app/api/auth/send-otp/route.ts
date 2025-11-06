import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { storeOTP, normalizePhoneNumber } from "@/lib/otp-store";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

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
    
    // Store OTP with normalized phone number
    storeOTP(normalizedPhone, otp);
    console.log(`[Send OTP] OTP stored for ${normalizedPhone}: ${otp}`);

    // Check if Twilio is configured
    const twilioConfigured = accountSid && authToken && phoneNumber;
    console.log(`[Send OTP] Twilio configured: ${twilioConfigured}`);
    console.log(`[Send OTP] Environment: ${process.env.NODE_ENV}`);

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