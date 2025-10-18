import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { storeOTP } from "@/lib/otp-store";

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    storeOTP(userPhone, otp);

    // In development, return the OTP for easy testing
    if (process.env.NODE_ENV === "development" || !accountSid || !authToken) {
      console.log(`OTP for ${userPhone}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent (dev mode)",
        otp, // Return actual OTP in dev
      });
    }

    // Send OTP via Twilio SMS
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: `Your EmergencyConnect verification code is: ${otp}`,
      from: phoneNumber,
      to: userPhone,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}