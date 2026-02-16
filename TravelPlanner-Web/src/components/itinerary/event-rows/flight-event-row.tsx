/**
 * TravelPlanner Web - Flight Event Row Component
 *
 * Displays a flight event with navigation links.
 * Port of iOS FlightEventRow.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Plane, MapPin, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "../../ui/badge";
import { NavigationLinkRow } from "../navigation-link-row";
import { formatTime } from "@/lib/utils/dateFormatters";
import { buildLocationLink } from "@/lib/services/mapsService";
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
  const departureTime = format(new Date(event.startDate), "h:mm a");
  const arrivalTime = format(new Date(event.endDate), "h:mm a");

  // Build location link to departure airport
  const locationLink = React.useMemo(
    () => buildLocationLink(
      event.departureAirportName,
      undefined,
      event.departureLatitude,
      event.departureLongitude
    ),
    [event]
  );

  // Calculate flight duration
  const duration = Math.round(
    (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60)
  );
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Plane className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{event.title}</h3>
            <p className="text-xs text-slate-500">{event.airlineName} • Economy</p>
          </div>
        </div>
        {event.flightStatus && (
          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
            {event.flightStatus}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Departure/Arrival Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div>
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Departure</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{departureTime}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">
            {event.departureAirportIATA} • {event.departureTerminal || `Term ${event.departureTerminal || "T1"}`}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-slate-300 text-sm">⟷</span>
          <p className="text-[10px] text-slate-400 font-medium">{durationLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Arrival</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{arrivalTime}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">
            {event.arrivalAirportIATA} • {event.arrivalTerminal || `Term ${event.arrivalTerminal || "T1"}`}
          </p>
        </div>
      </div>

      {/* Location link to departure airport */}
      {locationLink && (
        <a
          href={locationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-primary hover:underline mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="w-4 h-4" />
          View airport on Google Maps
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
