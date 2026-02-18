/**
 * TravelPlanner Web - Trip Map View Component
 *
 * Shows all trip locations on a Google Map.
 * Uses Google Maps JavaScript API.
 */

"use client";

import * as React from "react";
import { MapPin, Loader2, Calendar } from "lucide-react";
import type { Trip, TripEvent, HotelEvent } from "@/lib/models";
import { parseCities } from "@/lib/models";
import { isHotelEvent, isRestaurantEvent, isActivityEvent, isFlightEvent } from "@/lib/db";
import { format, parseISO, addDays } from "date-fns";
import { Button } from "@/components/ui/button";

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
  date?: string; // ISO date string for filtering
}

// Helper to check if airport name contains a city name
function airportIsInCity(airportName: string, cities: string[]): boolean {
  const airportNameLower = airportName.toLowerCase();
  return cities.some(city => airportNameLower.includes(city.toLowerCase()));
}

export const TripMapView: React.FC<TripMapViewProps> = ({ trip, events, hotels }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Generate array of trip dates for filter
  const tripDates = React.useMemo(() => {
    const dates: string[] = [];
    let current = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);

    while (current <= end) {
      dates.push(format(current, "yyyy-MM-dd"));
      current = addDays(current, 1);
    }

    return dates;
  }, [trip.startDate, trip.endDate]);

  // Extract all locations from events and hotels
  const allLocations = React.useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [];
    const tripCities = parseCities(trip.citiesRaw);

    // Add hotels (show on all dates they cover)
    hotels.forEach((hotel) => {
      if (hotel.hotelLatitude && hotel.hotelLongitude) {
        markers.push({
          id: hotel.id,
          type: "hotel",
          name: hotel.hotelName,
          lat: hotel.hotelLatitude,
          lng: hotel.hotelLongitude,
          color: "#9333ea", // purple
          date: hotel.checkInDate,
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
            date: event.reservationTime,
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
            date: event.startDate,
          });
        }
      } else if (isFlightEvent(event)) {
        // Only add arrival airport if it's in the target cities
        const arrivalName = event.arrivalAirportName || event.arrivalAirportIATA || "Airport";
        if (event.arrivalLatitude && event.arrivalLongitude) {
          // Check if airport is in one of the trip cities
          if (airportIsInCity(arrivalName, tripCities)) {
            markers.push({
              id: `${event.id}-arrival`,
              type: "flight",
              name: arrivalName,
              lat: event.arrivalLatitude,
              lng: event.arrivalLongitude,
              color: "#3b82f6", // blue
              date: event.startDate,
            });
          }
        }
      }
    });

    return markers;
  }, [events, hotels, trip.citiesRaw]);

  // Filter locations by selected date
  const locations = React.useMemo((): MapMarker[] => {
    if (!selectedDate) {
      return allLocations;
    }

    return allLocations.filter(marker => {
      if (!marker.date) return false;
      const markerDate = marker.date.substring(0, 10);
      return markerDate === selectedDate;
    });
  }, [allLocations, selectedDate]);

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

  // Get default map center from first trip city
  const [defaultCenter, setDefaultCenter] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (!isScriptLoaded) return;
    const tripCities = parseCities(trip.citiesRaw);
    if (tripCities.length === 0) return;

    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: tripCities[0] }, (results: any, status: string) => {
      if (status === "OK" && results && results.length > 0) {
        const location = results[0].geometry.location;
        setDefaultCenter({ lat: location.lat(), lng: location.lng() });
      }
    });
  }, [isScriptLoaded, trip.citiesRaw]);

  // Initialize map and add markers when script is loaded
  React.useEffect(() => {
    if (!isScriptLoaded || !mapRef.current) return;

    const gm = (window as any).google.maps;

    // Determine map center
    let center: { lat: number; lng: number };
    if (locations.length > 0) {
      center = { lat: locations[0].lat, lng: locations[0].lng };
    } else if (defaultCenter) {
      center = defaultCenter;
    } else {
      center = { lat: 0, lng: 0 };
    }

    // Initialize map
    const map = new gm.Map(mapRef.current, {
      center,
      zoom: locations.length > 0 ? 12 : 10,
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
      scale: 6, // Reduced from 10 for smaller dots
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
  }, [isScriptLoaded, locations, defaultCenter]);

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

  // Show map with filters (even when no locations)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm">
      {/* Date filter controls */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300 mr-2">Filter by date:</span>
          <Button
            variant={!selectedDate ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedDate(null)}
          >
            All dates
          </Button>
          {tripDates.map(date => {
            const dateObj = parseISO(date);
            const formattedDate = format(dateObj, "MMM d");
            return (
              <Button
                key={date}
                variant={selectedDate === date ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedDate(date)}
              >
                {formattedDate}
              </Button>
            );
          })}
        </div>
        {selectedDate && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Showing {locations.length} location{locations.length !== 1 ? 's' : ''} for {format(parseISO(selectedDate), "MMM d, yyyy")}
          </div>
        )}
      </div>
      <div className="relative">
        <div ref={mapRef} className="w-full h-[500px]" />
        {/* Empty state overlay when no locations for selected date */}
        {isScriptLoaded && locations.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 pointer-events-none">
            <MapPin className="w-8 h-8 text-slate-400 mb-3" />
            <p className="text-sm text-slate-500">No locations for this date</p>
            <p className="text-xs text-slate-400 mt-1">
              Select a different date or add events with locations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
