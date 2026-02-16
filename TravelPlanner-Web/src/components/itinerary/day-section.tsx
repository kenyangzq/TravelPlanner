/**
 * TravelPlanner Web - Day Section Component
 *
 * Single day section with timeline design matching StitchUI.
 * Includes map view and reminder on the right side.
 */

"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Building2, StickyNote, Pencil } from "lucide-react";
import { FlightEventRow } from "./event-rows/flight-event-row";
import { HotelEventRow } from "./event-rows/hotel-event-row";
import { RestaurantEventRow } from "./event-rows/restaurant-event-row";
import { ActivityEventRow } from "./event-rows/activity-event-row";
import { CarRentalEventRow } from "./event-rows/car-rental-event-row";
import type { ItineraryItem, DayHotelInfo, Reminder } from "@/lib/models";

interface DaySectionProps {
  tripId: string;
  date: Date;
  dayNumber?: number;
  items: ItineraryItem[];
  dayHotel: DayHotelInfo | null;
  reminder?: Reminder;
  tripCities: string[];
  onEventClick: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onSaveReminder?: (dayKey: string, content: string) => void;
  onDeleteReminder?: (id: string) => void;
}

export const DaySection: React.FC<DaySectionProps> = ({
  tripId,
  date,
  dayNumber,
  items,
  dayHotel,
  reminder,
  tripCities,
  onEventClick,
  onDeleteEvent,
  onSaveReminder,
  onDeleteReminder,
}) => {
  const [isEditingReminder, setIsEditingReminder] = React.useState(false);
  const [reminderText, setReminderText] = React.useState(reminder?.content ?? "");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const dayKey = format(date, "yyyy-MM-dd");

  React.useEffect(() => {
    setReminderText(reminder?.content ?? "");
  }, [reminder?.content]);

  React.useEffect(() => {
    if (isEditingReminder && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditingReminder]);

  const handleSaveReminder = () => {
    const trimmed = reminderText.trim();
    if (trimmed && onSaveReminder) {
      onSaveReminder(dayKey, trimmed);
    } else if (!trimmed && reminder && onDeleteReminder) {
      onDeleteReminder(reminder.id);
    }
    setIsEditingReminder(false);
  };

  return (
    <section className="mb-16 max-w-7xl mx-auto">
      {/* Day header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-primary/10 dark:bg-primary/20 text-primary w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl shadow-sm flex-shrink-0">
          {dayNumber || format(date, "d")}
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {format(date, "EEEE")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{format(date, "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Timeline layout - Map and reminder hidden for now */}
      <div className="relative pl-12 sm:pl-16 pr-2 sm:pr-4">
        {/* Timeline line */}
        <div className="absolute left-[2.5rem] sm:left-[3.5rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary to-transparent opacity-30" />

        {/* Day hotel header (if applicable) */}
        {dayHotel && (
            <div className="relative pl-6 sm:pl-8 pb-6">
              <span className="absolute -left-[2.5rem] sm:-left-[3.5rem] top-4 w-[2rem] sm:w-[2.75rem] text-right pr-1 sm:pr-3 text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-tight">
                {format(parseISO(dayHotel.hotel.checkInDate), "h:mma")}
              </span>
              <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-950" />
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{dayHotel.hotel.hotelName}</h3>
                    <p className="text-sm text-slate-500">You're staying here</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event rows */}
          {items.map((item, index) => {
            const event = item.event;
            const showTimelineDot = !dayHotel || index > 0;

            return (
              <div key={item.id} className="relative pl-6 sm:pl-8 pb-6">
                {showTimelineDot && (
                  <>
                    <span className="absolute -left-[2.5rem] sm:-left-[3.5rem] top-4 w-[2rem] sm:w-[2.75rem] text-right pr-1 sm:pr-3 text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-tight">
                      {format(parseISO(event.startDate), "h:mma")}
                    </span>
                    <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-950" />
                  </>
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
                    tripCities={tripCities}
                  />
                )}
                {event.eventType === "restaurant" && (
                  <RestaurantEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                    tripCities={tripCities}
                  />
                )}
                {event.eventType === "activity" && (
                  <ActivityEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                    tripCities={tripCities}
                  />
                )}
                {event.eventType === "carRental" && (
                  <CarRentalEventRow
                    item={item}
                    onClick={() => onEventClick(event.id)}
                    onDelete={() => onDeleteEvent(event.id)}
                    tripCities={tripCities}
                  />
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
};
