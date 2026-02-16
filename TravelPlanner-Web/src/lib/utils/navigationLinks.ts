/**
 * TravelPlanner Web - Navigation Links Utility
 *
 * Navigation link generation logic.
 * Port of iOS TripDetailViewModel.swift navigation methods.
 */

import type {
  TripEvent,
  HotelEvent,
  FlightEvent,
  EventNavigationLink,
  ItineraryItem,
} from "../models";
import {
  isFlightEvent,
  isHotelEvent,
  isCarRentalEvent,
  isRestaurantEvent,
  isActivityEvent,
} from "../db";
import {
  directionsURLFromCurrentLocation,
  directionsURLFromCurrentLocationToCoords,
  buildLocationLink,
} from "../services/mapsService";
import { buildGoogleReviewsURL, buildRedNoteSearchURL } from "../services/reviewsService";

/**
 * Extract start coordinate from an event
 * (departure/pickup location for flights and car rentals)
 */
export function extractStartCoordinate(
  event: TripEvent
): { lat: number; lng: number } | null {
  if (isFlightEvent(event)) {
    if (
      event.departureLatitude !== undefined &&
      event.departureLongitude !== undefined
    ) {
      return { lat: event.departureLatitude, lng: event.departureLongitude };
    }
  } else if (isCarRentalEvent(event)) {
    if (
      event.pickupLatitude !== undefined &&
      event.pickupLongitude !== undefined
    ) {
      return { lat: event.pickupLatitude, lng: event.pickupLongitude };
    }
  } else if (isHotelEvent(event)) {
    if (
      event.hotelLatitude !== undefined &&
      event.hotelLongitude !== undefined
    ) {
      return { lat: event.hotelLatitude, lng: event.hotelLongitude };
    }
  } else if (isRestaurantEvent(event)) {
    if (
      event.restaurantLatitude !== undefined &&
      event.restaurantLongitude !== undefined
    ) {
      return { lat: event.restaurantLatitude, lng: event.restaurantLongitude };
    }
  } else if (isActivityEvent(event)) {
    if (
      event.activityLatitude !== undefined &&
      event.activityLongitude !== undefined
    ) {
      return { lat: event.activityLatitude, lng: event.activityLongitude };
    }
  } else {
    // Base event fields
    const baseEvent = event as TripEvent;
    if (baseEvent.latitude !== undefined && baseEvent.longitude !== undefined) {
      return { lat: baseEvent.latitude, lng: baseEvent.longitude };
    }
  }
  return null;
}

/**
 * Extract end coordinate from an event
 * (arrival/return location for flights and car rentals)
 */
export function extractEndCoordinate(
  event: TripEvent
): { lat: number; lng: number } | null {
  if (isFlightEvent(event)) {
    if (
      event.arrivalLatitude !== undefined &&
      event.arrivalLongitude !== undefined
    ) {
      return { lat: event.arrivalLatitude, lng: event.arrivalLongitude };
    }
  } else if (isCarRentalEvent(event)) {
    if (
      event.returnLatitude !== undefined &&
      event.returnLongitude !== undefined
    ) {
      return { lat: event.returnLatitude, lng: event.returnLongitude };
    }
  } else if (isHotelEvent(event)) {
    if (
      event.hotelLatitude !== undefined &&
      event.hotelLongitude !== undefined
    ) {
      return { lat: event.hotelLatitude, lng: event.hotelLongitude };
    }
  } else if (isRestaurantEvent(event)) {
    if (
      event.restaurantLatitude !== undefined &&
      event.restaurantLongitude !== undefined
    ) {
      return { lat: event.restaurantLatitude, lng: event.restaurantLongitude };
    }
  } else if (isActivityEvent(event)) {
    if (
      event.activityLatitude !== undefined &&
      event.activityLongitude !== undefined
    ) {
      return { lat: event.activityLatitude, lng: event.activityLongitude };
    }
  } else {
    // Base event fields
    const baseEvent = event as TripEvent;
    if (baseEvent.latitude !== undefined && baseEvent.longitude !== undefined) {
      return { lat: baseEvent.latitude, lng: baseEvent.longitude };
    }
  }
  return null;
}

/**
 * Extract start location name from an event
 */
