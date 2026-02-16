/**
 * TravelPlanner Web - Dexie Database Schema
 *
 * IndexedDB database using Dexie.js for offline data persistence.
 * All dates stored as ISO strings.
 */

import Dexie, { Table } from "dexie";
import {
  Trip,
  TripEvent,
  BaseEvent,
  FlightEvent,
  HotelEvent,
  RestaurantEvent,
  ActivityEvent,
  CarRentalEvent,
  Reminder,
  ImageCache,
} from "./models";

/**
 * Main database class extending Dexie
 */
export class TravelPlannerDB extends Dexie {
  trips!: Table<Trip, string>;
  events!: Table<TripEvent, string>;
  reminders!: Table<Reminder, string>;
  imageCache!: Table<ImageCache, string>;

  constructor() {
    super("TravelPlannerDB");

    // Define tables and indexes
    this.version(1).stores({
      trips: "id, startDate, createdAt",
      events: "id, tripId, eventType, [tripId+startDate]",
    });

    this.version(2).stores({
      trips: "id, startDate, createdAt",
      events: "id, tripId, eventType, [tripId+startDate]",
      dayNotes: "id, tripId, [tripId+dayKey]",
    });

    // Version 3: Rename dayNotes to reminders
    this.version(3).stores({
      trips: "id, startDate, createdAt",
      events: "id, tripId, eventType, [tripId+startDate]",
      reminders: "id, tripId, [tripId+dayKey]",
    }).upgrade(tx => {
      // Migrate data from dayNotes to reminders
      return tx.table("dayNotes").toCollection().toArray((notes) => {
        return tx.table("reminders").bulkAdd(notes.map(n => ({
          id: n.id,
          tripId: n.tripId,
          dayKey: n.dayKey,
          content: n.content,
          updatedAt: n.updatedAt,
        })));
      });
    });

    // Version 4: Add imageCache for Unsplash city images
    this.version(4).stores({
      trips: "id, startDate, createdAt",
      events: "id, tripId, eventType, [tripId+startDate]",
      reminders: "id, tripId, [tripId+dayKey]",
      imageCache: "city, url, fetchedAt",
    });
  }
}

// Create a singleton instance
export const db = new TravelPlannerDB();

/**
 * Type guard to check if an event is a specific type
 */
export function isFlightEvent(event: TripEvent): event is FlightEvent {
  return event.eventType === "flight";
}

export function isHotelEvent(event: TripEvent): event is HotelEvent {
  return event.eventType === "hotel";
}

export function isRestaurantEvent(
  event: TripEvent
): event is RestaurantEvent {
  return event.eventType === "restaurant";
}

export function isActivityEvent(event: TripEvent): event is ActivityEvent {
  return event.eventType === "activity";
}

export function isCarRentalEvent(
  event: TripEvent
): event is CarRentalEvent {
  return event.eventType === "carRental";
}

/**
 * Helper to create a base event object with defaults
 */
export function createBaseEvent(
  tripId: string,
  eventType: TripEvent["eventType"],
  title: string,
  startDate: string,
  endDate: string
): BaseEvent {
  return {
    id: crypto.randomUUID(),
    tripId,
    eventType,
    title,
    startDate,
    endDate,
    notes: "",
    locationName: "",
    sortOrder: 0,
  };
}

/**
 * Helper to create a default flight event
 */
export function createDefaultFlightEvent(
  tripId: string,
  flightNumber: string,
  date: string
): FlightEvent {
  return {
    ...createBaseEvent(tripId, "flight", `Flight ${flightNumber}`, date, date),
    flightNumber,
    airlineName: "",
    airlineIATA: "",
    departureAirportIATA: "",
    departureAirportName: "",
    departureTerminal: "",
    departureGate: "",
    arrivalAirportIATA: "",
    arrivalAirportName: "",
    arrivalTerminal: "",
    arrivalGate: "",
    flightStatus: "",
  } as FlightEvent;
}

/**
 * Helper to create a default hotel event
 */
export function createDefaultHotelEvent(
  tripId: string,
  hotelName: string,
  checkInDate: string,
  checkOutDate: string
): HotelEvent {
  return {
    ...createBaseEvent(tripId, "hotel", hotelName, checkInDate, checkOutDate),
    hotelName,
    checkInDate,
    checkOutDate,
    hotelAddress: "",
    confirmationNumber: "",
  } as HotelEvent;
}

/**
 * Helper to create a default restaurant event
 */
