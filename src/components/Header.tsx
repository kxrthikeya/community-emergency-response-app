import { Button } from "@/components/ui/button";
import { AlertTriangle, List, Users, Settings, LogOut, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import EmergencyContactsDialog from "@/components/EmergencyContactsDialog";
import { signOut } from "next-auth/react";

interface HeaderProps {
  user?: {
    name?: string | null;
    phoneNumber?: string | null;
    isGuest?: boolean;
    role?: string;
  } | null;
  showAuth?: boolean;
}

export default function Header({ user, showAuth = false }: HeaderProps) {
  const isResponder = user?.role === "emergency_responder" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">EmergencyConnect</h1>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {user.name || user.phoneNumber || "User"}
                  {user.isGuest && " (Guest)"}
                </p>
              )}
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {showAuth ? (
              <>
                <Link href="/emergencies">
                  <Button variant="outline" className="gap-2">
                    <List className="h-4 w-4" />
                    Emergency Feed
                  </Button>
                </Link>
                <EmergencyContactsDialog />
                {isResponder && (
                  <Link href="/responder">
                    <Button variant="outline" className="gap-2">
                      <Users className="h-4 w-4" />
                      Responder Dashboard
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Admin Settings
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/emergencies">
                  <Button variant="outline" className="gap-2">
                    <List className="h-4 w-4" />
                    View Emergencies
                  </Button>
                </Link>
                <EmergencyContactsDialog />
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
