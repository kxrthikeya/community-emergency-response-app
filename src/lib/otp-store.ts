// Simple in-memory OTP store for development
// In production, use Redis or database
interface OTPData {
  otp: string;
  phoneNumber: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPData>();

export const storeOTP = (phoneNumber: string, otp: string) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phoneNumber, { otp, phoneNumber, expiresAt });
  
  // Auto-cleanup expired OTPs
  setTimeout(() => {
    otpStore.delete(phoneNumber);
  }, 5 * 60 * 1000);
};

export const verifyOTP = (phoneNumber: string, otp: string): boolean => {
  const data = otpStore.get(phoneNumber);
  
  if (!data) {
    return false;
  }
  
  if (Date.now() > data.expiresAt) {
    otpStore.delete(phoneNumber);
    return false;
  }
  
  if (data.otp === otp) {
    otpStore.delete(phoneNumber); // One-time use
    return true;
  }
  
  return false;
};

export const getStoredOTP = (phoneNumber: string): string | null => {
  const data = otpStore.get(phoneNumber);
  if (!data || Date.now() > data.expiresAt) {
    return null;
  }
  return data.otp;
};