/**
 * TravelPlanner Web - Trip Detail Hook
 *
 * Custom hook for itinerary grouping, navigation logic, and hotel lookup.
 * Port of iOS TripDetailViewModel.swift.
 */

import { useMemo } from "react";
import { useEvents } from "./useEvents";
import type { TripEvent, HotelEvent, DayHotelInfo, ItineraryItem } from "../models";
import {
  isHotelEvent,
  isFlightEvent,
} from "../db";
import {
  buildNavigationToEvent,
  buildNavigationToHotel,
  buildNavigationToDeparture,
  findHotelForDay,
  findHotelsForDay,
} from "../utils/navigationLinks";
import { getStartOfDay, getDayKey, parseDate } from "../utils/dateFormatters";

export interface EventsByDayResult {
  date: Date;
  items: ItineraryItem[];
  dayHotel: DayHotelInfo | null;
}

/**
 * Hook to get itinerary items with navigation links for a trip
 */
export function useItineraryItems(tripId: string) {
  const { events } = useEvents(tripId);

  const items = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const hotels = sorted.filter((e): e is HotelEvent => isHotelEvent(e));

    // Group events by day for back-to-hotel navigation
    const eventsByDay = new Map<string, TripEvent[]>();
    sorted.forEach((event) => {
      const dayKey = getDayKey(event.startDate);
      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, []);
      }
      eventsByDay.get(dayKey)!.push(event);
    });

    const itineraryItems: ItineraryItem[] = [];

    for (let index = 0; index < sorted.length; index++) {
      const event = sorted[index];
      let navToEvent: ItineraryItem["navigationToEvent"] = null;
      let navToHotel: ItineraryItem["navigationToHotel"] = null;
      let navToDeparture: ItineraryItem["navigationToDeparture"] = null;

      // Navigation to event (from user's current location)
      if (!isHotelEvent(event)) {
        navToEvent = buildNavigationToEvent(event);
      }

      // For flights: add navigation to departure airport
      if (isFlightEvent(event)) {
        navToDeparture = buildNavigationToDeparture(event);
      }

      // Add back-to-hotel navigation for last non-hotel event of each day
      if (!isHotelEvent(event)) {
        const eventDay = getDayKey(event.startDate);
        const dayEvents = eventsByDay.get(eventDay) ?? [];

        // Check if the next event is a hotel on the same day
        const nextEventIsHotelOnSameDay =
          index < sorted.length - 1 &&
          isHotelEvent(sorted[index + 1]) &&
          getDayKey(sorted[index + 1].startDate) === eventDay;

        // Check if this is the last non-hotel event of the day
        const nonHotelEvents = dayEvents.filter((e) => !isHotelEvent(e));
        const lastEvent = nonHotelEvents[nonHotelEvents.length - 1];

        if (lastEvent && lastEvent.id === event.id && !nextEventIsHotelOnSameDay) {
          // Find the latest hotel for this day
          const dayHotels = findHotelsForDay(parseDate(event.startDate), hotels);
          if (dayHotels.length > 0) {
            // Use the latest hotel (by check-in date)
            const latestHotel = dayHotels.reduce((prev, current) =>
              new Date(prev.checkInDate) > new Date(current.checkInDate) ? prev : current
            );
            navToHotel = buildNavigationToHotel(latestHotel);
          }
        }
      }

      itineraryItems.push({
        id: event.id,
        event,
        navigationToEvent: navToEvent,
        navigationToHotel: navToHotel,
        navigationToDeparture: navToDeparture,
      });
    }

    return itineraryItems;
  }, [events]);

  return items;
}

/**
 * Hook to get events grouped by day with hotel headers
 */
export function useEventsByDay(tripId: string): EventsByDayResult[] {
  const items = useItineraryItems(tripId);

  const grouped = useMemo(() => {
    // Group items by day
    const groupedMap = new Map<string, ItineraryItem[]>();
    items.forEach((item) => {
      const dayKey = getDayKey(item.event.startDate);
      if (!groupedMap.has(dayKey)) {
        groupedMap.set(dayKey, []);
      }
      groupedMap.get(dayKey)!.push(item);
    });

    // Get all hotels for the trip
    const events = items.map((i) => i.event);
    const hotels = events.filter((e): e is HotelEvent => isHotelEvent(e));

    // Convert map to array and add day hotel for each day
    return Array.from(groupedMap.entries())
      .map(([dayKey, items]) => {
        const date = parseDate(dayKey);

        // Find hotel covering this day, but skip if this is the check-in date
        let dayHotel: DayHotelInfo | null = null;
        const hotel = findHotelForDay(date, hotels);
        if (hotel) {
          const hotelCheckInDay = getDayKey(hotel.checkInDate);
          if (dayKey !== hotelCheckInDay) {
            // Add navigation to hotel from user's current location
            const navToHotel = buildNavigationToHotel(hotel);
            dayHotel = { hotel, navigationToHotel: navToHotel };
          }
        }

        return { date, items, dayHotel };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [items]);

  return grouped;
}

/**
 * Hook to get all hotels for a trip (for calendar view)
 */
export function useTripHotels(tripId: string): HotelEvent[] {
  const { events } = useEvents(tripId);

  return useMemo(() => {
    return events
      .filter((e): e is HotelEvent => isHotelEvent(e))
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
  }, [events]);
}
