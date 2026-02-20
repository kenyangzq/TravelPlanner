/**
 * TravelPlanner Web - Data Models
 *
 * Ported from iOS SwiftData models to TypeScript interfaces.
 * Uses discriminated unions for event types (eventType field).
 */

// Base Trip interface
export interface Trip {
  id: string; // UUID
  name: string;
  destination: string;
  startDate: string; // ISO date string for IndexedDB
  endDate: string; // ISO date string
  citiesRaw: string; // pipe-delimited "|||" separator
  createdAt: string; // ISO date string
}

// Helper function to parse cities from citiesRaw
export function parseCities(citiesRaw: string): string[] {
  return citiesRaw.split("|||").filter((c) => c.length > 0);
}

// Helper function to format cities to citiesRaw
export function formatCities(cities: string[]): string {
  return cities.join("|||");
}

// Discriminated union for events
export type TripEvent =
  | FlightEvent
  | HotelEvent
  | RestaurantEvent
  | ActivityEvent
  | CarRentalEvent;

// Base interface with common fields
export interface BaseEvent {
  id: string;
  tripId: string;
  eventType: "flight" | "hotel" | "restaurant" | "activity" | "carRental";
  title: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  notes: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  sortOrder: number;
}

// FlightEvent-specific fields
export interface FlightEvent extends BaseEvent {
  eventType: "flight";
  flightNumber: string;
  airlineName: string;
  airlineIATA: string;
  departureAirportIATA: string;
  departureAirportName: string;
  departureTerminal: string;
  departureGate: string;
  arrivalAirportIATA: string;
  arrivalAirportName: string;
  arrivalTerminal: string;
  arrivalGate: string;
  departureLatitude?: number;
  departureLongitude?: number;
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  flightStatus: string;
  scheduledDepartureTime?: string; // ISO date string
  scheduledArrivalTime?: string; // ISO date string
  lastUpdated?: string; // ISO date string
}

// HotelEvent-specific fields
export interface HotelEvent extends BaseEvent {
  eventType: "hotel";
  hotelName: string;
  googlePlaceName?: string; // Official Google Places name for review searches
  googlePlaceId?: string; // Google Places place_id for direct map links
  checkInDate: string; // ISO date string
  checkOutDate: string; // ISO date string
  hotelLatitude?: number;
  hotelLongitude?: number;
  hotelAddress: string;
  confirmationNumber: string;
}

// RestaurantEvent-specific fields
export interface RestaurantEvent extends BaseEvent {
  eventType: "restaurant";
  restaurantName: string;
  googlePlaceName?: string; // Official Google Places name for review searches
  googlePlaceId?: string; // Google Places place_id for direct map links
  cuisineType: string;
  reservationTime: string; // ISO date string
  partySize: number;
  restaurantAddress: string;
  restaurantLatitude?: number;
  restaurantLongitude?: number;
  confirmationNumber: string;
}

// ActivityEvent-specific fields
export interface ActivityEvent extends BaseEvent {
  eventType: "activity";
  activityLocationName: string;
  googlePlaceName?: string; // Official Google Places name for review searches
  googlePlaceId?: string; // Google Places place_id for direct map links
  activityLatitude?: number;
  activityLongitude?: number;
  activityDescription: string;
}

// CarRentalEvent-specific fields
export interface CarRentalEvent extends BaseEvent {
  eventType: "carRental";
  pickupDate: string; // ISO date string
  returnDate: string; // ISO date string
  pickupLocationName: string;
  pickupAirportCode: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  returnLocationName: string;
  returnAirportCode: string;
  returnLatitude?: number;
  returnLongitude?: number;
  rentalCompany: string;
  confirmationNumber: string;
  hasCarRental: boolean;
}

// Daily reminder (short note)
export interface Reminder {
  id: string;
  tripId: string;
  dayKey: string; // "YYYY-MM-DD"
  content: string;
  updatedAt: string; // ISO date string
}

// Cached city image from Unsplash
export interface ImageCache {
  city: string; // Lowercase trimmed city name (primary key)
  url: string; // Unsplash image URL
  fetchedAt: string; // ISO timestamp when image was fetched
}

// Weather cache entry (stored in IndexedDB)
export interface WeatherCache {
  id: string; // "{lat}_{lng}_{date}"
  lat: number;
  lng: number;
  date: string; // "YYYY-MM-DD"
  tempHigh: number; // Celsius
  tempLow: number; // Celsius
  conditionDescription: string;
  iconUri: string;
  precipitationProbability: number; // 0-100
  fetchedAt: string; // ISO timestamp
}

// Weather data for a single day (returned to UI)
export interface DayWeather {
  tempHigh: number;
  tempLow: number;
  conditionDescription: string;
  iconUri: string;
  precipitationProbability: number;
}


// Navigation link types
export interface EventNavigationLink {
  destinationLabel: string;
  directionsURL: string | null;
}

export interface DayHotelInfo {
  hotel: HotelEvent;
  navigationToHotel: EventNavigationLink | null;
}

export interface ItineraryItem {
  id: string;
  event: TripEvent;
  navigationToEvent: EventNavigationLink | null;
  navigationToHotel: EventNavigationLink | null;
  navigationToDeparture: EventNavigationLink | null; // For flights
}

// Event type enum for forms
export type EventTypeChoice =
  | "flight"
  | "carRental"
  | "hotel"
  | "restaurant"
  | "activity";

export const EVENT_TYPE_CHOICES: EventTypeChoice[] = [
  "flight",
  "carRental",
  "hotel",
  "restaurant",
  "activity",
];

// Helper function to get event icon
export function getEventIcon(eventType: TripEvent["eventType"]): string {
  switch (eventType) {
    case "flight":
      return "airplane";
    case "hotel":
      return "building-2";
    case "restaurant":
      return "utensils";
    case "activity":
      return "star";
    case "carRental":
      return "car";
    default:
      return "map-pin";
  }
}

// Helper function to get event color
export function getEventColor(eventType: TripEvent["eventType"]): string {
  switch (eventType) {
    case "flight":
      return "blue";
    case "hotel":
      return "purple";
    case "restaurant":
      return "red";
    case "activity":
      return "orange";
    case "carRental":
      return "green";
    default:
      return "gray";
  }
}

// Helper function to get event type name
export function getEventTypeName(eventType: TripEvent["eventType"]): string {
  switch (eventType) {
    case "flight":
      return "Flight";
    case "hotel":
      return "Hotel";
    case "restaurant":
      return "Restaurant";
    case "activity":
      return "Activity";
    case "carRental":
      return "Car Rental";
    default:
      return "Event";
  }
}
