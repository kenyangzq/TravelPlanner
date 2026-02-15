/**
 * TravelPlanner Web - Calendar View Component
 *
 * Google Calendar-style grid view with time-positioned events.
 * Port of iOS CalendarItineraryView.swift.
 */

import * as React from "react";
import { format, eachDayOfInterval, parseISO, startOfDay, isSameDay } from "date-fns";
import { EmptyState } from "../ui/empty-state";
import { Calendar, MapPin, Plane, ExternalLink } from "lucide-react";
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

    // Map to 6 AM - 11 PM range (18 slots)
    const topOffset = Math.max(0, startHour - 6) * 64; // 64px per hour
    const height = Math.max(64, (endHour - startHour) * 64); // Minimum 64px (1 hour)

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
      {/* Calendar header with day columns */}
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex min-w-max">
          {/* Time column header */}
          <div className="w-16 flex-shrink-0 p-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
            Time
          </div>

          {/* Day columns */}
          {tripDays.map((day) => (
            <div
              key={day.toISOString()}
              className="w-32 flex-shrink-0 p-2 text-center border-l dark:border-gray-700"
            >
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {format(day, "EEE")}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable calendar body */}
      <div className="overflow-x-auto overflow-y-auto max-h-[800px]">
        <div className="flex min-w-max">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r dark:border-gray-700">
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="h-16 flex items-center justify-center border-b dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400"
              >
                {slot.label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {tripDays.map((day) => {
            // Find hotels for this day
            const dayHotels = hotels.filter((hotel) => {
              const checkIn = startOfDay(parseISO(hotel.checkInDate));
              const checkOut = startOfDay(parseISO(hotel.checkOutDate));
              return checkIn <= day && day <= checkOut;
            });

            // Get non-hotel events for this day
            const dayEvents = getDayEvents(day);

            return (
              <div
                key={day.toISOString()}
                className="w-32 flex-shrink-0 border-r dark:border-gray-700 relative"
                style={{ height: `${timeSlots.length * 64}px` }}
              >
                {/* Hotel banners at top */}
                {dayHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="absolute top-0 left-0 right-0 bg-purple-100 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800 p-1 text-xs z-10"
                  >
                    <div className="font-medium text-purple-900 dark:text-purple-100 truncate flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {hotel.hotelName}
                    </div>
                  </div>
                ))}

                {/* Time slot rows with events */}
                {timeSlots.map((slot) => {
                  // Find events that start during this hour
                  const slotEvents = dayEvents.filter((event) => {
                    const eventStart = parseISO(event.startDate);
                    const eventHour = eventStart.getHours();
                    return eventHour === slot.hour;
                  });

                  return (
                    <div
                      key={slot.hour}
                      className="h-16 border-b dark:border-gray-800 relative"
                    >
                      {/* Render events */}
                      {slotEvents.map((event) => {
                        const style = getEventStyle(event);
                        const isFlight = isFlightEvent(event);
                        const color = getEventColor(event.eventType);

                        // Color mapping
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
                            className={`absolute left-1 right-1 rounded border p-1 cursor-pointer hover:opacity-80 transition-opacity ${bgColors[color as keyof typeof bgColors]}`}
                            style={style}
                            onClick={() => onEventClick(event.id)}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              {isFlight ? (
                                <Plane className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              ) : (
                                <span className="w-3 h-3 bg-current opacity-50 rounded-full flex-shrink-0" />
                              )}
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {event.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {format(parseISO(event.startDate), "h:mm a")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
