/**
 * TravelPlanner Web - Location Search Service
 *
 * Google Places API for location search with city biasing.
 * Replaces Nominatim (OpenStreetMap) with Google Maps services.
 *
 * This file re-exports from googlePlacesService.ts for backwards compatibility.
 */

export {
  searchPlaces,
  reverseGeocode,
  geocodeAirportCode,
  buildFormattedAddress,
  extractShortName,
  createSessionToken,
  searchPlacesAutocomplete,
  getPlaceDetails,
} from "./googlePlacesService";

// Re-export types
export type {
  GoogleLocationResult as LocationResult,
  GooglePhoto,
  GooglePlacePrediction,
} from "./googlePlacesService";
