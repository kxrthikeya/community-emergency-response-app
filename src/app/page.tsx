"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Immediate redirect after 2 seconds, no session check
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-3">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto" />
          <h1 className="text-4xl font-bold text-gray-900">EmergencyConnect</h1>
          <p className="text-lg text-gray-600">Real-time Emergency Reporting System</p>
        </div>
        
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto" />
          <p className="text-sm text-gray-600">Redirecting to login in {countdown}s...</p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Button 
            onClick={() => router.push("/login")}
            className="bg-red-600 hover:bg-red-700"
          >
            Go to Login Now
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/emergencies")}
          >
            View Emergencies
          </Button>
        </div>
      </div>
    </div>
  );
}