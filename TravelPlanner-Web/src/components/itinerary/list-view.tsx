/**
 * TravelPlanner Web - List View Component
 *
 * Itinerary list view with day sections and hotel headers.
 * Port of iOS ItineraryView.swift + ItineraryDaySection.swift.
 */

"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { DaySection } from "./day-section";
import { EmptyState } from "../ui/empty-state";
import { Calendar } from "lucide-react";
import type { EventsByDayResult } from "@/lib/hooks/useTripDetail";
import { useReminders } from "@/lib/hooks/useReminders";
import { useTrips } from "@/lib/hooks/useTrips";
import { parseCities } from "@/lib/models";

interface ListViewProps {
  tripId: string;
  eventsByDay: EventsByDayResult[];
  onEventClick: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tripId,
  eventsByDay,
  onEventClick,
  onDeleteEvent,
}) => {
  const { remindersByDay, saveReminder, deleteReminder } = useReminders(tripId);
  const { trips } = useTrips();
  const trip = trips.find((t) => t.id === tripId);
  const tripCities = trip ? parseCities(trip.citiesRaw) : [];
  if (eventsByDay.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-12 h-12" />}
        title="No events yet"
        message="Add your first event to start planning your itinerary."
      />
    );
  }

  return (
    <div>
      {eventsByDay.map(({ date, items, dayHotel }, index) => {
        const dayKey = format(date, "yyyy-MM-dd");
        return (
          <DaySection
            key={date.toISOString()}
            tripId={tripId}
            date={date}
            dayNumber={index + 1}
            items={items}
            dayHotel={dayHotel}
            reminder={remindersByDay.get(dayKey)}
            tripCities={tripCities}
            onEventClick={onEventClick}
            onDeleteEvent={onDeleteEvent}
            onSaveReminder={saveReminder}
            onDeleteReminder={deleteReminder}
          />
        );
      })}
    </div>
  );
};
