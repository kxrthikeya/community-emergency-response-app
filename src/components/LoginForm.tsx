"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("OTP sent successfully!");
        setStep("otp");
        // In dev mode, auto-fill OTP
        if (data.otp) {
          setOtp(data.otp);
          toast.info(`Dev Mode - OTP: ${data.otp}`);
        }
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("phone", {
        phoneNumber,
        otp,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        toast.error("Invalid or expired OTP. Please try again.");
        setOtp("");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      const result = await signIn("guest", { redirect: false });
      if (result?.ok) {
        toast.success("Entering as guest");
        router.push("/dashboard");
      } else {
        toast.error("Failed to enter as guest");
      }
    } catch (error) {
      console.error("Guest mode error:", error);
      toast.error("Failed to enter as guest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In to EmergencyConnect</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                />
                <Button
                  onClick={handleSendOTP}
                  disabled={!phoneNumber || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Mail className="h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={handleGuestMode}
              disabled={loading}
            >
              <UserPlus className="h-4 w-4" />
              Continue as Guest
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                OTP sent to {phoneNumber}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleVerifyOTP}
              disabled={!otp || otp.length < 6 || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              disabled={loading}
            >
              Back
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}