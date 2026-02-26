/**
 * TravelPlanner Web - Import Service
 *
 * Parses Google Maps direction URLs and coordinate lists to extract locations.
 * Supports importing as activity events or saved places.
 */

import { geocodeAddress } from "./googlePlacesService";
import { createDefaultActivityEvent, db, dbHelpers } from "../db";
import type { ActivityEvent, SavedPlace } from "../models";

export interface ParsedLocation {
  raw: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  googlePlaceName?: string;
  googlePlaceId?: string;
  isGeocoded: boolean;
}

/**
 * Parse a Google Maps directions URL to extract waypoints.
 *
 * Supports formats:
 * - https://www.google.com/maps/dir/Place1/Place2/Place3/@lat,lng,zoom
 * - https://maps.google.com/maps/dir/Place1/Place2
 * - Encoded + signs (e.g., Tokyo+Station)
 */
export function parseGoogleMapsUrl(url: string): ParsedLocation[] {
  try {
    // Normalize the URL
    const trimmed = url.trim();

    // Match the /dir/ portion of the URL
    const dirMatch = trimmed.match(/\/maps\/dir\/(.+)/);
    if (!dirMatch) return [];

    let pathPart = dirMatch[1];

    // Remove query string and hash
    pathPart = pathPart.split("?")[0].split("#")[0];

    // Split into segments
    const segments = pathPart.split("/").filter((s) => s.length > 0);

    const locations: ParsedLocation[] = [];

    for (const segment of segments) {
      // Skip the @lat,lng,zoom segment
      if (segment.startsWith("@")) continue;

      // Skip empty/data segments
      if (segment.startsWith("data=")) continue;

      // Decode the segment: replace + with space, decode URI components
      let name = segment.replace(/\+/g, " ");
      try {
        name = decodeURIComponent(name);
      } catch {
        // If decoding fails, use as-is
      }

      // Check if the segment is coordinates (lat,lng)
      const coordMatch = name.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        locations.push({
          raw: segment,
          name: `${coordMatch[1]}, ${coordMatch[2]}`,
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
          isGeocoded: true,
        });
      } else {
        locations.push({
          raw: segment,
          name: name.trim(),
          isGeocoded: false,
        });
      }
    }

    return locations;
  } catch (error) {
    console.error("Failed to parse Google Maps URL:", error);
    return [];
  }
}

/**
 * Parse a text block of coordinates or place names (one per line).
 *
 * Supports:
 * - "35.6762, 139.6503" (coordinate pairs)
 * - "35.6762,139.6503" (no space)
 * - "Tokyo Tower" (place name)
 * - "Place Name, 35.6762, 139.6503" (name with coordinates)
 */
export function parseCoordinateText(text: string): ParsedLocation[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const locations: ParsedLocation[] = [];

  for (const line of lines) {
    // Try: "Name, lat, lng" format
    const namedCoordMatch = line.match(
      /^(.+?),\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
    );
    if (namedCoordMatch) {
      locations.push({
        raw: line,
        name: namedCoordMatch[1].trim(),
        latitude: parseFloat(namedCoordMatch[2]),
        longitude: parseFloat(namedCoordMatch[3]),
        isGeocoded: true,
      });
      continue;
    }

    // Try: "lat, lng" format
    const coordMatch = line.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      locations.push({
        raw: line,
        name: `${coordMatch[1]}, ${coordMatch[2]}`,
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
        isGeocoded: true,
      });
      continue;
    }

    // Otherwise treat as a place name
    locations.push({
      raw: line,
      name: line,
      isGeocoded: false,
    });
  }

  return locations;
}

/**
 * Geocode a list of parsed locations that don't have coordinates yet.
 * Uses Google Geocoding API for place names.
 * Returns updated locations with coordinates where possible.
 */
export async function geocodeLocations(
  locations: ParsedLocation[],
  cities: string[] = []
): Promise<ParsedLocation[]> {
  const results: ParsedLocation[] = [];

  for (const loc of locations) {
    if (loc.isGeocoded && loc.latitude !== undefined && loc.longitude !== undefined) {
      results.push(loc);
      continue;
    }

    try {
      const result = await geocodeAddress(loc.name, cities);
      if (result) {
        results.push({
          ...loc,
          latitude: result.lat,
          longitude: result.lng,
          address: result.formatted_address,
          googlePlaceName: result.name,
          googlePlaceId: result.place_id,
          isGeocoded: true,
        });
      } else {
        results.push({ ...loc, isGeocoded: false });
      }
    } catch (error) {
      console.error(`Failed to geocode "${loc.name}":`, error);
      results.push({ ...loc, isGeocoded: false });
    }
  }

  return results;
}

/**
 * Import parsed locations as activity events for a trip.
 */
export async function importAsActivities(
  locations: ParsedLocation[],
  tripId: string,
  date: string,
  startTime: string = "10:00",
  durationMinutes: number = 60
): Promise<number> {
  let created = 0;

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (!loc.isGeocoded) continue;

    // Stagger times: each activity starts after the previous one
    const offsetMinutes = i * durationMinutes;
    const startDate = new Date(`${date}T${startTime}`);
    startDate.setMinutes(startDate.getMinutes() + offsetMinutes);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    const eventData: Omit<ActivityEvent, "id"> = {
      ...createDefaultActivityEvent(
        tripId,
        loc.name,
        startDate.toISOString(),
        endDate.toISOString()
      ),
      activityLocationName: loc.name,
      googlePlaceName: loc.googlePlaceName,
      googlePlaceId: loc.googlePlaceId,
      activityLatitude: loc.latitude,
      activityLongitude: loc.longitude,
      activityDescription: loc.address || "",
    };

    await db.events.add({ ...eventData, id: crypto.randomUUID() });
    created++;
  }

  return created;
}

/**
 * Import parsed locations as saved places for a trip.
 */
export async function importAsSavedPlaces(
  locations: ParsedLocation[],
  tripId: string
): Promise<number> {
  const geocoded = locations.filter(
    (l) => l.isGeocoded && l.latitude !== undefined && l.longitude !== undefined
  );

  if (geocoded.length === 0) return 0;

  const places: Omit<SavedPlace, "id" | "createdAt">[] = geocoded.map((loc) => ({
    tripId,
    name: loc.name,
    latitude: loc.latitude!,
    longitude: loc.longitude!,
    address: loc.address || "",
    googlePlaceName: loc.googlePlaceName,
    googlePlaceId: loc.googlePlaceId,
    notes: "",
  }));

  await dbHelpers.bulkCreateSavedPlaces(places);
  return places.length;
}
