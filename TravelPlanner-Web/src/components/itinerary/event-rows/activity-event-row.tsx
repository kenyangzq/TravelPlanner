/**
 * TravelPlanner Web - Activity Event Row Component
 *
 * Displays an activity event with navigation links.
 * Port of iOS ActivityEventRow.swift.
 */

import * as React from "react";
import { Star, MapPin, Trash2, Clock, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/utils/dateFormatters";
import type { ItineraryItem, ActivityEvent } from "@/lib/models";

interface ActivityEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
}

export const ActivityEventRow: React.FC<ActivityEventRowProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  const event = item.event as ActivityEvent;
  const startTime = formatTime(event.startDate);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <Star className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {event.title}
            </p>
            <p className="text-xs text-gray-500">{startTime}</p>
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

      {event.activityDescription && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {event.activityDescription}
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
          To activity
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
