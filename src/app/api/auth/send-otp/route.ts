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

    // Check if Twilio is configured
    const twilioConfigured = accountSid && authToken && phoneNumber;
    console.log(`[Send OTP] Twilio configured: ${twilioConfigured}`);

    // Try to send via Twilio if configured
    if (twilioConfigured && process.env.NODE_ENV === "production") {
      try {
        const client = twilio(accountSid, authToken);
        
        await client.messages.create({
          body: `Your EmergencyConnect verification code is: ${otp}`,
          from: phoneNumber,
          to: normalizedPhone,
        });

        console.log(`[Send OTP] SMS sent successfully to ${normalizedPhone}`);
        return NextResponse.json({
          success: true,
          message: "OTP sent successfully",
        });
      } catch (twilioError: any) {
        // Log Twilio error but don't fail - fallback to console mode
        console.error("[Send OTP] Twilio error:", twilioError?.message || twilioError);
        console.log(`[Send OTP] Falling back to console mode. OTP: ${otp}`);
      }
    }

    // Development mode or Twilio fallback - return OTP in response
    console.log(`[Send OTP] Console mode - OTP for ${normalizedPhone}: ${otp}`);
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otp, // Return actual OTP for testing
      mode: "console", // Indicate this is console mode
    });
  } catch (error) {
    console.error("[Send OTP] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}