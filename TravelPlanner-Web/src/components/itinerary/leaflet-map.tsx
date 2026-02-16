/**
 * TravelPlanner Web - Leaflet Map Component
 *
 * Internal component that uses Leaflet directly.
 * Dynamically imported to avoid SSR issues.
 */

"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { DayMapLocation } from "@/lib/models";

// Leaflet imports (only loaded on client)
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
// @ts-ignore - suppress TypeScript error for icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LeafletMapProps {
  locations: DayMapLocation[];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ locations }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  // Initialize map
  React.useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) return;

    // Create map if it doesn't exist
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, // Hide zoom controls for cleaner look
        attributionControl: false, // Hide attribution for cleaner look
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each location
    const markers: L.Marker[] = [];

    locations.forEach((loc) => {
      // Determine marker color based on type
      const markerColor =
        loc.type === "hotel" ? "#9333ea" : // purple
        loc.type === "restaurant" ? "#ef4444" : // red
        "#3b82f6"; // blue for flight

      // Create custom icon with color
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(loc.name);

      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 14 });
    }

    // Cleanup
    return () => {
      // Don't destroy map here, just clear markers
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            mapRef.current!.removeLayer(layer);
          }
        });
      }
    };
  }, [locations]);

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-48 z-0" />

      {/* Location markers overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 z-10">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="text-xs bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-md shadow-sm truncate max-w-full"
            title={loc.name}
          >
            <MapPin className={`w-3 h-3 inline-block mr-1 ${
              loc.type === "hotel" ? "text-purple-500" :
              loc.type === "restaurant" ? "text-red-500" :
              "text-blue-500"
            }`} />
            <span className="text-slate-700 dark:text-slate-300">{loc.name}</span>
          </div>
        ))}
      </div>
    </>
  );
};
