/**
 * TravelPlanner Web - Flight API Route
 *
 * Next.js API route for AeroDataBox proxy.
 * Hides RapidAPI key on server side.
 */

import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const AERO_DATA_BOX_BASE_URL = "https://aerodatabox.p.rapidapi.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const number = searchParams.get("number");
    const date = searchParams.get("date");

    if (!number || !date) {
      return NextResponse.json(
        { error: "Missing flight number or date" },
        { status: 400 }
      );
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Format date for API (YYYY-MM-DD)
    const formattedDate = date;

    // Build URL
    const url = `${AERO_DATA_BOX_BASE_URL}/flights/number/${number}/${formattedDate}`;

    // Call AeroDataBox API
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Flight not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch flight data" },
        { status: response.status }
      );
    }

    const flights: FlightAPIResponse[] = await response.json();

    if (!flights || flights.length === 0) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      );
    }

    // Map API response to our FlightEvent format
    const flight = flights[0];
    const mappedFlight = mapFlightAPIResponse(flight);

    return NextResponse.json(mappedFlight);
  } catch (error) {
    console.error("Flight API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Map AeroDataBox API response to FlightEvent format
 */
function mapFlightAPIResponse(flight: FlightAPIResponse) {
  const departure = flight.departure;
  const arrival = flight.arrival;

  // Parse times
  const scheduledDepartureTime = departure?.scheduledTime?.local || departure?.scheduledTime?.utc;
  const scheduledArrivalTime = arrival?.scheduledTime?.local || arrival?.scheduledTime?.utc;

  return {
    id: "", // Will be generated on save
    tripId: "", // Will be set on save
    eventType: "flight" as const,
    title: `${flight.airline?.name || ""} ${flight.number}`.trim(),
    startDate: scheduledDepartureTime || new Date().toISOString(),
    endDate: scheduledArrivalTime || new Date().toISOString(),
    notes: "",
    locationName: `${departure?.airport?.iata || ""} → ${arrival?.airport?.iata || ""}`,
    latitude: undefined,
    longitude: undefined,
    sortOrder: 0,

    // Flight-specific fields
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