export function extractStartLocationName(event: TripEvent): string {
  if (isFlightEvent(event)) {
    if (event.departureAirportName) {
      return event.departureAirportName;
    }
    if (event.departureAirportIATA) {
      return `${event.departureAirportIATA} airport`;
    }
    return "";
  } else if (isCarRentalEvent(event)) {
    return event.pickupLocationName;
  } else if (isHotelEvent(event)) {
    return event.hotelName;
  } else if (isRestaurantEvent(event)) {
    return event.restaurantName;
  } else if (isActivityEvent(event)) {
    return event.activityLocationName;
  } else {
    const baseEvent = event as TripEvent;
    return baseEvent.locationName || baseEvent.title;
  }
}

/**
 * Extract start address from an event
 */
export function extractStartAddress(event: TripEvent): string {
  if (isHotelEvent(event)) {
    return event.hotelAddress;
  } else if (isRestaurantEvent(event)) {
    return event.restaurantAddress;
  } else if (isActivityEvent(event)) {
    return ""; // ActivityEvent doesn't have a separate address field
  } else if (isCarRentalEvent(event)) {
    return event.pickupLocationName; // CarRentalEvent uses pickupLocationName
  } else {
    return "";
  }
}

/**
 * Extract start label for display
 */
export function extractStartLabel(event: TripEvent): string {
  if (isFlightEvent(event)) {
    return event.departureAirportIATA || "Departure";
  } else if (isCarRentalEvent(event)) {
    return event.pickupLocationName || "Car Pickup";
  } else if (isHotelEvent(event)) {
    return event.hotelName || "Hotel";
  } else if (isRestaurantEvent(event)) {
    return event.restaurantName || "Restaurant";
  } else if (isActivityEvent(event)) {
    return event.activityLocationName || event.title;
  } else {
    const baseEvent = event as TripEvent;
    return baseEvent.locationName || baseEvent.title;
  }
}

/**
 * Build navigation link to an event from user's current location
 */
export function buildNavigationToEvent(
  event: TripEvent
): EventNavigationLink | null {
  const locationName = extractStartLocationName(event);
  const address = extractStartAddress(event);
  const coord = extractStartCoordinate(event);

  if (!locationName && !address && !coord) {
    return null;
  }

  // Prioritize coordinates (most reliable), then address (fallback), then name (last resort)
  let url: string | null = null;
  if (coord) {
    url = directionsURLFromCurrentLocationToCoords(coord.lat, coord.lng);
  } else if (address) {
    url = directionsURLFromCurrentLocation(address);
  } else if (locationName) {
    url = directionsURLFromCurrentLocation(locationName);
  }

  if (!url) {
    return null;
  }

  const label = extractStartLabel(event);
  return { destinationLabel: label, directionsURL: url };
}

/**
 * Build navigation link to a hotel from user's current location
 */
export function buildNavigationToHotel(
  hotel: HotelEvent
): EventNavigationLink | null {
  const locationName = hotel.hotelName;
  const address = hotel.hotelAddress;
  const coord =
    hotel.hotelLatitude !== undefined && hotel.hotelLongitude !== undefined
      ? { lat: hotel.hotelLatitude, lng: hotel.hotelLongitude }
      : null;

  if (!locationName && !address && !coord) {
    return null;
  }

  // Prioritize coordinates (most reliable), then address (fallback), then name (last resort)
  let url: string | null = null;
  if (coord) {
    url = directionsURLFromCurrentLocationToCoords(coord.lat, coord.lng);
  } else if (address) {
    url = directionsURLFromCurrentLocation(address);
  } else if (locationName) {
    url = directionsURLFromCurrentLocation(locationName);
  }

  if (!url) {
    return null;
  }

  const label = locationName || "Hotel";
  return { destinationLabel: label, directionsURL: url };
}

/**
 * Build navigation link to departure airport for a flight
 */
export function buildNavigationToDeparture(
  flight: FlightEvent
): EventNavigationLink | null {
  const locationName =
    flight.departureAirportName || flight.departureAirportIATA;
  const coord =
    flight.departureLatitude !== undefined &&
    flight.departureLongitude !== undefined
      ? { lat: flight.departureLatitude, lng: flight.departureLongitude }
      : null;

  if (!locationName && !coord) {
    return null;
  }

  // Prefer coordinates (most precise), then airport name
  let url: string | null = null;
  if (coord) {
    url = directionsURLFromCurrentLocationToCoords(coord.lat, coord.lng);
  } else if (locationName) {
    url = directionsURLFromCurrentLocation(locationName);
  }

  if (!url) {
    return null;
  }

  const label = locationName || "Departure Airport";
  return { destinationLabel: label, directionsURL: url };
}

/**
 * Find the hotel that covers a given date (check-in <= date < check-out).
 * Note: The check-in date is excluded from day header display.
 */
