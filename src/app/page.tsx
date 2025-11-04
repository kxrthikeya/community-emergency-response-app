"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, List, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import EmergencyContactsDialog from "@/components/EmergencyContactsDialog";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <h1 className="text-2xl font-bold">EmergencyConnect</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/emergencies">
                <Button variant="outline" className="gap-2">
                  <List className="h-4 w-4" />
                  View Emergencies
                </Button>
              </Link>
              <EmergencyContactsDialog />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <h2 className="text-5xl font-bold mb-4">EmergencyConnect</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report emergencies instantly. Get help faster. Save lives together.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          <Link href="/login" className="w-full">
            <Button size="lg" className="w-full text-lg">
              Sign In
            </Button>
          </Link>
          
          <Link href="/register" className="w-full">
            <Button size="lg" variant="outline" className="w-full text-lg">
              Create Account
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground text-center mt-4">
            In an emergency? View the emergency feed or call emergency services directly.
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