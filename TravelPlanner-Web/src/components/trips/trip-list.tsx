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

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  onSelectTrip,
  onDeleteTrip,
}) => {
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
    <div className="space-y-3">
      {trips.map((trip) => (
        <TripRow
          key={trip.id}
          trip={trip}
          onSelect={() => onSelectTrip(trip.id)}
          onDelete={() => onDeleteTrip(trip.id)}
        />
      ))}
    </div>
  );
};
