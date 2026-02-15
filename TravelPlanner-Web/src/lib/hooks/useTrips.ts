/**
 * TravelPlanner Web - Trip Data Hook
 *
 * Custom hook for trip CRUD operations using Dexie live queries.
 * Port of iOS TripListViewModel.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, dbHelpers } from "../db";
import type { Trip } from "../models";

/**
 * Hook to query all trips sorted by start date
 */
export function useTrips() {
  // Live query for all trips
  const trips = useLiveQuery(() => dbHelpers.getAllTrips());

  return {
    trips: trips ?? [],
    isLoading: trips === undefined,
    createTrip: async (trip: Omit<Trip, "id" | "createdAt">) => {
      return await dbHelpers.createTrip(trip);
    },
    updateTrip: async (id: string, updates: Partial<Trip>) => {
      await dbHelpers.updateTrip(id, updates);
    },
    deleteTrip: async (id: string) => {
      await dbHelpers.deleteTrip(id);
    },
    getTrip: async (id: string) => {
      return await dbHelpers.getTrip(id);
    },
  };
}