export function createDefaultRestaurantEvent(
  tripId: string,
  restaurantName: string,
  reservationTime: string,
  endDate: string
): RestaurantEvent {
  return {
    ...createBaseEvent(
      tripId,
      "restaurant",
      restaurantName,
      reservationTime,
      endDate
    ),
    restaurantName,
    cuisineType: "",
    reservationTime,
    partySize: 2,
    restaurantAddress: "",
    confirmationNumber: "",
  } as RestaurantEvent;
}

/**
 * Helper to create a default activity event
 */
export function createDefaultActivityEvent(
  tripId: string,
  title: string,
  startDate: string,
  endDate: string
): ActivityEvent {
  return {
    ...createBaseEvent(tripId, "activity", title, startDate, endDate),
    activityLocationName: "",
    activityDescription: "",
  } as ActivityEvent;
}

/**
 * Helper to create a default car rental event
 */
export function createDefaultCarRentalEvent(
  tripId: string,
  pickupDate: string,
  returnDate: string
): CarRentalEvent {
  return {
    ...createBaseEvent(
      tripId,
      "carRental",
      "Car Rental",
      pickupDate,
      returnDate
    ),
    pickupDate,
    returnDate,
    pickupLocationName: "",
    pickupAirportCode: "",
    returnLocationName: "",
    returnAirportCode: "",
    rentalCompany: "",
    confirmationNumber: "",
    hasCarRental: true,
  } as CarRentalEvent;
}

/**
 * Database helper functions
 */
export const dbHelpers = {
  /**
   * Create a new trip
   */
  async createTrip(
    trip: Omit<Trip, "id" | "createdAt">
  ): Promise<string> {
    const id = crypto.randomUUID();
    const newTrip: Trip = {
      ...trip,
      id,
      createdAt: new Date().toISOString(),
    };
    await db.trips.add(newTrip);
    return id;
  },

  /**
   * Update a trip
   */
  async updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
    await db.trips.update(id, updates);
  },

  /**
   * Delete a trip and all its events (cascade)
   */
  async deleteTrip(id: string): Promise<void> {
    await db.transaction("rw", [db.trips, db.events, db.reminders], async () => {
      await db.events.where("tripId").equals(id).delete();
      await db.reminders.where("tripId").equals(id).delete();
      await db.trips.delete(id);
    });
  },

  /**
   * Get all trips sorted by start date
   */
  async getAllTrips(): Promise<Trip[]> {
    return await db.trips.orderBy("startDate").toArray();
  },

  /**
   * Get a trip by ID
   */
  async getTrip(id: string): Promise<Trip | undefined> {
    return await db.trips.get(id);
  },

  /**
   * Create a new event
   */
  async createEvent(event: Omit<TripEvent, "id">): Promise<string> {
    const id = crypto.randomUUID();
    const newEvent = { ...event, id } as TripEvent;
    await db.events.add(newEvent);
    return id;
  },

  /**
   * Update an event
   */
  async updateEvent(
    id: string,
    updates: Partial<TripEvent>
  ): Promise<void> {
    await db.events.update(id, updates);
  },

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    await db.events.delete(id);
  },

  /**
   * Get all events for a trip sorted by start date
   */
  async getEventsForTrip(tripId: string): Promise<TripEvent[]> {
    return await db.events
      .where("tripId")
      .equals(tripId)
      .sortBy("startDate");
  },

  /**
   * Get a single event by ID
   */
  async getEvent(id: string): Promise<TripEvent | undefined> {
    return await db.events.get(id);
  },

  /**
   * Get all reminders for a trip
   */
  async getRemindersForTrip(tripId: string): Promise<Reminder[]> {
    return await db.reminders.where("tripId").equals(tripId).toArray();
  },

  /**
   * Get a reminder by trip ID and day key
   */
  async getReminder(tripId: string, dayKey: string): Promise<Reminder | undefined> {
    return await db.reminders
      .where("[tripId+dayKey]")
      .equals([tripId, dayKey])
      .first();
  },

  /**
   * Save a reminder (create or update)
   */
  async saveReminder(tripId: string, dayKey: string, content: string): Promise<void> {
    const existing = await db.reminders
      .where("[tripId+dayKey]")
      .equals([tripId, dayKey])
      .first();

    if (existing) {
      await db.reminders.update(existing.id, {
        content,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.reminders.add({
        id: crypto.randomUUID(),
        tripId,
        dayKey,
        content,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    await db.reminders.delete(id);
  },
};
