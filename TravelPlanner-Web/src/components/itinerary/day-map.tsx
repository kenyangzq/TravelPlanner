/**
 * TravelPlanner Web - Day Map Component
 *
 * Shows a map view with relevant locations for the day.
 * Displays hotels, restaurants, and flight arrival airports (filtered by day's city).
 * Uses Leaflet + OpenStreetMap (free, no API key required).
 */

"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { DayMapLocation } from "@/lib/models";
import dynamic from "next/dynamic";

// Dynamically import Leaflet to avoid SSR issues
const LeafletMap = dynamic(() => import("./leaflet-map").then(m => ({ default: m.LeafletMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
      <div className="text-slate-400 text-sm">Loading map...</div>
    </div>
  ),
});

interface DayMapProps {
  locations: DayMapLocation[];
  className?: string;
}

export const DayMap: React.FC<DayMapProps> = ({ locations, className = "" }) => {
  if (locations.length === 0) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl h-48 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No locations to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      <LeafletMap locations={locations} />
    </div>
  );
};

/**
 * Extract map locations from day items
 */
export function extractDayMapLocations(
  items: any[],
  dayHotel: any,
  tripCities: string[]
): DayMapLocation[] {
  const locations: DayMapLocation[] = [];

  // Add hotel location if available
  if (dayHotel?.hotel?.hotelLatitude && dayHotel?.hotel?.hotelLongitude) {
    locations.push({
      id: dayHotel.hotel.id,
      type: "hotel",
      name: dayHotel.hotel.hotelName,
      latitude: dayHotel.hotel.hotelLatitude,
      longitude: dayHotel.hotel.hotelLongitude,
    });
  }

  // Process events
  for (const item of items) {
    const event = item.event;

    if (event.eventType === "restaurant") {
      if (event.restaurantLatitude && event.restaurantLongitude) {
        locations.push({
          id: event.id,
          type: "restaurant",
          name: event.restaurantName,
          latitude: event.restaurantLatitude,
          longitude: event.restaurantLongitude,
        });
      }
    } else if (event.eventType === "activity") {
      if (event.latitude && event.longitude) {
        locations.push({
          id: event.id,
          type: "restaurant", // Use restaurant color for activities
          name: event.title,
          latitude: event.latitude,
          longitude: event.longitude,
        });
      }
    } else if (event.eventType === "flight") {
      // For flights, only show the airport that matches the day's primary city
      const dayCity = determineDayCity(items, dayHotel, tripCities);

      // Check if arrival airport matches day city
      if (
        event.arrivalLatitude &&
        event.arrivalLongitude &&
        dayCity &&
        airportMatchesCity(event.arrivalAirportName, dayCity)
      ) {
        locations.push({
          id: `${event.id}-arrival`,
          type: "flight",
          name: `${event.arrivalAirportIATA || event.arrivalAirportName}`,
          latitude: event.arrivalLatitude,
          longitude: event.arrivalLongitude,
        });
      }
      // Check if departure airport matches day city
      else if (
        event.departureLatitude &&
        event.departureLongitude &&
        dayCity &&
        airportMatchesCity(event.departureAirportName, dayCity)
      ) {
        locations.push({
          id: `${event.id}-departure`,
          type: "flight",
          name: `${event.departureAirportIATA || event.departureAirportName}`,
          latitude: event.departureLatitude,
          longitude: event.departureLongitude,
        });
      }
    }
  }

  return locations;
}

/**
 * Determine the primary city for a day based on hotel location
 */
function determineDayCity(items: any[], dayHotel: any, tripCities: string[]): string | null {
  // Use hotel address to determine city
  if (dayHotel?.hotel?.hotelAddress) {
    const hotelCity = extractCityFromAddress(dayHotel.hotel.hotelAddress);
    if (hotelCity) return hotelCity;
  }

  // Fall back to first trip city
  if (tripCities.length > 0) {
    return tripCities[0];
  }

  return null;
}

/**
 * Check if an airport name matches a city
 */
function airportMatchesCity(airportName: string, city: string): boolean {
  if (!airportName || !city) return false;

  const normalizedCity = city.toLowerCase().trim();
  const normalizedAirport = airportName.toLowerCase();

  // Check if airport name contains city name
  if (normalizedAirport.includes(normalizedCity)) {
    return true;
  }

  // Common patterns: city name variations
  const cityVariations = [
    normalizedCity,
    normalizedCity.replace(/\s+/g, ""), // remove spaces
    normalizedCity.replace(/\s+/g, "-"), // spaces to dashes
  ];

  for (const variation of cityVariations) {
    if (normalizedAirport.includes(variation)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract city name from address string
 */
function extractCityFromAddress(address: string): string | null {
  if (!address) return null;

  // Simple extraction: take the first meaningful part before comma
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    // Usually city is the second part (e.g., "123 Main St, New York, NY")
    return parts[1];
  }

  return parts[0] || null;
}
