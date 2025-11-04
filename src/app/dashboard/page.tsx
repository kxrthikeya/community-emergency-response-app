"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/MapView";
import ReportEmergencyForm from "@/components/ReportEmergencyForm";
import Header from "@/components/Header";
import { AlertCircle, Map, Bell, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Incident {
  id: number;
  emergencyType: string;
  description: string;
  locationName: string | null;
  status: string;
  severity: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      // Fetch user's incidents
      const token = localStorage.getItem("bearer_token");
      fetch(`/api/incidents?userId=${session.user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setIncidents(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching incidents:", error);
          setLoading(false);
        });
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={session.user} showAuth={true} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Report
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="gap-2">
              <Bell className="h-4 w-4" />
              My Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Incident Map</CardTitle>
              </CardHeader>
              <CardContent>
                <MapView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-6 flex justify-center">
            <ReportEmergencyForm />
          </TabsContent>

          <TabsContent value="my-reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Emergency Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : incidents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No incidents reported yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="p-4 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {incident.emergencyType.toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {incident.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {incident.locationName}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                              {incident.severity}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              {incident.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}