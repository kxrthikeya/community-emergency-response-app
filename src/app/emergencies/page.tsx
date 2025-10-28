"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin, Clock, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Incident {
  id: number;
  emergencyType: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  status: string;
  severity: string;
  createdAt: string;
  photoUrl: string | null;
  userId: number | null;
}

const EMERGENCY_TYPE_LABELS: Record<string, string> = {
  fire: "🔥 Fire",
  medical: "🚑 Medical",
  crime: "🚔 Crime",
  disaster: "⚠️ Disaster",
  other: "📢 Other",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-700 border-red-200",
  responding: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

export default function EmergenciesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    fetchIncidents();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, [filterType, filterStatus, filterSeverity]);

  const fetchIncidents = async () => {
    try {
      let url = "/api/incidents?limit=50";
      
      if (filterType !== "all") {
        url += `&emergencyType=${filterType}`;
      }
      if (filterStatus !== "all") {
        url += `&status=${filterStatus}`;
      }
      if (filterSeverity !== "all") {
        url += `&severity=${filterSeverity}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setIncidents(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header user={session?.user} showAuth={!!session} />

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Emergency Feed
          </h2>
          <p className="text-muted-foreground mt-2">
            Real-time emergency reports from your community
          </p>
          {session && (
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Report Emergency
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="fire">🔥 Fire</SelectItem>
                    <SelectItem value="medical">🚑 Medical</SelectItem>
                    <SelectItem value="crime">🚔 Crime</SelectItem>
                    <SelectItem value="disaster">⚠️ Disaster</SelectItem>
                    <SelectItem value="other">📢 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="responding">Responding</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No emergencies found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {EMERGENCY_TYPE_LABELS[incident.emergencyType] || incident.emergencyType}
                        <Badge className={SEVERITY_COLORS[incident.severity] || ""}>
                          {incident.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTimeAgo(incident.createdAt)}
                        </span>
                        {incident.locationName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {incident.locationName}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[incident.status] || ""}>
                      {incident.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base mb-4">{incident.description}</p>
                  
                  {incident.photoUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden border">
                      <img
                        src={incident.photoUrl}
                        alt="Emergency photo"
                        className="w-full max-h-96 object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
                          "_blank"
                        );
                      }}
                    >
                      View on Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Info */}
        {!loading && incidents.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {incidents.length} emergencies • Auto-refreshing every 10 seconds
          </div>
        )}
      </div>
    </div>
  );
}