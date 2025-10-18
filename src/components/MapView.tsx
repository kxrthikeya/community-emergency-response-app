"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    // Load Leaflet CSS
    import("leaflet/dist/leaflet.css").then(() => {
      setLeafletLoaded(true);
    });

    // Fetch incidents
    fetch("/api/incidents?status=active&limit=50")
      .then((res) => res.json())
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching incidents:", error);
        setLoading(false);
      });

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetch("/api/incidents?status=active&limit=50")
        .then((res) => res.json())
        .then((data) => setIncidents(data))
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!leafletLoaded || loading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  const center: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">
                  {incident.emergencyType.toUpperCase()}
                </h3>
                <p className="text-xs mb-1">{incident.description}</p>
                <p className="text-xs text-muted-foreground">
                  {incident.locationName || "Unknown location"}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                    {incident.severity}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {incident.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}