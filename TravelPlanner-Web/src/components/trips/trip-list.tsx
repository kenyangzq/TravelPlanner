/**
 * TravelPlanner Web - Trip List Component
 *
 * Displays list of trips with empty state.
 */

import * as React from "react";
import { TripRow } from "./trip-row";
import { EmptyState } from "../ui/empty-state";
import { MapPin } from "lucide-react";
import type { Trip } from "@/lib/models";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

interface TripEventCounts {
  total: number;
  flights: number;
  hotels: number;
  activities: number;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  onSelectTrip,
  onDeleteTrip,
}) => {
  // Fetch event counts for all trips by type
  const eventCounts = useLiveQuery(() => {
    return Promise.all(
      trips.map(async (trip) => {
        const events = await db.events.where('tripId').equals(trip.id).toArray();
        return {
          tripId: trip.id,
          counts: {
            total: events.length,
            flights: events.filter(e => e.eventType === 'flight').length,
            hotels: events.filter(e => e.eventType === 'hotel').length,
            activities: events.filter(e =>
              e.eventType === 'restaurant' || e.eventType === 'activity' || e.eventType === 'carRental'
            ).length,
          }
        };
      })
    ).then((results) => {
      const map = new Map<string, TripEventCounts>();
      results.forEach(({ tripId, counts }) => map.set(tripId, counts));
      return map;
    });
  }, [trips]);

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="w-12 h-12" />}
        title="No trips yet"
        message="Create your first trip to start planning your adventure."
        action={{
          label: "Create Trip",
          onClick: () => {
            // This will be handled by parent component
            const event = new CustomEvent("create-trip");
            window.dispatchEvent(event);
          },
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {trips.map((trip) => {
        const counts = eventCounts?.get(trip.id);
        return (
          <TripRow
            key={trip.id}
            trip={trip}
            eventCount={counts?.total || 0}
            flightCount={counts?.flights || 0}
            hotelCount={counts?.hotels || 0}
            activityCount={counts?.activities || 0}
            onSelect={() => onSelectTrip(trip.id)}
            onDelete={() => onDeleteTrip(trip.id)}
          />
        );
      })}
    </div>
  );
};
