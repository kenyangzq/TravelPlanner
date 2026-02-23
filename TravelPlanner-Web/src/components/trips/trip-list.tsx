/**
 * TravelPlanner Web - Trip List Component
 *
 * Displays list of trips with empty state.
 * Past trips (endDate before today) are collapsed at the bottom.
 */

import * as React from "react";
import { TripRow } from "./trip-row";
import { EmptyState } from "../ui/empty-state";
import { MapPin, ChevronDown, ChevronRight } from "lucide-react";
import type { Trip } from "@/lib/models";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { parseISO, startOfDay } from "date-fns";

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onCreateTrip?: () => void;
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
  onCreateTrip,
}) => {
  const [showPastTrips, setShowPastTrips] = React.useState(false);

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

  // Split trips into upcoming and past
  const today = startOfDay(new Date());
  const upcomingTrips = trips.filter(t => parseISO(t.endDate) >= today);
  const pastTrips = trips.filter(t => parseISO(t.endDate) < today);

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="w-12 h-12" />}
        title="No trips yet"
        message="Create your first trip to start planning your adventure."
        action={{
          label: "Create Trip",
          onClick: () => onCreateTrip?.(),
        }}
      />
    );
  }

  const renderTripGrid = (tripList: Trip[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
      {tripList.map((trip) => {
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && renderTripGrid(upcomingTrips)}

      {/* Past trips section */}
      {pastTrips.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastTrips(!showPastTrips)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-4"
          >
            {showPastTrips ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              Past Trips ({pastTrips.length})
            </span>
          </button>
          {showPastTrips && renderTripGrid(pastTrips)}
        </div>
      )}
    </div>
  );
};
