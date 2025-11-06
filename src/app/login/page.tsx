"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isPending && session?.user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    }
  }, [session, isPending, router, searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number format (basic)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\s/g, "") }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send OTP");
        if (data.details) {
          console.error("OTP Send Error Details:", data.details);
        }
        return;
      }

      // Show success message
      if (data.mode === "sms") {
        toast.success("OTP sent via SMS!");
      } else {
        toast.success("OTP generated successfully!");
      }

      // Show OTP if returned (console mode or Twilio failed)
      if (data.otp) {
        toast.info(`Your OTP: ${data.otp}`, {
          duration: 10000, // Show for 10 seconds
        });
      }

      // Show Twilio error if present (but don't fail - OTP is still generated)
      if (data.twilioError) {
        console.warn("Twilio Error:", data.twilioError);
        toast.warning(`SMS failed (${data.twilioError.code}). Use OTP shown above.`, {
          duration: 8000,
        });
      }

      setOtpSent(true);
      setCountdown(60);
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.replace(/\s/g, ""), 
          otp 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Invalid OTP");
        return;
      }

      // Store token
      if (data.token) {
        localStorage.setItem("bearer_token", data.token);
      }

      toast.success("Login successful!");
      router.push(searchParams.get("redirect") || "/dashboard");
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: searchParams.get("redirect") || "/dashboard",
      });

      if (error?.code) {
        toast.error("Google sign-in failed");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to enter guest mode");
        return;
      }

      // Store guest token
      if (data.token) {
        localStorage.setItem("bearer_token", data.token);
      }

      toast.success("Guest mode activated");
      router.push("/emergencies");
    } catch (error) {
      console.error("Guest mode error:", error);
      toast.error("Failed to activate guest mode");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5EDE4]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5EDE4] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo and Title */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-lg">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">EmergencyConnect</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Report emergencies instantly. Get help faster. Save lives together.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-none shadow-lg bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-left">
              Sign In to EmergencyConnect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!otpSent ? (
              <>
                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 h-12 text-base"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSendOTP}
                      disabled={loading || !phoneNumber}
                      className="h-12 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* OTP Field */}
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Enter OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-12 text-base text-center text-2xl tracking-widest"
                      disabled={loading}
                      maxLength={6}
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        OTP sent to {phoneNumber}
                      </span>
                      {countdown > 0 ? (
                        <span className="text-gray-500">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                          }}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Change Number
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium text-base"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Verify & Sign In"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500 font-medium">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 font-medium text-base"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Mail className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>

            {/* Guest Mode */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 font-medium text-base"
              onClick={handleGuestMode}
              disabled={loading}
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Continue as Guest
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <div className="mt-6 space-y-3">
          <Button
            variant="default"
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
            onClick={() => router.push("/emergencies")}
          >
            <Phone className="mr-2 h-5 w-5" />
            Emergency Contacts
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 border-2 font-medium text-base bg-white"
            onClick={() => router.push("/emergencies")}
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            View Emergency Feed
          </Button>
        </div>

        {/* Emergency Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            In an emergency? Use guest mode to report immediately or call emergency services directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5EDE4]">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}