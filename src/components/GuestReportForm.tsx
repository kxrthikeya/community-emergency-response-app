"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, MapPin, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface GuestReportFormProps {
  onSuccess?: () => void;
}

export default function GuestReportForm({ onSuccess }: GuestReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    emergencyType: "",
    description: "",
    locationName: "",
    latitude: "",
    longitude: "",
    severity: "medium",
    photoUrl: "",
  });

  // Auto-get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success("Location detected automatically");
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Unable to get location. Please enter manually.");
        }
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setFormData((prev) => ({ ...prev, photoUrl: base64String }));
      toast.success("Image uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emergencyType || !formData.description) {
      toast.error("Please select emergency type and describe the situation");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error("Location is required. Please enable location access or enter manually.");
      return;
    }

    setLoading(true);

    try {
      // Create incident as guest (userId = null)
      const incidentRes = await fetch("/api/incidents", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          userId: null, // Guest report - no user ID
          locationName: formData.locationName || `${formData.latitude}, ${formData.longitude}`,
        }),
      });

      if (!incidentRes.ok) {
        throw new Error("Failed to report emergency");
      }

      // Send alert to emergency services
      await fetch("/api/twilio/alert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emergencyType: formData.emergencyType,
          description: `[GUEST REPORT] ${formData.description}`,
          locationName: formData.locationName || `${formData.latitude}, ${formData.longitude}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
          severity: formData.severity,
        }),
      });

      toast.success("Emergency reported successfully! Help is on the way.");
      
      // Reset form
      setFormData({
        emergencyType: "",
        description: "",
        locationName: "",
        latitude: "",
        longitude: "",
        severity: "medium",
        photoUrl: "",
      });
      setImagePreview(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to report emergency. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="emergencyType">Emergency Type *</Label>
        <Select
          value={formData.emergencyType}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, emergencyType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select emergency type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fire">🔥 Fire Emergency</SelectItem>
            <SelectItem value="medical">🚑 Medical Emergency</SelectItem>
            <SelectItem value="crime">🚨 Crime/Security</SelectItem>
            <SelectItem value="disaster">🌊 Natural Disaster</SelectItem>
            <SelectItem value="other">⚠️ Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the emergency situation..."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      {/* Optional Fields - Collapsed by default */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <p className="text-sm font-medium text-muted-foreground">Optional Details</p>
        
        <div className="space-y-2">
          <Label htmlFor="severity">Severity (defaults to Medium)</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, severity: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationName">Location Name</Label>
          <Input
            id="locationName"
            placeholder="e.g., Connaught Place, Delhi (optional)"
            value={formData.locationName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, locationName: e.target.value }))
            }
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label htmlFor="photo">Upload Photo</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Emergency preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="photo" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB
                </p>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Location Info - Auto-detected */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              {formData.latitude && formData.longitude ? "Location Detected" : "Getting Location..."}
            </p>
            {formData.latitude && formData.longitude ? (
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                {formData.latitude}, {formData.longitude}
              </p>
            ) : (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                onClick={getCurrentLocation}
              >
                Retry Location Detection
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Location Override (collapsed) */}
      {(!formData.latitude || !formData.longitude) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="28.6289"
              value={formData.latitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, latitude: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="77.2065"
              value={formData.longitude}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, longitude: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-destructive hover:bg-destructive/90"
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Reporting Emergency...
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Emergency Now
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your report will be submitted anonymously. Create an account to track updates.
      </p>
    </form>
  );
}