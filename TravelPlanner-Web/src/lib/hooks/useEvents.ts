/**
 * TravelPlanner Web - Event Data Hook
 *
 * Custom hook for event CRUD operations using Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { dbHelpers } from "../db";
import type { TripEvent } from "../models";

/**
 * Hook to query events for a specific trip
 */
export function useEvents(tripId: string) {
  // Live query for trip events
  const events = useLiveQuery(() => dbHelpers.getEventsForTrip(tripId), [
    tripId,
  ]);

  return {
    events: events ?? [],
    isLoading: events === undefined,
    createEvent: async (event: Omit<TripEvent, "id">) => {
      return await dbHelpers.createEvent(event);
    },
    updateEvent: async (id: string, updates: Partial<TripEvent>) => {
      await dbHelpers.updateEvent(id, updates);
    },
    deleteEvent: async (id: string) => {
      await dbHelpers.deleteEvent(id);
    },
    getEvent: async (id: string) => {
      return await dbHelpers.getEvent(id);
    },
  };
}
