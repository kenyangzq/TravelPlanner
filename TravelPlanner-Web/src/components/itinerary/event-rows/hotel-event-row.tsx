/**
 * TravelPlanner Web - Hotel Event Row Component
 *
 * Displays a hotel event with navigation links.
 * Port of iOS HotelEventRow.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Building2, MapPin, Trash2, ExternalLink, Search } from "lucide-react";
import { formatTime } from "@/lib/utils/dateFormatters";
import { buildLocationSearchLink } from "@/lib/utils/navigationLinks";
import type { ItineraryItem, HotelEvent } from "@/lib/models";

interface HotelEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
  tripCities?: string[];
}

export const HotelEventRow: React.FC<HotelEventRowProps> = ({
  item,
  onClick,
  onDelete,
  tripCities = [],
}) => {
  const event = item.event as HotelEvent;
  const checkInTime = formatTime(event.startDate);
  const checkOutTime = formatTime(event.endDate);
  const locationLink = React.useMemo(() => buildLocationSearchLink(event), [event]);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{event.hotelName}</h3>
            <div className="flex items-center gap-1 mt-1 text-amber-400">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
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

      <div className="space-y-2 mb-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Check-in: {checkInTime}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Check-out: {checkOutTime}
        </p>
      </div>

      {event.hotelAddress && (
        <p className="text-xs text-slate-500 mb-4">{event.hotelAddress}</p>
      )}

      {/* Links section */}
      <div className="flex flex-wrap gap-2">
        {/* Location link - opens Google Place page with reviews */}
        {locationLink && (
          <a
            href={locationLink.locationURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="w-3.5 h-3.5" />
            Maps
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}

        {/* RedNote link */}
        {event.googlePlaceName && tripCities.length > 0 && (
          <a
            href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(event.googlePlaceName + " " + tripCities[0])}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="w-3.5 h-3.5" />
            RedNote
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};
