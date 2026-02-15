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
import type { ItineraryItem, CarRentalEvent } from "@/lib/models";

interface CarRentalEventRowProps {
  item: ItineraryItem;
  onClick: () => void;
  onDelete: () => void;
}

export const CarRentalEventRow: React.FC<CarRentalEventRowProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  const event = item.event as CarRentalEvent;
  const pickupTime = formatTime(event.startDate);
  const returnTime = formatTime(event.endDate);

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-lg border p-4 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Car className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {event.rentalCompany || "Car Rental"}
            </p>
            <p className="text-xs text-gray-500">
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
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        <div>Pickup: {event.pickupLocationName || event.pickupAirportCode || "TBD"}</div>
        <div>Return: {event.returnLocationName || event.returnAirportCode || "TBD"}</div>
      </div>

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
          To pickup location
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
