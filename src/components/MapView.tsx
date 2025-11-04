"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin } from "lucide-react";
import { toast } from "sonner";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

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
}

export default function MapView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    // Load Leaflet CSS
    import("leaflet/dist/leaflet.css").then(() => {
      setLeafletLoaded(true);
    });

    // Request user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userPos);
          setMapCenter(userPos);
          setMapZoom(13);
          toast.success("Your location has been detected");
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not detect your location. Showing default map view.");
        }
      );
    }

    // Fetch incidents
    fetch("/api/incidents?status=active&limit=50")
      .then((res) => res.json())
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching incidents:", error);
        setIncidents([]);
        setLoading(false);
      });

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetch("/api/incidents?status=active&limit=50")
        .then((res) => res.json())
        .then((data) => setIncidents(Array.isArray(data) ? data : []))
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const navigateToIncident = (lat: number, lng: number, locationName: string) => {
    if (!userLocation) {
      toast.error("Your location is not available. Please enable location services.");
      return;
    }

    // Create Google Maps URL with directions
    const origin = `${userLocation[0]},${userLocation[1]}`;
    const destination = `${lat},${lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    // Open in new tab (handles iframe context)
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.parent.postMessage(
        { type: "OPEN_EXTERNAL_URL", data: { url: googleMapsUrl } },
        "*"
      );
    } else {
      window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
    }
    
    toast.success(`Opening directions to ${locationName || "incident location"}`);
  };

  if (!leafletLoaded || loading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-bold text-sm">Your Location</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Incident Markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
          >
            <Popup maxWidth={300}>
              <div className="p-3">
                <h3 className="font-bold text-base mb-2">
                  {incident.emergencyType.toUpperCase()}
                </h3>
                
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Description:</p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Location:</p>
                  <p className="text-sm text-muted-foreground">
                    {incident.locationName || "Unknown location"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="flex gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                    {incident.severity}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                    {incident.status}
                  </span>
                </div>

                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigateToIncident(
                    incident.latitude,
                    incident.longitude,
                    incident.locationName || "incident"
                  )}
                  disabled={!userLocation}
                >
                  <Navigation className="h-4 w-4" />
                  Navigate to Location
                </Button>
                
                {!userLocation && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Enable location to navigate
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}