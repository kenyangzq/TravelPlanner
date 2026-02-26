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
 * Detect the type of a Google Maps URL.
 *
 * Returns:
 * - "directions" for /maps/dir/ URLs
 * - "list" for /maps/placelists/ or shared list URLs
 * - "shortened" for maps.app.goo.gl or goo.gl/maps URLs
 * - "other" for other Google Maps URLs
 * - null for non-Google Maps URLs
 */
export function detectGoogleMapsUrlType(
  url: string
): "directions" | "list" | "shortened" | "other" | null {
  const trimmed = url.trim();

  // Shortened URLs
  if (
    trimmed.match(/^https?:\/\/maps\.app\.goo\.gl\//i) ||
    trimmed.match(/^https?:\/\/goo\.gl\/maps\//i)
  ) {
    return "shortened";
  }

  // Google Maps URLs
  if (
    trimmed.match(/^https?:\/\/(www\.)?google\.com\/maps\//i) ||
    trimmed.match(/^https?:\/\/maps\.google\.com\//i)
  ) {
    if (trimmed.includes("/maps/dir/")) return "directions";
    if (trimmed.includes("/maps/placelists/")) return "list";
    return "other";
  }

  return null;
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
 * Check if a line looks like metadata from Google Maps (not a place name).
 * These lines are skipped when parsing pasted text from Google Maps lists.
 */
function isMetadataLine(line: string): boolean {
  // Rating lines: "4.5", "4.5 stars", "4.5(123)", "★★★★☆"
  if (/^\d\.\d(\s*\([\d,]+\))?$/.test(line)) return true;
  if (/^\d\.\d\s*stars?/i.test(line)) return true;
  if (/^[★☆]{2,}/.test(line)) return true;

  // Price range: "$", "$$", "$$$", "$$$$"
  if (/^\${1,4}$/.test(line)) return true;

  // "Open" / "Closed" / hours
  if (/^(Open|Closed|Opens|Closes)\b/i.test(line)) return true;

  // Phone numbers
  if (/^\+?\(?\d{1,4}\)?[\s-]?\d{3,}/.test(line) && line.length < 20) return true;

  // Very short lines that are likely categories (e.g., "Restaurant", "Park")
  // We keep these since they might be place names too - skip only known patterns

  // "N reviews" or "N ratings"
  if (/^\d[\d,]*\s+(reviews?|ratings?)/i.test(line)) return true;

  // Lines that are just a URL
  if (/^https?:\/\//i.test(line)) return true;

  return false;
}

/**
 * Parse a text block of coordinates or place names (one per line).
 *
 * Supports:
 * - "35.6762, 139.6503" (coordinate pairs)
 * - "35.6762,139.6503" (no space)
 * - "Tokyo Tower" (place name)
 * - "Place Name, 35.6762, 139.6503" (name with coordinates)
 * - "Place Name · Category" (Google Maps list format - strips category)
 * - "Place Name · Category · Price" (strips everything after first middot)
 * - "1. Place Name" or "- Place Name" (strips list prefixes)
 */
export function parseCoordinateText(text: string): ParsedLocation[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const locations: ParsedLocation[] = [];

  for (const line of lines) {
    // Skip metadata lines (ratings, hours, phone numbers, etc.)
    if (isMetadataLine(line)) continue;

    // Strip list prefixes: "1. ", "1) ", "- ", "• "
    let cleaned = line.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, "");

    // Handle "Place Name · Category" format (Google Maps list paste)
    // Strip everything after " · " (middot separator)
    if (cleaned.includes(" · ") || cleaned.includes(" · ")) {
      cleaned = cleaned.split(/\s*[·]\s*/)[0].trim();
    }

    // Skip if empty after cleaning
    if (!cleaned) continue;

    // Try: "Name, lat, lng" format
    const namedCoordMatch = cleaned.match(
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
    const coordMatch = cleaned.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
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
      name: cleaned,
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
