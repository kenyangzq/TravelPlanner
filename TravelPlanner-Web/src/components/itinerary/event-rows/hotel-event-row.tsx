/**
 * TravelPlanner Web - Hotel Event Row Component
 *
 * Displays a hotel event with navigation links.
 * Port of iOS HotelEventRow.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Building2, MapPin, Trash2, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/utils/dateFormatters";
import type { ItineraryItem, HotelEvent } from "@/lib/models";

interface HotelEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
}

export const HotelEventRow: React.FC<HotelEventRowProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  const event = item.event as HotelEvent;
  const checkInTime = formatTime(event.startDate);
  const checkOutTime = formatTime(event.endDate);

  return (
    <div
      className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-purple-900 dark:text-purple-100">
              {event.hotelName}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Check-in: {checkInTime} • Check-out: {checkOutTime}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-purple-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {event.hotelAddress && (
        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
          {event.hotelAddress}
        </p>
      )}

      {/* Navigation link */}
      {item.navigationToEvent && (
        <a
          href={item.navigationToEvent.directionsURL || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="w-3 h-3" />
          To hotel
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
