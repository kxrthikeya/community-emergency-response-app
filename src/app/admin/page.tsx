"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EmergencyContact {
  id: number;
  serviceType: string;
  serviceName: string;
  phoneNumber: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated" && session.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session.user?.role === "admin") {
      fetchContacts();
    }
  }, [status, session]);

  const fetchContacts = () => {
    fetch("/api/emergency-contacts?isActive=true&limit=100")
      .then((res) => res.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching contacts:", error);
        setLoading(false);
      });
  };

  const handleUpdateContact = async (id: number, updates: Partial<EmergencyContact>) => {
    setSaving(true);
    try {
      await fetch(`/api/emergency-contacts?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await fetchContacts();
      alert("Contact updated successfully");
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("Failed to update contact");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    await handleUpdateContact(id, { isActive: !isActive });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={session?.user} showAuth={true} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure emergency service contacts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Service Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{contact.serviceName}</h3>
                  <Button
                    variant={contact.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(contact.id, contact.isActive)}
                  >
                    {contact.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={contact.serviceName}
                      onChange={(e) => {
                        const newContacts = contacts.map((c) =>
                          c.id === contact.id
                            ? { ...c, serviceName: e.target.value }
                            : c
                        );
                        setContacts(newContacts);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={contact.phoneNumber}
                      onChange={(e) => {
                        const newContacts = contacts.map((c) =>
                          c.id === contact.id
                            ? { ...c, phoneNumber: e.target.value }
                            : c
                        );
                        setContacts(newContacts);
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() =>
                    handleUpdateContact(contact.id, {
                      serviceName: contact.serviceName,
                      phoneNumber: contact.phoneNumber,
                    })
                  }
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}