import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { emergencyContacts } from "@/db/schema";
import { eq } from "drizzle-orm";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Map emergency types to service types
const emergencyToServiceMap: Record<string, string> = {
  fire: "fire",
  medical: "ambulance",
  crime: "police",
  disaster: "disaster_management",
  other: "national_emergency",
};

export async function POST(request: NextRequest) {
  try {
    const {
      emergencyType,
      description,
      locationName,
      latitude,
      longitude,
      severity,
    } = await request.json();

    if (!emergencyType || !description || !locationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get appropriate emergency contact
    const serviceType = emergencyToServiceMap[emergencyType] || "national_emergency";
    
    const contacts = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.serviceType, serviceType))
      .limit(1);

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No emergency contact found for this type" },
        { status: 404 }
      );
    }

    const contact = contacts[0];
    const emergencyPhone = contact.phoneNumber;

    // Create alert message
    const message = `🚨 EMERGENCY ALERT
Type: ${emergencyType.toUpperCase()}
Severity: ${severity || "MEDIUM"}
Location: ${locationName}
Coordinates: ${latitude}, ${longitude}
Details: ${description}

This is an automated alert from EmergencyConnect.`;

    const results = {
      sms: null as any,
      voice: null as any,
    };

    // Development mode - just log
    if (process.env.NODE_ENV === "development" || !accountSid || !authToken) {
      console.log("📱 Emergency Alert (Dev Mode)");
      console.log("To:", emergencyPhone);
      console.log("Message:", message);
      
      return NextResponse.json({
        success: true,
        message: "Alert sent (dev mode)",
        contact: contact.serviceName,
        phone: emergencyPhone,
      });
    }

    const client = twilio(accountSid, authToken);

    // Send SMS
    try {
      results.sms = await client.messages.create({
        body: message,
        from: twilioPhone,
        to: emergencyPhone,
      });
    } catch (error) {
      console.error("SMS error:", error);
    }

    // Make voice call for critical emergencies
    if (severity === "critical" || severity === "high") {
      try {
        results.voice = await client.calls.create({
          twiml: `<Response>
            <Say voice="alice" language="en-IN">
              Emergency alert. ${emergencyType} emergency reported at ${locationName}. 
              Severity level: ${severity}. 
              Description: ${description}. 
              Please respond immediately.
            </Say>
            <Pause length="2"/>
            <Say voice="alice" language="en-IN">
              For more details, check your SMS messages.
            </Say>
          </Response>`,
          from: twilioPhone,
          to: emergencyPhone,
        });
      } catch (error) {
        console.error("Voice call error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Alert sent successfully",
      contact: contact.serviceName,
      phone: emergencyPhone,
      smsStatus: results.sms?.status,
      callStatus: results.voice?.status,
    });
  } catch (error) {
    console.error("Alert error:", error);
    return NextResponse.json(
      { error: "Failed to send alert" },
      { status: 500 }
    );
  }
}