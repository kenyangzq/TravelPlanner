/**
 * TravelPlanner Web - Google Places Location Service
 *
 * Google Places API for location search with city biasing.
 * Replaces Nominatim (OpenStreetMap) for better integration with Google Reviews.
 *
 * Uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for all Google services.
 */

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GoogleLocationResult {
  place_id: string;
  lat: number;
  lng: number;
  name: string;
  formatted_address: string;
  address: {
    name?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  photos?: GooglePhoto[];
  rating?: number;
  types?: string[];
}

export interface GooglePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Generate a session token for Places Autocomplete
 * Required by Google for billing accuracy (autocomplete + details = 1 session)
 */
export function createSessionToken(): string {
  // Generate a UUID-like token
  return 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Search for places using Places Autocomplete API
 * Returns predictions with place_id
 * Uses Next.js API route to avoid CORS issues
 */
export async function searchPlacesAutocomplete(
  query: string,
  sessionToken: string,
  cities: string[] = []
): Promise<GooglePlacePrediction[]> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return [];
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query,
      sessiontoken: sessionToken,
    });

    // Add location bias if cities provided
    if (cities.length > 0) {
      // Geocode the first city to get coordinates
      const cityLocation = await geocodeCity(cities[0]);
      if (cityLocation) {
        params.append("location", `${cityLocation.lat},${cityLocation.lng}`);
        params.append("radius", "50000"); // 50km radius
      }
    }

    const url = `/api/places/autocomplete?${params}`;
    console.log("Places API request:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Places API response:", data);

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places Autocomplete error:", data.status, data.error_message);
      return [];
    }

    return data.predictions || [];
  } catch (error) {
    console.error("Places Autocomplete error:", error);
    return [];
  }
}

/**
 * Get detailed information about a place
 * Must be called with the same session token used in autocomplete
 * Uses Next.js API route to avoid CORS issues
 */
export async function getPlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<GoogleLocationResult | null> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      sessiontoken: sessionToken,
    });

    const url = `/api/places/details?${params}`;
    console.log("Place Details API request:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places Details error:", data.status, data.error_message);
      return null;
    }

    const place = data.result;

    // Extract address components
    const address = extractAddressComponents(place.address_components || []);

    return {
      place_id: place.place_id,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      name: place.name,
      formatted_address: place.formatted_address,
      address,
      photos: place.photos,
      rating: place.rating,
      types: place.types,
    };
  } catch (error) {
    console.error("Place Details error:", error);
    return null;
  }
}

/**
 * Search for places (complete flow: autocomplete + details)
 * Returns top 5 results with full details
 * For backwards compatibility with old Nominatim interface
 */
export async function searchPlaces(
  query: string,
  cities: string[] = []
): Promise<GoogleLocationResult[]> {
  // Get autocomplete predictions
  const sessionToken = createSessionToken();
  const predictions = await searchPlacesAutocomplete(query, sessionToken, cities);

  if (predictions.length === 0) {
    return [];
  }

  // Get details for top 5 predictions
  const detailsPromises = predictions.slice(0, 5).map((prediction) =>
    getPlaceDetails(prediction.place_id, sessionToken)
  );

  const results = await Promise.all(detailsPromises);

  // Filter out nulls
  return results.filter((r): r is GoogleLocationResult => r !== null);
}

/**
 * Reverse geocode coordinates to address
 * Uses Geocoding API
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GoogleLocationResult | null> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: API_KEY,
      result_type: "street_address",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      return null;
    }

    const place = data.results[0];

    // Extract address components
    const address = extractAddressComponents(place.address_components || []);

    return {
      place_id: place.place_id,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      name: address.name || place.formatted_address.split(",")[0],
      formatted_address: place.formatted_address,
      address,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Geocode an airport code (e.g., "SFO")
 * Uses Places Text Search API
 */
export async function geocodeAirportCode(code: string): Promise<GoogleLocationResult | null> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      query: `${code} airport`,
      key: API_KEY,
      fields: "place_id,geometry,name,formatted_address,address_components",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      return null;
    }

    const place = data.results[0];

    // Extract address components
    const address = extractAddressComponents(place.address_components || []);

    return {
      place_id: place.place_id,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      name: place.name,
      formatted_address: place.formatted_address,
      address,
    };
  } catch (error) {
    console.error("Airport geocoding error:", error);
    return null;
  }
}

/**
 * Build formatted address from address components
 * Compatible with both Nominatim and Google address structures
 */
export function buildFormattedAddress(
  address: GoogleLocationResult["address"]
): string {
  const parts: string[] = [];

  // House number and street
  if (address.road) {
    parts.push(address.road);
  }

  // City/town/locality
  if (address.city) {
    parts.push(address.city);
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
 * Extract short name from location result
 */
export function extractShortName(result: GoogleLocationResult): string {
  // Use the name field from Google Places
  if (result.name) {
    return result.name;
  }

  // Fallback to formatted address
  return result.formatted_address;
}

/**
 * Extract address components from Google's address_components array
 */
function extractAddressComponents(
  components: Array<{
    types: string[];
    long_name: string;
    short_name: string;
  }>
): GoogleLocationResult["address"] {
  const address: GoogleLocationResult["address"] = {};

  for (const component of components) {
    const types = component.types;

    if (types.includes("establishment") || types.includes("point_of_interest")) {
      address.name = component.long_name;
    } else if (types.includes("route")) {
      address.road = component.long_name;
    } else if (types.includes("locality")) {
      address.city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      address.state = component.long_name;
    } else if (types.includes("country")) {
      address.country = component.long_name;
    } else if (types.includes("postal_code")) {
      address.postcode = component.long_name;
    }
  }

  return address;
}

/**
 * Geocode a city to get its coordinates (for location biasing)
 * Internal helper function
 */
async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  if (!API_KEY) return null;

  try {
    const params = new URLSearchParams({
      address: city,
      key: API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== "OK" || data.results.length === 0) {
      return null;
    }

    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    console.error("City geocoding error:", error);
    return null;
  }
}
