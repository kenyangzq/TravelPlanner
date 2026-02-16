/**
 * TravelPlanner Web - Day Section Component
 *
 * Single day section with timeline design matching StitchUI.
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
  dayNumber?: number;
  items: ItineraryItem[];
  dayHotel: DayHotelInfo | null;
  onEventClick: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const DaySection: React.FC<DaySectionProps> = ({
  tripId,
  date,
  dayNumber,
  items,
  dayHotel,
  onEventClick,
  onDeleteEvent,
}) => {
  return (
    <section className="mb-12">
      {/* Day header */}
      <div className="flex items-center gap-4 mb-8 sticky top-24 py-2 bg-[#f6f7f8]/90 dark:bg-[#111921]/90 backdrop-blur-sm z-10">
        <div className="bg-primary/10 dark:bg-primary/20 text-primary w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">
          {dayNumber || format(date, "d")}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {format(date, "EEEE")}
          </h2>
          <p className="text-sm text-slate-500">{format(date, "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Timeline with events */}
      <div className="space-y-0 relative pl-4">
        {/* Timeline line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[repeating-linear-gradient(to_bottom,#197fe6_0,#197fe6_4px,transparent_4px,transparent_8px)]" />

        {/* Day hotel header (if applicable) */}
        {dayHotel && (
          <div className="relative pl-8 pb-10">
            <div className="absolute -left-[5px] top-4 w-3 h-3 rounded-full bg-primary ring-4 ring-[#f6f7f8] dark:ring-[#111921]" />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{dayHotel.hotel.hotelName}</h3>
                    <p className="text-xs text-slate-500">You're staying here</p>
                  </div>
                </div>
                {dayHotel.navigationToHotel && (
                  <a
                    href={dayHotel.navigationToHotel.directionsURL || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:text-primary/80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event rows */}
        {items.map((item, index) => {
          const event = item.event;
          const showTimelineDot = !dayHotel || index > 0;

          return (
            <React.Fragment key={item.id}>
              <div className="relative pl-8 pb-10">
                {showTimelineDot && (
                  <div className="absolute -left-[5px] top-4 w-3 h-3 rounded-full bg-primary ring-4 ring-[#f6f7f8] dark:ring-[#111921]" />
                )}
                {event.eventType === "flight" && (
                  <FlightEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                )}
                {event.eventType === "hotel" && (
                  <HotelEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                )}
                {event.eventType === "restaurant" && (
                  <RestaurantEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                )}
                {event.eventType === "activity" && (
                  <ActivityEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                )}
                {event.eventType === "carRental" && (
                  <CarRentalEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                )}
              </div>

              {/* Navigation link to next event */}
              {item.navigationLink && (
                <div className="relative pl-8 pb-10">
                  <div className="flex items-center gap-2 cursor-pointer text-primary hover:underline">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">
                      {item.navigationLink.durationLabel || "Navigate to next event"}
                    </span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
