"use client";

import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Script from "next/script";

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
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);

  // Fetch incidents
  useEffect(() => {
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

  // Initialize Google Maps when loaded
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;

    // Request user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const accuracy = position.coords.accuracy;

          setUserLocation(userPos);

          // Initialize map centered on user location
          const map = new google.maps.Map(mapRef.current!, {
            center: userPos,
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          mapInstanceRef.current = map;

          // Create pulsing blue dot for user location
          createUserLocationMarker(map, userPos, accuracy);

          toast.success("Your location has been detected");
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not detect your location. Please enable location access.");

          // Initialize map with default center (India)
          const defaultCenter = { lat: 20.5937, lng: 78.9629 };
          const map = new google.maps.Map(mapRef.current!, {
            center: defaultCenter,
            zoom: 5,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          mapInstanceRef.current = map;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");

      // Initialize map with default center
      const defaultCenter = { lat: 20.5937, lng: 78.9629 };
      const map = new google.maps.Map(mapRef.current!, {
        center: defaultCenter,
        zoom: 5,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
    }
  }, [googleMapsLoaded]);

  // Add incident markers when map and data are ready
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return;

    // Clear existing incident markers (if needed)
    incidents.forEach((incident) => {
      createIncidentMarker(mapInstanceRef.current!, incident);
    });
  }, [incidents, loading]);

  const createUserLocationMarker = (
    map: google.maps.Map,
    position: { lat: number; lng: number },
    accuracy: number
  ) => {
    // Remove existing markers if any
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null);
    }

    // Create accuracy circle (light blue)
    accuracyCircleRef.current = new google.maps.Circle({
      map: map,
      center: position,
      radius: accuracy,
      strokeColor: "#4285F4",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#4285F4",
      fillOpacity: 0.1,
      clickable: false,
    });

    // Create pulsing blue dot using SymbolPath.CIRCLE
    userMarkerRef.current = new google.maps.Marker({
      map: map,
      position: position,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      title: "Your Location",
      zIndex: 1000,
    });

    // Add pulsing animation
    const pulsingAnimation = () => {
      let scale = 8;
      let growing = true;
      
      setInterval(() => {
        if (growing) {
          scale += 0.3;
          if (scale >= 12) growing = false;
        } else {
          scale -= 0.3;
          if (scale <= 8) growing = true;
        }
        
        if (userMarkerRef.current) {
          userMarkerRef.current.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: scale,
            fillColor: "#4285F4",
            fillOpacity: growing ? 1 - (scale - 8) / 8 : 0.7 + (12 - scale) / 8,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          });
        }
      }, 50);
    };

    pulsingAnimation();

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">Your Location</h3>
          <p style="font-size: 12px; color: #666;">
            Lat: ${position.lat.toFixed(6)}<br/>
            Lng: ${position.lng.toFixed(6)}<br/>
            Accuracy: ±${Math.round(accuracy)}m
          </p>
        </div>
      `,
    });

    userMarkerRef.current.addListener("click", () => {
      infoWindow.open(map, userMarkerRef.current!);
    });
  };

  const createIncidentMarker = (map: google.maps.Map, incident: Incident) => {
    // Create red marker (Google Maps default style)
    const marker = new google.maps.Marker({
      map: map,
      position: { lat: incident.latitude, lng: incident.longitude },
      title: incident.emergencyType.toUpperCase(),
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      },
    });

    // Create info window with incident details
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 300px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
            ${incident.emergencyType.toUpperCase()}
          </h3>
          
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Description:</p>
            <p style="font-size: 13px; color: #666;">${incident.description}</p>
          </div>

          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Location:</p>
            <p style="font-size: 13px; color: #666;">
              ${incident.locationName || "Unknown location"}
            </p>
            <p style="font-size: 11px; color: #999; margin-top: 4px;">
              ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}
            </p>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: #fee; color: #c00; font-weight: 500;">
              ${incident.severity}
            </span>
            <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: #eff; color: #06c; font-weight: 500;">
              ${incident.status}
            </span>
          </div>

          <button
            onclick="window.navigateToIncident(${incident.latitude}, ${incident.longitude}, '${incident.locationName || 'incident'}')"
            style="width: 100%; padding: 8px 16px; background: #4285F4; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;"
            ${!userLocation ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
          >
            🧭 Navigate to Location
          </button>
          
          ${!userLocation ? '<p style="font-size: 11px; color: #999; text-align: center; margin-top: 8px;">Enable location to navigate</p>' : ''}
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  };

  // Make navigation function globally available
  useEffect(() => {
    (window as any).navigateToIncident = (
      lat: number,
      lng: number,
      locationName: string
    ) => {
      if (!userLocation) {
        toast.error("Your location is not available. Please enable location services.");
        return;
      }

      const origin = `${userLocation.lat},${userLocation.lng}`;
      const destination = `${lat},${lng}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage(
          { type: "OPEN_EXTERNAL_URL", data: { url: googleMapsUrl } },
          "*"
        );
      } else {
        window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
      }

      toast.success(`Opening directions to ${locationName}`);
    };
  }, [userLocation]);

  if (loading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <>
      <Script
        src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"
        onLoad={() => setGoogleMapsLoaded(true)}
        strategy="afterInteractive"
      />
      <div className="w-full h-[500px] rounded-lg overflow-hidden border relative">
        <div ref={mapRef} className="w-full h-full" />
        {!googleMapsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
      </div>
    </>
  );
}