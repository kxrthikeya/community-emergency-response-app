"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MapPin, Camera, Loader2, X, Upload } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ReportEmergencyForm() {
  const { data: session } = useSession();
  const router = useRouter();
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

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success("Location detected successfully");
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
    
    if (!formData.emergencyType || !formData.description || !formData.latitude || !formData.longitude) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Create incident
      const incidentRes = await fetch("/api/incidents", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          userId: session?.user?.id || null,
        }),
      });

      const incident = await incidentRes.json();

      // Send alert to emergency services
      await fetch("/api/twilio/alert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emergencyType: formData.emergencyType,
          description: formData.description,
          locationName: formData.locationName,
          latitude: formData.latitude,
          longitude: formData.longitude,
          severity: formData.severity,
        }),
      });

      toast.success("Emergency reported successfully! Help is on the way.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to report emergency. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Report Emergency
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="severity">Severity *</Label>
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the emergency situation..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name *</Label>
            <Input
              id="locationName"
              placeholder="e.g., Connaught Place, Delhi"
              value={formData.locationName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, locationName: e.target.value }))
              }
            />
          </div>

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

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={getCurrentLocation}
          >
            <MapPin className="h-4 w-4" />
            Use Current Location
          </Button>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Upload Photo (optional)</Label>
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reporting...
              </>
            ) : (
              "Report Emergency"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}