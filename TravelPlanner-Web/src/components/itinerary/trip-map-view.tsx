/**
 * TravelPlanner Web - Trip Map View Component
 *
 * Shows all trip locations on a Google Map.
 * Uses Google Maps JavaScript API.
 */

"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import type { Trip, TripEvent, HotelEvent } from "@/lib/models";
import { isHotelEvent, isRestaurantEvent, isActivityEvent, isFlightEvent } from "@/lib/db";

interface TripMapViewProps {
  trip: Trip;
  events: TripEvent[];
  hotels: HotelEvent[];
}

// Map location marker type
interface MapMarker {
  id: string;
  type: "hotel" | "restaurant" | "activity" | "flight";
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export const TripMapView: React.FC<TripMapViewProps> = ({ trip, events, hotels }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);

  // Extract all locations from events and hotels
  const locations = React.useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [];

    // Add hotels
    hotels.forEach((hotel) => {
      if (hotel.hotelLatitude && hotel.hotelLongitude) {
        markers.push({
          id: hotel.id,
          type: "hotel",
          name: hotel.hotelName,
          lat: hotel.hotelLatitude,
          lng: hotel.hotelLongitude,
          color: "#9333ea", // purple
        });
      }
    });

    // Add events
    events.forEach((event) => {
      if (isRestaurantEvent(event)) {
        if (event.restaurantLatitude && event.restaurantLongitude) {
          markers.push({
            id: event.id,
            type: "restaurant",
            name: event.restaurantName,
            lat: event.restaurantLatitude,
            lng: event.restaurantLongitude,
            color: "#ef4444", // red
          });
        }
      } else if (isActivityEvent(event)) {
        if (event.activityLatitude && event.activityLongitude) {
          markers.push({
            id: event.id,
            type: "activity",
            name: event.activityLocationName || event.title,
            lat: event.activityLatitude,
            lng: event.activityLongitude,
            color: "#ef4444", // red (same as restaurant)
          });
        }
      } else if (isFlightEvent(event)) {
        // Add arrival airport
        if (event.arrivalLatitude && event.arrivalLongitude) {
          markers.push({
            id: `${event.id}-arrival`,
            type: "flight",
            name: event.arrivalAirportName || event.arrivalAirportIATA || "Airport",
            lat: event.arrivalLatitude,
            lng: event.arrivalLongitude,
            color: "#3b82f6", // blue
          });
        }
      }
    });

    return markers;
  }, [events, hotels]);

  // Load Google Maps JavaScript API
  React.useEffect(() => {
    if (isScriptLoaded) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError("Google Maps API key not configured");
      setIsLoading(false);
      return;
    }

    // Check if script is already loaded
    if ((window as any).google && (window as any).google.maps) {
      setIsScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define callback
    (window as any).initMap = () => {
      setIsScriptLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setLoadError("Failed to load Google Maps");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if ((window as any).initMap) {
        delete (window as any).initMap;
      }
    };
  }, [isScriptLoaded]);

  // Initialize map and add markers when script is loaded
  React.useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || locations.length === 0) return;

    const gm = (window as any).google.maps;

    // Initialize map
    const map = new gm.Map(mapRef.current, {
      center: { lat: locations[0].lat, lng: locations[0].lng },
      zoom: 12,
      mapTypeId: gm.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;

    // Create custom marker icons
    const createMarkerIcon = (color: string) => ({
      path: gm.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    });

    // Add markers
    const bounds = new gm.LatLngBounds();
    const markers: any[] = [];

    locations.forEach((location) => {
      const position = { lat: location.lat, lng: location.lng };
      const marker = new gm.Marker({
        position,
        map,
        title: location.name,
        icon: createMarkerIcon(location.color),
        animation: gm.Animation.DROP,
      });

      // Add info window
      const infoWindow = new gm.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <strong style="color: ${location.color}; font-size: 14px;">
              ${location.name}
            </strong>
            <div style="font-size: 12px; color: #666; margin-top: 4px; text-transform: capitalize;">
              ${location.type}
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markers.push(marker);
      bounds.extend(position);
    });

    markersRef.current = markers;

    // Fit map to show all markers
    if (locations.length > 1) {
      map.fitBounds(bounds);
    }

    return () => {
      // Cleanup markers
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [isScriptLoaded, locations]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading map...</p>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl">
        <MapPin className="w-8 h-8 text-slate-400 mb-3" />
        <p className="text-sm text-slate-500">{loadError}</p>
        <p className="text-xs text-slate-400 mt-1">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
        </p>
      </div>
    );
  }

  // Show empty state
  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-100 dark:bg-slate-800 rounded-xl">
        <MapPin className="w-8 h-8 text-slate-400 mb-3" />
        <p className="text-sm text-slate-500">No locations to display</p>
        <p className="text-xs text-slate-400 mt-1">
          Add events with locations to see them on the map
        </p>
      </div>
    );
  }

  // Show map
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm">
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
};
