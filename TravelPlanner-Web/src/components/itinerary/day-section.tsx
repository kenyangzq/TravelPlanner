/**
 * TravelPlanner Web - Day Section Component
 *
 * Single day section with hotel header and event rows.
 * Port of iOS ItineraryDaySection.swift.
 */

import * as React from "react";
import { format } from "date-fns";
import { Building2, MapPin, ExternalLink } from "lucide-react";
import { FlightEventRow } from "./event-rows/flight-event-row";
import { HotelEventRow } from "./event-rows/hotel-event-row";
import { RestaurantEventRow } from "./event-rows/restaurant-event-row";
import { ActivityEventRow } from "./event-rows/activity-event-row";
import { CarRentalEventRow } from "./event-rows/car-rental-event-row";
import { NavigationLinkRow } from "./navigation-link-row";
import type { ItineraryItem, DayHotelInfo } from "@/lib/models";

interface DaySectionProps {
  tripId: string;
  date: Date;
  items: ItineraryItem[];
  dayHotel: DayHotelInfo | null;
  onEventClick: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const DaySection: React.FC<DaySectionProps> = ({
  tripId,
  date,
  items,
  dayHotel,
  onEventClick,
  onDeleteEvent,
}) => {
  return (
    <div className="space-y-3">
      {/* Date header */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {format(date, "EEEE, MMMM d, yyyy")}
      </h2>

      {/* Day hotel header (if applicable) */}
      {dayHotel && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-purple-900 dark:text-purple-100 truncate">
                  {dayHotel.hotel.hotelName}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  You're staying here
                </p>
              </div>
            </div>

            {dayHotel.navigationToHotel && (
              <a
                href={dayHotel.navigationToHotel.directionsURL || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Event rows */}
      {items.map((item) => {
        const event = item.event;

        switch (event.eventType) {
          case "flight":
            return (
              <FlightEventRow
                key={item.id}
                item={item}
                onClick={() => onEventClick(event.id)}
                onDelete={() => onDeleteEvent(event.id)}
              />
            );
          case "hotel":
            return (
              <HotelEventRow
                key={item.id}
                item={item}
                onClick={() => onEventClick(event.id)}
                onDelete={() => onDeleteEvent(event.id)}
              />
            );
          case "restaurant":
            return (
              <RestaurantEventRow
                key={item.id}
                item={item}
                onClick={() => onEventClick(event.id)}
                onDelete={() => onDeleteEvent(event.id)}
              />
            );
          case "activity":
            return (
              <ActivityEventRow
                key={item.id}
                item={item}
                onClick={() => onEventClick(event.id)}
                onDelete={() => onDeleteEvent(event.id)}
              />
            );
          case "carRental":
            return (
              <CarRentalEventRow
                key={item.id}
                item={item}
                onClick={() => onEventClick(event.id)}
                onDelete={() => onDeleteEvent(event.id)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
