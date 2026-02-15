/**
 * TravelPlanner Web - Trip Row Component
 *
 * Single trip row in the trip list.
 * Port of iOS TripRowView.swift.
 */

import * as React from "react";
import { format, parseISO } from "date-fns";
import { parseCities } from "@/lib/models";
import { formatDateRange } from "@/lib/utils/dateFormatters";
import { Badge } from "../ui/badge";
import { MapPin, Calendar, Trash2 } from "lucide-react";

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
  onSelect: () => void;
  onDelete: () => void;
}

export const TripRow: React.FC<TripRowProps> = ({ trip, onSelect, onDelete }) => {
  const cities = parseCities(trip.citiesRaw);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {trip.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {trip.destination || "No destination"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </div>

          {cities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {cities.map((city, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  {city}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
          aria-label="Delete trip"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
