/**
 * TravelPlanner Web - Flight Event Row Component
 *
 * Displays a flight event with navigation links.
 * Port of iOS FlightEventRow.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Plane, MapPin, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "../../ui/badge";
import { NavigationLinkRow } from "../navigation-link-row";
import { formatTime } from "@/lib/utils/dateFormatters";
import type { ItineraryItem, FlightEvent } from "@/lib/models";

interface FlightEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
}

export const FlightEventRow: React.FC<FlightEventRowProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  const event = item.event as FlightEvent;
  const departureTime = formatTime(event.startDate);
  const arrivalTime = formatTime(event.endDate);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {event.title}
            </p>
            <p className="text-xs text-gray-500">
              {departureTime} → {arrivalTime}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Flight route */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {event.departureAirportIATA || "Departure"}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {event.arrivalAirportIATA || "Arrival"}
        </span>
        {event.flightStatus && (
          <Badge variant="default" className="text-xs">
            {event.flightStatus}
          </Badge>
        )}
      </div>

      {/* Navigation links */}
      {item.navigationToDeparture && (
        <a
          href={item.navigationToDeparture.directionsURL || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="w-3 h-3" />
          To {item.navigationToDeparture.destinationLabel}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {item.navigationToHotel && (
        <NavigationLinkRow navigationLink={item.navigationToHotel} variant="toHotel" />
      )}
    </div>
  );
};
