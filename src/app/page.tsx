"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "@/components/LoginForm";
import EmergencyContactsDialog from "@/components/EmergencyContactsDialog";
import { AlertTriangle, List } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h1 className="text-5xl font-bold">EmergencyConnect</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report emergencies instantly. Get help faster. Save lives together.
          </p>
        </div>

        {/* Login and Emergency Contacts */}
        <div className="flex flex-col items-center gap-6">
          <LoginForm />
          
          <div className="flex items-center gap-4">
            <div className="h-px w-24 bg-border" />
            <EmergencyContactsDialog />
            <div className="h-px w-24 bg-border" />
          </div>

          <Link href="/emergencies">
            <Button variant="outline" size="lg" className="gap-2">
              <List className="h-5 w-5" />
              View Emergency Feed
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground text-center max-w-md">
            In an emergency? Use guest mode to report immediately or call
            emergency services directly.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>EmergencyConnect - Connecting communities in crisis</p>
          <p className="mt-2">
            🚨 For immediate emergencies, call 112 (India) 🚨
          </p>
        </div>
      </footer>
    </div>
  );
}