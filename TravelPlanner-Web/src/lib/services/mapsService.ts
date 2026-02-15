/**
 * TravelPlanner Web - Maps Service
 *
 * Google Maps URL generation for navigation links.
 * Port of iOS GoogleMapsService.swift (adapted for web).
 *
 * Uses Google Maps web URLs instead of comgooglemaps:// scheme.
 */

/**
 * Build Google Maps directions URL from current location to destination
 */
export function directionsURLFromCurrentLocation(
  to: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  if (!to) return null;

  const encoded = encodeURIComponent(to);
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=${mode}`;
}

/**
 * Build Google Maps directions URL from current location to coordinates
 */
export function directionsURLFromCurrentLocationToCoords(
  toLat: number,
  toLng: number,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  return `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}&travelmode=${mode}`;
}

/**
 * Build Google Maps directions URL between two points (coordinates)
 */
export function directionsURL(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=${mode}`;
}

/**
 * Build Google Maps directions URL between two points (by name)
 */
export function directionsURLByName(
  origin: string,
  destination: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  if (!origin || !destination) return null;

  const encodedOrigin = encodeURIComponent(origin);
  const encodedDest = encodeURIComponent(destination);

  return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDest}&travelmode=${mode}`;
}

/**
 * Mixed-mode directions: origin by name, destination by coordinates
 */
export function directionsURLFromNameToCoords(
  origin: string,
  destinationLat: number,
  destinationLng: number,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  if (!origin) return null;

  const encodedOrigin = encodeURIComponent(origin);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destinationLat},${destinationLng}&travelmode=${mode}`;
}

/**
 * Mixed-mode directions: origin by coordinates, destination by name
 */
export function directionsURLFromCoordsToName(
  originLat: number,
  originLng: number,
  destination: string,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving"
): string | null {
  if (!destination) return null;

  const encodedDest = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${encodedDest}&travelmode=${mode}`;
}

/**
 * Build Google Maps search URL
 */
export function searchURL(query: string): string | null {
  if (!query) return null;

  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Build Google Maps location URL (pin drop)
 */
export function locationURL(
  lat: number,
  lng: number,
  label: string = ""
): string | null {
  const encoded = label ? encodeURIComponent(label) : "";
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${encoded ? `&query=${encoded}` : ""}`;
}
