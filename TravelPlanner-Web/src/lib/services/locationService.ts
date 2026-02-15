/**
 * TravelPlanner Web - Location Search Service
 *
 * Nominatim API (OpenStreetMap) for location search with city bias.
 * Free, no API key required.
 * Port of iOS LocationService.swift (MKLocalSearch → Nominatim).
 */

export interface LocationResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    name?: string;
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  importance?: number;
}

// Rate limiting: 1 request per second (Nominatim policy)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      "User-Agent": "TravelPlanner-Web",
      "Accept-Language": "en",
    },
  });
}

/**
 * Get bounding box for a city to use in Nominatim search
 */
async function getCityBoundingBox(city: string): Promise<{ south: number; north: number; west: number; east: number } | null> {
  // Search for the city to get its coordinates
  const searchParams = new URLSearchParams({
    format: "json",
    q: city,
    limit: "1",
    addressdetails: "1",
  });

  try {
    const response = await rateLimitedFetch(
      `https://nominatim.openstreetmap.org/search?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: LocationResult[] = await response.json();

    if (results.length === 0) return null;

    const cityResult = results[0];
    const lat = parseFloat(cityResult.lat);
    const lon = parseFloat(cityResult.lon);

    // Create a bounding box around the city (approximately 50km radius)
    const delta = 0.5; // ~50km
    return {
      south: lat - delta,
      north: lat + delta,
      west: lon - delta,
      east: lon + delta,
    };
  } catch (error) {
    console.error("Error getting city bounding box:", error);
    return null;
  }
}

/**
 * Search for places matching a query with city biasing
 */
export async function searchPlaces(
  query: string,
  cities: string[] = []
): Promise<LocationResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  let searchUrl = "";

  if (cities.length > 0) {
    // Use the first city to create a bounding box for better results
    const boundingBox = await getCityBoundingBox(cities[0]);

    if (boundingBox) {
      // Use bounded search to prioritize results near the city
      const { south, north, west, east } = boundingBox;
      searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&viewbox=${west},${south},${east},${north}&bounded=1&addressdetails=1&namedetails=1`;
    } else {
      // Fallback to unbounded search if city lookup fails
      searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&namedetails=1`;
    }
  } else {
    // No cities specified, do global search
    searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&namedetails=1`;
  }

  try {
    const response = await rateLimitedFetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    let results: LocationResult[] = await response.json();

    // Sort by importance if available
    results.sort((a, b) => (b.importance || 0) - (a.importance || 0));

    // Deduplicate by coordinate proximity (~100m)
    results = deduplicateResults(results);

    // Limit to top 10 results
    return results.slice(0, 10);
  } catch (error) {
    console.error("Location search error:", error);
    return [];
  }
}

/**
 * Deduplicate results by coordinate proximity (~100m)
 * Port of EventFormViewModel.swift deduplication logic
 */
function deduplicateResults(results: LocationResult[]): LocationResult[] {
  const deduped: LocationResult[] = [];

  for (const result of results) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    const isDuplicate = deduped.some((existing) => {
      const existingLat = parseFloat(existing.lat);
      const existingLon = parseFloat(existing.lon);
      const distance = Math.sqrt(
        Math.pow(lat - existingLat, 2) + Math.pow(lon - existingLon, 2)
      );
      return distance < 0.001; // ~100m
    });

    if (!isDuplicate) {
      deduped.push(result);
    }
  }

  return deduped;
}

/**
 * Build formatted address from Nominatim address components
 */
export function buildFormattedAddress(
  address: LocationResult["address"]
): string {
  // Start with the most specific parts
  const parts: string[] = [];

  // House number and street
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  // City/town/locality
  if (address.city) {
    parts.push(address.city);
  } else if (address.town) {
    parts.push(address.town);
  }

  // State/province
  if (address.state) {
    parts.push(address.state);
  }

  // Country
  if (address.country) {
    parts.push(address.country);
  }

  return parts.join(", ");
}

/**
 * Extract a short name from location result
 */
export function extractShortName(result: LocationResult): string {
  // Try to get the name from the address first
  if (result.address.name) {
    return result.address.name;
  }

  // Split display name and take the most meaningful part
  const parts = result.display_name.split(",").map((p) => p.trim());

  // For businesses, return the first part
  // For addresses, try to find a meaningful name
  if (parts.length > 0) {
    // Check if first part is a building name
    const firstPart = parts[0];
    if (firstPart.length < 50 && !/\d/.test(firstPart)) {
      return firstPart;
    }
  }

  return result.display_name;
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<LocationResult | null> {
  const searchParams = new URLSearchParams({
    format: "json",
    lat: lat.toString(),
    lon: lon.toString(),
    addressdetails: "1",
    zoom: "18",
  });

  const baseUrl = "https://nominatim.openstreetmap.org/reverse";

  try {
    const response = await rateLimitedFetch(`${baseUrl}?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Geocode an airport code (e.g., "SFO")
 */
export async function geocodeAirportCode(code: string): Promise<LocationResult | null> {
  const results = await searchPlaces(`${code} airport`);
  return results.length > 0 ? results[0] : null;
}
