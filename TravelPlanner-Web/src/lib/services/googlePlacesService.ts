/**
 * TravelPlanner Web - Google Places Location Service
 *
 * Uses Google Maps JavaScript API (Places library) for location search.
 * This approach works in static export (no API routes needed) and avoids CORS.
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

// Track if the Google Maps JS API is loaded
let mapsApiLoaded = false;
let mapsApiLoading: Promise<void> | null = null;

/**
 * Load Google Maps JavaScript API with Places library
 */
function loadGoogleMapsApi(): Promise<void> {
  if (mapsApiLoaded && window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (mapsApiLoading) {
    return mapsApiLoading;
  }

  mapsApiLoading = new Promise<void>((resolve, reject) => {
    // Check if already loaded by another component (e.g., trip-map-view)
    if (window.google?.maps?.places) {
      mapsApiLoaded = true;
      resolve();
      return;
    }

    // Check if script tag already exists (loaded without places library)
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      // Script exists but places might not be loaded - wait for it
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          mapsApiLoaded = true;
          resolve();
        }
      }, 100);
      // Timeout after 10s
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Google Maps Places library not available"));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapsApiLoaded = true;
      resolve();
    };
    script.onerror = () => {
      mapsApiLoading = null;
      reject(new Error("Failed to load Google Maps API"));
    };
    document.head.appendChild(script);
  });

  return mapsApiLoading;
}

/**
 * Generate a session token for Places Autocomplete
 */
export function createSessionToken(): string {
  return "sess-" + Date.now() + "-" + Math.random().toString(36).substring(2, 15);
}

/**
 * Search for places using Places Autocomplete via JS API
 * Returns predictions with place_id
 */
export async function searchPlacesAutocomplete(
  query: string,
  _sessionToken: string,
  cities: string[] = []
): Promise<GooglePlacePrediction[]> {
  if (!API_KEY) {
    throw new Error("Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment.");
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    await loadGoogleMapsApi();

    const service = new google.maps.places.AutocompleteService();

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: ["establishment"],
    };

    // Add location bias if cities provided
    if (cities.length > 0) {
      const cityLocation = await geocodeCity(cities[0]);
      if (cityLocation) {
        request.location = new google.maps.LatLng(cityLocation.lat, cityLocation.lng);
        request.radius = 50000; // 50km
      }
    }

    return new Promise((resolve) => {
      service.getPlacePredictions(request, (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          console.log("Places Autocomplete status:", status);
          resolve([]);
          return;
        }

        resolve(
          predictions.map((p) => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: p.structured_formatting
              ? {
                  main_text: p.structured_formatting.main_text,
                  secondary_text: p.structured_formatting.secondary_text,
                }
              : undefined,
          }))
        );
      });
    });
  } catch (error) {
    console.error("Places Autocomplete error:", error);
    return [];
  }
}

/**
 * Get detailed information about a place via JS API
 */
export async function getPlaceDetails(
  placeId: string,
  _sessionToken: string
): Promise<GoogleLocationResult | null> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    await loadGoogleMapsApi();

    // PlacesService requires a DOM element (can be a hidden div)
    let container = document.getElementById("places-service-container") as HTMLDivElement | null;
    if (!container) {
      container = document.createElement("div");
      container.id = "places-service-container";
      container.style.display = "none";
      document.body.appendChild(container);
    }

    const service = new google.maps.places.PlacesService(container);

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeId,
      fields: [
        "place_id",
        "geometry",
        "name",
        "formatted_address",
        "address_components",
        "photos",
        "rating",
        "types",
      ],
    };

    return new Promise((resolve) => {
      service.getDetails(request, (place, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place
        ) {
          console.error("Place Details status:", status);
          resolve(null);
          return;
        }

        const address = extractAddressComponents(
          (place.address_components || []).map((c) => ({
            types: c.types,
            long_name: c.long_name,
            short_name: c.short_name,
          }))
        );

        resolve({
          place_id: place.place_id || placeId,
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
          name: place.name || "",
          formatted_address: place.formatted_address || "",
          address,
          photos: place.photos?.map((p) => ({
            photo_reference: p.getUrl({ maxWidth: 400 }),
            height: p.height,
            width: p.width,
          })),
          rating: place.rating,
          types: place.types,
        });
      });
    });
  } catch (error) {
    console.error("Place Details error:", error);
    return null;
  }
}

/**
 * Search for places (complete flow: autocomplete + details)
 * Returns top 5 results with full details
 */
export async function searchPlaces(
  query: string,
  cities: string[] = []
): Promise<GoogleLocationResult[]> {
  const sessionToken = createSessionToken();
  const predictions = await searchPlacesAutocomplete(query, sessionToken, cities);

  if (predictions.length === 0) {
    return [];
  }

  const detailsPromises = predictions.slice(0, 5).map((prediction) =>
    getPlaceDetails(prediction.place_id, sessionToken)
  );

  const results = await Promise.all(detailsPromises);
  return results.filter((r): r is GoogleLocationResult => r !== null);
}

/**
 * Reverse geocode coordinates to address
 * Uses Geocoding API (REST - this one supports CORS)
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
 * Uses Places Text Search via JS API
 */
export async function geocodeAirportCode(
  code: string
): Promise<GoogleLocationResult | null> {
  if (!API_KEY) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    await loadGoogleMapsApi();

    let container = document.getElementById("places-service-container") as HTMLDivElement | null;
    if (!container) {
      container = document.createElement("div");
      container.id = "places-service-container";
      container.style.display = "none";
      document.body.appendChild(container);
    }

    const service = new google.maps.places.PlacesService(container);

    return new Promise((resolve) => {
      service.textSearch(
        { query: `${code} airport` },
        (results, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !results ||
            results.length === 0
          ) {
            resolve(null);
            return;
          }

          const place = results[0];
          const address = extractAddressComponents(
            (place.address_components || []).map((c) => ({
              types: c.types,
              long_name: c.long_name,
              short_name: c.short_name,
            }))
          );

          resolve({
            place_id: place.place_id || "",
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            name: place.name || "",
            formatted_address: place.formatted_address || "",
            address,
          });
        }
      );
    });
  } catch (error) {
    console.error("Airport geocoding error:", error);
    return null;
  }
}

/**
 * Build formatted address from address components
 */
export function buildFormattedAddress(
  address: GoogleLocationResult["address"]
): string {
  const parts: string[] = [];
  if (address.road) parts.push(address.road);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);
  return parts.join(", ");
}

/**
 * Extract short name from location result
 */
export function extractShortName(result: GoogleLocationResult): string {
  if (result.name) return result.name;
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
 */
async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  if (!API_KEY) return null;

  try {
    await loadGoogleMapsApi();

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
      geocoder.geocode({ address: city }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results || results.length === 0) {
          resolve(null);
          return;
        }

        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      });
    });
  } catch (error) {
    console.error("City geocoding error:", error);
    return null;
  }
}
