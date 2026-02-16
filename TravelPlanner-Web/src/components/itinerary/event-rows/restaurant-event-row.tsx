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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{event.restaurantName}</h3>
            <p className="text-xs text-slate-500">{time}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-slate-400 hover:text-primary transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {event.partySize > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <Users className="w-3 h-3" />
            <span>{event.partySize} people</span>
          </div>
        )}
        {event.cuisineType && (
          <Badge variant="default" className="text-xs bg-primary/10 text-primary">
            {event.cuisineType}
          </Badge>
        )}
      </div>

      {event.restaurantAddress && (
        <p className="text-xs text-slate-500 mb-4">{event.restaurantAddress}</p>
      )}

      {/* Navigation link */}
      {item.navigationToEvent && (
        <a
          href={item.navigationToEvent.directionsURL || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="w-4 h-4" />
          Navigate to restaurant
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
