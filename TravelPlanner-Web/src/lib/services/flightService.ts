/**
 * TravelPlanner Web - Flight Service
 *
 * Client-side service for flight API calls.
 */

import type { FlightEvent } from "@/lib/models";

export interface FlightSearchParams {
  number: string;
  date: string; // YYYY-MM-DD format
}

/**
 * Search for flight information via Next.js API route
 */
export async function searchFlight(
  params: FlightSearchParams
): Promise<FlightEvent> {
  const url = new URL("/api/flights", window.location.origin);
  url.searchParams.set("number", params.number);
  url.searchParams.set("date", params.date);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to search flight");
  }

  return await response.json();
}
