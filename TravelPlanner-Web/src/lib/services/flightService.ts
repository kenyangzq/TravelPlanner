/**
 * TravelPlanner Web - Flight Service
 *
 * Client-side service for flight API calls.
 * Calls AeroDataBox directly (static export — no API routes).
 */

import type { FlightEvent } from "@/lib/models";

const AERO_DATA_BOX_BASE_URL = "https://aerodatabox.p.rapidapi.com";

export interface FlightSearchParams {
  number: string;
  date: string; // YYYY-MM-DD format
}

/**
 * Search for flight information via AeroDataBox API
 */
export async function searchFlight(
  params: FlightSearchParams
): Promise<FlightEvent> {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("API key not configured");
  }

  const url = `${AERO_DATA_BOX_BASE_URL}/flights/number/${params.number}/${params.date}`;

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Flight not found");
    }
    throw new Error("Failed to fetch flight data");
  }

  const flights: FlightAPIResponse[] = await response.json();

  if (!flights || flights.length === 0) {
    throw new Error("Flight not found");
  }

  return mapFlightAPIResponse(flights[0]);
}

/**
 * Map AeroDataBox API response to FlightEvent format
 */
function mapFlightAPIResponse(flight: FlightAPIResponse): FlightEvent {
  const departure = flight.departure;
  const arrival = flight.arrival;

  const scheduledDepartureTime = departure?.scheduledTime?.local || departure?.scheduledTime?.utc;
  const scheduledArrivalTime = arrival?.scheduledTime?.local || arrival?.scheduledTime?.utc;

  return {
    id: "",
    tripId: "",
    eventType: "flight" as const,
    title: `${flight.airline?.name || ""} ${flight.number}`.trim(),
    startDate: scheduledDepartureTime || new Date().toISOString(),
    endDate: scheduledArrivalTime || new Date().toISOString(),
    notes: "",
    locationName: `${departure?.airport?.iata || ""} → ${arrival?.airport?.iata || ""}`,
    latitude: undefined,
    longitude: undefined,
    sortOrder: 0,

    flightNumber: flight.number || "",
    airlineName: flight.airline?.name || "",
    airlineIATA: flight.airline?.iata || "",
    departureAirportIATA: departure?.airport?.iata || "",
    departureAirportName: departure?.airport?.name || "",
    departureTerminal: departure?.terminal || "",
    departureGate: departure?.gate || "",
    arrivalAirportIATA: arrival?.airport?.iata || "",
    arrivalAirportName: arrival?.airport?.name || "",
    arrivalTerminal: arrival?.terminal || "",
    arrivalGate: arrival?.gate || "",
    departureLatitude: departure?.airport?.location?.lat,
    departureLongitude: departure?.airport?.location?.lon,
    arrivalLatitude: arrival?.airport?.location?.lat,
    arrivalLongitude: arrival?.airport?.location?.lon,
    flightStatus: flight.status || "",
    scheduledDepartureTime,
    scheduledArrivalTime,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * AeroDataBox API response types
 */
interface FlightAPIResponse {
  number: string;
  airline?: {
    name: string;
    iata: string;
  };
  status?: string;
  departure?: {
    airport?: {
      iata: string;
      name: string;
      location?: {
        lat: number;
        lon: number;
      };
    };
    terminal?: string;
    gate?: string;
    scheduledTime?: {
      local?: string;
      utc?: string;
    };
  };
  arrival?: {
    airport?: {
      iata: string;
      name: string;
      location?: {
        lat: number;
        lon: number;
      };
    };
    terminal?: string;
    gate?: string;
    scheduledTime?: {
      local?: string;
      utc?: string;
    };
  };
}