export function findHotelForDay(
  date: Date,
  hotels: HotelEvent[]
): HotelEvent | null {
  const day = date.getTime(); // Use timestamp for comparison
  return (
    hotels.find((hotel) => {
      const checkIn = new Date(hotel.checkInDate).setHours(0, 0, 0, 0);
      const checkOut = new Date(hotel.checkOutDate).setHours(0, 0, 0, 0);
      return checkIn <= day && day < checkOut;
    }) || null
  );
}

/**
 * Find all hotels that cover a given date (check-in <= date <= check-out).
 */
export function findHotelsForDay(
  date: Date,
  hotels: HotelEvent[]
): HotelEvent[] {
  const day = date.getTime(); // Use timestamp for comparison
  return hotels.filter((hotel) => {
    const checkIn = new Date(hotel.checkInDate).setHours(0, 0, 0, 0);
    const checkOut = new Date(hotel.checkOutDate).setHours(0, 0, 0, 0);
    return checkIn <= day && day <= checkOut;
  });
}

/**
 * Build a location search link for an event (opens in Google Maps)
 * This opens the Google Place page if place_id is available (shows reviews, photos, etc.)
 */
export function buildLocationSearchLink(
  event: TripEvent
): { locationLabel: string; locationURL: string } | null {
  let name: string | undefined;
  let address: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;
  let placeId: string | undefined;

  if (isHotelEvent(event)) {
    name = event.hotelName;
    address = event.hotelAddress;
    lat = event.hotelLatitude;
    lng = event.hotelLongitude;
    placeId = event.googlePlaceId;
  } else if (isRestaurantEvent(event)) {
    name = event.restaurantName;
    address = event.restaurantAddress;
    lat = event.restaurantLatitude;
    lng = event.restaurantLongitude;
    placeId = event.googlePlaceId;
  } else if (isActivityEvent(event)) {
    name = event.activityLocationName;
    address = undefined;
    lat = event.activityLatitude;
    lng = event.activityLongitude;
    placeId = event.googlePlaceId;
  } else if (isFlightEvent(event)) {
    // For flights, link to arrival airport
    name = event.arrivalAirportName || event.arrivalAirportIATA;
    lat = event.arrivalLatitude;
    lng = event.arrivalLongitude;
  } else if (isCarRentalEvent(event)) {
    name = event.pickupLocationName;
    lat = event.pickupLatitude;
    lng = event.pickupLongitude;
  }

  const url = buildLocationLink(name, address, lat, lng, placeId);
  if (!url) return null;

  return {
    locationLabel: name || "Location",
    locationURL: url,
  };
}

/**
 * Build review links for an event (Google Reviews and RedNote)
 * Returns URLs for both platforms if location data is available
 */
export function buildReviewLinks(
  event: TripEvent,
  tripCities: string[] = []
): { googleReviews: string | null; redNote: string | null } {
  let name: string | undefined;
  let googlePlaceName: string | undefined; // Official Google Places name
  let address: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;

  // Extract location data based on event type
  if (isHotelEvent(event)) {
    name = event.hotelName;
    googlePlaceName = event.googlePlaceName; // Use official Google Places name if available
    address = event.hotelAddress;
    lat = event.hotelLatitude;
    lng = event.hotelLongitude;
  } else if (isRestaurantEvent(event)) {
    name = event.restaurantName;
    googlePlaceName = event.googlePlaceName; // Use official Google Places name if available
    address = event.restaurantAddress;
    lat = event.restaurantLatitude;
    lng = event.restaurantLongitude;
  } else if (isActivityEvent(event)) {
    name = event.activityLocationName;
    googlePlaceName = event.googlePlaceName; // Use official Google Places name if available
    address = undefined;
    lat = event.activityLatitude;
    lng = event.activityLongitude;
  } else if (isCarRentalEvent(event)) {
    name = event.pickupLocationName; // Use rental company location
    lat = event.pickupLatitude;
    lng = event.pickupLongitude;
  } else {
    // Flight events don't have reviewable places
    return { googleReviews: null, redNote: null };
  }

  // Build Google Reviews URL
  const googleReviews = buildGoogleReviewsURL(name, address, lat, lng);

  // Build RedNote URL using Google Places name if available (more accurate), otherwise fall back to user-entered name
  const redNoteName = googlePlaceName || name;
  const redNote = redNoteName ? buildRedNoteSearchURL(redNoteName, tripCities) : null;

  return { googleReviews, redNote };
}
