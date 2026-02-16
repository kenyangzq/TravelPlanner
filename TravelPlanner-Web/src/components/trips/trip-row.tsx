/**
 * TravelPlanner Web - Trip Row Component
 *
 * Single trip card matching StitchUI design.
 */

import * as React from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { MapPin, Calendar, MoreHoriz, Flight, Hotel, Activity } from "lucide-react";

interface TripRowProps {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    citiesRaw: string;
    createdAt: string;
  };
  eventCount: number;
  flightCount?: number;
  hotelCount?: number;
  activityCount?: number;
  onSelect: () => void;
  onDelete: () => void;
}

// Generate gradient color based on trip ID for image placeholder
const getGradientColor = (id: string) => {
  const gradients = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-emerald-400 to-emerald-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-cyan-400 to-cyan-600",
  ];
  const index = parseInt(id.slice(-1), 16) % gradients.length;
  return gradients[index];
};

export const TripRow: React.FC<TripRowProps> = ({
  trip,
  eventCount,
  flightCount = 0,
  hotelCount = 0,
  activityCount = 0,
  onSelect,
  onDelete
}) => {
  const startDate = parseISO(trip.startDate);
  const today = new Date();
  const daysUntilTrip = differenceInDays(startDate, today);
  const gradientColor = getGradientColor(trip.id);

  return (
    <div
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-primary/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={onSelect}
    >
      {/* Image Header */}
      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-80`} />

        {/* Days Badge */}
        {daysUntilTrip > 0 && (
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-primary">
            IN {daysUntilTrip} DAYS
          </div>
        )}

        {/* Destination Label */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{trip.name}</h3>
          <p className="text-sm text-white/90 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" />
            {trip.destination || "Trip"}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(startDate, "MMM d")} — {format(parseISO(trip.endDate), "MMM d, yyyy")}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <MoreHoriz className="w-5 h-5" />
          </button>
        </div>

        {/* Event Count Badges */}
        <div className="flex flex-wrap gap-2">
          {flightCount > 0 && (
            <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
              <Flight className="w-3 h-3" /> {flightCount} Flight{flightCount > 1 ? "s" : ""}
            </span>
          )}
          {hotelCount > 0 && (
            <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
              <Hotel className="w-3 h-3" /> {hotelCount} Hotel{hotelCount > 1 ? "s" : ""}
            </span>
          )}
          {activityCount > 0 && (
            <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
              <Activity className="w-3 h-3" /> {activityCount} Activit{activityCount > 1 ? "ies" : "y"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
