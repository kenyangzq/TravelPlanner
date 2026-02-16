/**
 * TravelPlanner Web - Car Rental Event Row Component
 *
 * Displays a car rental event with navigation links.
 * Port of iOS CarRentalEventRow.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Car, MapPin, Trash2, ExternalLink } from "lucide-react";
import { formatTime } from "@/lib/utils/dateFormatters";
import { buildLocationSearchLink } from "@/lib/utils/navigationLinks";
import type { ItineraryItem, CarRentalEvent } from "@/lib/models";

interface CarRentalEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
  tripCities?: string[];
}

export const CarRentalEventRow: React.FC<CarRentalEventRowProps> = ({
  item,
  onClick,
  onDelete,
  tripCities = [],
}) => {
  const event = item.event as CarRentalEvent;
  const pickupTime = formatTime(event.startDate);
  const returnTime = formatTime(event.endDate);
  const locationLink = React.useMemo(() => buildLocationSearchLink(event), [event]);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Car className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{event.rentalCompany || "Car Rental"}</h3>
            <p className="text-xs text-slate-500">
              Pickup: {pickupTime} • Return: {returnTime}
            </p>
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

      <div className="text-xs text-slate-500 mb-4 space-y-1">
        <div>Pickup: {event.pickupLocationName || event.pickupAirportCode || "TBD"}</div>
        <div>Return: {event.returnLocationName || event.returnAirportCode || "TBD"}</div>
      </div>

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
      </div>
    </div>
  );
};
