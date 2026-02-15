/**
 * TravelPlanner Web - Restaurant Event Row Component
 *
 * Displays a restaurant event with navigation links.
 * Port of iOS RestaurantEventRow.swift.
 */

import * as React from "react";
import { Utensils, MapPin, Trash2, Users, Clock, ExternalLink } from "lucide-react";
import { Badge } from "../../ui/badge";
import { formatTime } from "@/lib/utils/dateFormatters";
import type { ItineraryItem, RestaurantEvent } from "@/lib/models";

interface RestaurantEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
}

export const RestaurantEventRow: React.FC<RestaurantEventRowProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  const event = item.event as RestaurantEvent;
  const time = formatTime(event.startDate);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Utensils className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {event.restaurantName}
            </p>
            <p className="text-xs text-gray-500">{time}</p>
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

      <div className="flex items-center gap-3 mb-2">
        {event.partySize > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span>{event.partySize} people</span>
          </div>
        )}
        {event.cuisineType && (
          <Badge variant="default" className="text-xs">
            {event.cuisineType}
          </Badge>
        )}
      </div>

      {event.restaurantAddress && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {event.restaurantAddress}
        </p>
      )}

      {/* Navigation links */}
      {item.navigationToEvent && (
        <a
          href={item.navigationToEvent.directionsURL || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="w-3 h-3" />
          To restaurant
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {item.navigationToHotel && (
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <MapPin className="w-3 h-3" />
          Back to {item.navigationToHotel.destinationLabel}
          <ExternalLink className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};
