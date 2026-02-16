/**
 * TravelPlanner Web - Calendar View Component
 *
 * Google Calendar-style grid view with time-positioned events.
 * Port of iOS CalendarItineraryView.swift.
 */

import * as React from "react";
import { format, eachDayOfInterval, parseISO, startOfDay, isSameDay } from "date-fns";
import { EmptyState } from "../ui/empty-state";
import { Calendar, MapPin, Plane, ExternalLink, Trash2 } from "lucide-react";
import type { Trip, HotelEvent, TripEvent } from "@/lib/models";
import type { EventsByDayResult } from "@/lib/hooks/useTripDetail";
import { getEventIcon, getEventColor } from "@/lib/models";
import { isFlightEvent, isHotelEvent } from "@/lib/db";

interface CalendarViewProps {
  tripId: string;
  trip: Trip;
  hotels: HotelEvent[];
  eventsByDay: EventsByDayResult[];
  onEventClick: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tripId,
  trip,
  hotels,
  eventsByDay,
  onEventClick,
  onDeleteEvent,
}) => {
  // Responsive slot height: 40px on mobile, 64px on desktop
  const [slotHeight, setSlotHeight] = React.useState(64);
  React.useEffect(() => {
    const update = () => setSlotHeight(window.innerWidth < 640 ? 40 : 64);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const tripStart = startOfDay(parseISO(trip.startDate));
  const tripEnd = startOfDay(parseISO(trip.endDate));
  const tripDays = eachDayOfInterval({ start: tripStart, end: tripEnd });

  if (tripDays.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title="No valid date range"
        message="Please check your trip dates."
      />
    );
  }

  // Time slots for the left column (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6; // Start at 6 AM
    return { hour, label: format(new Date().setHours(hour, 0, 0, 0), "ha") };
  });

  // Get all non-hotel events for a specific day
  const getDayEvents = (day: Date): TripEvent[] => {
    const dayData = eventsByDay.find((d) => d.date.getTime() === day.getTime());
    if (!dayData) return [];
    return dayData.items
      .filter((item) => !isHotelEvent(item.event))
      .map((item) => item.event);
  };

  // Calculate event position and height
  const getEventStyle = (event: TripEvent) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);

    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;

    const topOffset = Math.max(0, startHour - 6) * slotHeight;
    const minHeight = slotHeight < 64 ? 32 : 80;
    const height = Math.max(minHeight, (endHour - startHour) * slotHeight);

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Hotels Section - Separate block above calendar */}
      {hotels.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Accommodations
            </h3>
          </div>
          <div className="p-3 sm:p-6 grid gap-3 sm:gap-4">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="relative bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onEventClick(hotel.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg mb-1 truncate">
                        {hotel.hotelName}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span>
                          {format(parseISO(hotel.checkInDate), "MMM d")} → {format(parseISO(hotel.checkOutDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      {hotel.hotelAddress && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          {hotel.hotelAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(hotel.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {hotels.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No accommodations booked for this trip
              </p>
            )}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Single scroll container so header and body scroll together horizontally */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] sm:max-h-[800px]">
          <div className="min-w-max">
            {/* Calendar header with day columns - sticks to top while vertical scrolling */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b">
              <div className="flex">
                {/* Time column header */}
                <div className="w-12 sm:w-16 flex-shrink-0 p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                  Time
                </div>

                {/* Day columns */}
                {tripDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="w-20 sm:w-32 flex-shrink-0 p-1.5 sm:p-2 text-center border-l dark:border-slate-700"
                  >
                    <div className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar body */}
            <div className="flex">
              {/* Time column */}
              <div className="w-12 sm:w-16 flex-shrink-0 border-r dark:border-gray-700">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.hour}
                    className="h-10 sm:h-16 flex items-center justify-center border-b dark:border-gray-800 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400"
                  >
                    {slot.label}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {tripDays.map((day) => {
                const dayEvents = getDayEvents(day);

                return (
                  <div
                    key={day.toISOString()}
                    className="w-20 sm:w-32 flex-shrink-0 border-r dark:border-slate-700 relative"
                    style={{ height: `${timeSlots.length * slotHeight}px` }}
                  >
                    {/* Time slot grid lines */}
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.hour}
                        className="h-10 sm:h-16 border-b dark:border-gray-800"
                      />
                    ))}

                    {/* Render events positioned absolutely within the day column */}
                    {dayEvents.map((event) => {
                      const style = getEventStyle(event);
                      const isFlight = isFlightEvent(event);
                      const color = getEventColor(event.eventType);

                      const bgColors = {
                        blue: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
                        red: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
                        orange: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
                        green: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
                        purple: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
                      };

                      return (
                        <div
                          key={event.id}
                          className={`absolute left-0.5 right-0.5 rounded-md sm:rounded-lg shadow-sm hover:shadow-md transition-all p-1 sm:p-1.5 cursor-pointer z-[1] ${bgColors[color as keyof typeof bgColors]}`}
                          style={style}
                          onClick={() => onEventClick(event.id)}
                        >
                          <div className="flex items-start gap-1">
                            {isFlight ? (
                              <Plane className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-current opacity-60 rounded-full flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                {event.title}
                              </div>
                              <div className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 hidden sm:block">
                                {format(parseISO(event.startDate), "h:mm a")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* End Calendar Grid */}
    </div>
  );
};
