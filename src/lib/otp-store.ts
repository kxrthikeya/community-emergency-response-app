// Simple in-memory OTP store for development
// In production, use Redis or database with TTL

interface OTPData {
  otp: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPData>();

// Clean up expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60000);

// Normalize phone number format
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all spaces, dashes, and parentheses
  return phoneNumber.replace(/[\s\-\(\)]/g, '');
}

export function storeOTP(phoneNumber: string, otp: string) {
  const normalized = normalizePhoneNumber(phoneNumber);
  console.log(`[OTP Store] Storing OTP for: ${normalized}`);
  otpStore.set(normalized, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

export function verifyOTP(phoneNumber: string, otp: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  console.log(`[OTP Verify] Looking up phone: ${normalized}, OTP: ${otp}`);
  console.log(`[OTP Verify] Store has keys:`, Array.from(otpStore.keys()));
  
  const data = otpStore.get(normalized);
  
  if (!data) {
    console.log(`[OTP Verify] No OTP found for ${normalized}`);
    return false;
  }
  
  if (data.expiresAt < Date.now()) {
    console.log(`[OTP Verify] OTP expired for ${normalized}`);
    otpStore.delete(normalized);
    return false;
  }
  
  if (data.otp === otp) {
    console.log(`[OTP Verify] OTP valid for ${normalized}`);
    otpStore.delete(normalized);
    return true;
  }
  
  console.log(`[OTP Verify] OTP mismatch for ${normalized}. Expected: ${data.otp}, Got: ${otp}`);
  return false;
}