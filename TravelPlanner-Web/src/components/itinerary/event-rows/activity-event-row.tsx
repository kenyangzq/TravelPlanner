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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Star className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{event.title}</h3>
            <p className="text-xs text-slate-500">{startTime}</p>
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

      {event.activityDescription && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {event.activityDescription}
        </p>
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
          Navigate to activity
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
