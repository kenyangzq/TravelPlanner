/**
 * TravelPlanner Web - Calendar Export Utility
 *
 * Generates ICS (iCalendar) files for importing events into phone calendars.
 * RFC 5545 standard format compatible with iOS Calendar, Google Calendar, etc.
 */

import type { Trip, TripEvent } from "@/lib/models";
import { isFlightEvent, isHotelEvent, isRestaurantEvent, isActivityEvent, isCarRentalEvent } from "@/lib/db";

/**
 * Format date to ICS datetime format (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format date to ICS date format (YYYYMMDD) for all-day events
 */
function formatICSDateOnly(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate event description for ICS
 */
function generateEventDescription(event: TripEvent): string {
  let description = "";

  if (event.notes) {
    description += `Notes: ${event.notes}\n\n`;
  }

  if (isFlightEvent(event)) {
    description += `Flight: ${event.flightNumber}\n`;
    description += `Airline: ${event.airlineName}\n`;
    description += `Departure: ${event.departureAirportName} (${event.departureAirportIATA})\n`;
    if (event.departureTerminal) description += `Terminal: ${event.departureTerminal}\n`;
    if (event.departureGate) description += `Gate: ${event.departureGate}\n`;
    description += `Arrival: ${event.arrivalAirportName} (${event.arrivalAirportIATA})\n`;
    if (event.arrivalTerminal) description += `Terminal: ${event.arrivalTerminal}\n`;
    if (event.arrivalGate) description += `Gate: ${event.arrivalGate}\n`;
    if (event.flightStatus) description += `Status: ${event.flightStatus}\n`;
  } else if (isHotelEvent(event)) {
    description += `Hotel: ${event.hotelName}\n`;
    description += `Check-in: ${new Date(event.checkInDate).toLocaleDateString()}\n`;
    description += `Check-out: ${new Date(event.checkOutDate).toLocaleDateString()}\n`;
    if (event.hotelAddress) description += `Address: ${event.hotelAddress}\n`;
    if (event.confirmationNumber) description += `Confirmation: ${event.confirmationNumber}\n`;
  } else if (isRestaurantEvent(event)) {
    description += `Restaurant: ${event.restaurantName}\n`;
    description += `Cuisine: ${event.cuisineType}\n`;
    description += `Party Size: ${event.partySize}\n`;
    if (event.restaurantAddress) description += `Address: ${event.restaurantAddress}\n`;
    if (event.confirmationNumber) description += `Confirmation: ${event.confirmationNumber}\n`;
  } else if (isActivityEvent(event)) {
    if (event.activityLocationName) description += `Location: ${event.activityLocationName}\n`;
    if (event.activityDescription) description += `Description: ${event.activityDescription}\n`;
  } else if (isCarRentalEvent(event)) {
    description += `Rental Company: ${event.rentalCompany}\n`;
    description += `Pickup: ${event.pickupLocationName}\n`;
    if (event.pickupAirportCode) description += `Airport Code: ${event.pickupAirportCode}\n`;
    description += `Pickup Date: ${new Date(event.pickupDate).toLocaleString()}\n`;
    description += `Return: ${event.returnLocationName}\n`;
    if (event.returnAirportCode) description += `Airport Code: ${event.returnAirportCode}\n`;
    description += `Return Date: ${new Date(event.returnDate).toLocaleString()}\n`;
    if (event.confirmationNumber) description += `Confirmation: ${event.confirmationNumber}\n`;
  }

  return description.trim();
}

/**
 * Generate event location for ICS
 */
function generateEventLocation(event: TripEvent): string {
  if (isFlightEvent(event)) {
    return `${event.departureAirportName} (${event.departureAirportIATA})`;
  } else if (isHotelEvent(event)) {
    return event.hotelAddress || event.hotelName;
  } else if (isRestaurantEvent(event)) {
    return event.restaurantAddress || event.restaurantName;
  } else if (isActivityEvent(event)) {
    return event.activityLocationName || event.locationName;
  } else if (isCarRentalEvent(event)) {
    return event.pickupLocationName || event.locationName;
  }
  return "";
}

/**
 * Generate ICS content for a single event
 */
function generateEventICS(event: TripEvent, tripName: string): string {
  const uid = `${event.id}@travelplanner`;
  const now = formatICSDate(new Date().toISOString());

  let ics = "BEGIN:VEVENT\n";
  ics += `UID:${uid}\n`;
  ics += `DTSTAMP:${now}\n`;

  // Hotels are all-day events (check-in to check-out)
  if (isHotelEvent(event)) {
    // For hotels, use check-in date as start, check-out date as end
    // Add 1 day to check-out because ICS end date is exclusive
    const checkInDate = new Date(event.checkInDate);
    const checkOutDate = new Date(event.checkOutDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);

    ics += `DTSTART;VALUE=DATE:${formatICSDateOnly(event.checkInDate)}\n`;
    ics += `DTEND;VALUE=DATE:${formatICSDateOnly(checkOutDate.toISOString())}\n`;
    ics += `SUMMARY:${escapeICS(event.hotelName)}\n`;
  } else {
    // All other events use datetime
    ics += `DTSTART:${formatICSDate(event.startDate)}\n`;
    ics += `DTEND:${formatICSDate(event.endDate)}\n`;
    ics += `SUMMARY:${escapeICS(event.title)}\n`;
  }

  const description = generateEventDescription(event);
  if (description) {
    ics += `DESCRIPTION:${escapeICS(description)}\n`;
  }

  const location = generateEventLocation(event);
  if (location) {
    ics += `LOCATION:${escapeICS(location)}\n`;
  }

  ics += "END:VEVENT\n";

  return ics;
}

/**
 * Generate complete ICS file content for a trip
 */
export function generateICS(trip: Trip, events: TripEvent[]): string {
  let ics = "BEGIN:VCALENDAR\n";
  ics += "VERSION:2.0\n";
  ics += "PRODID:-//TravelPlanner//TravelPlanner Web//EN\n";
  ics += "CALSCALE:GREGORIAN\n";
  ics += "METHOD:PUBLISH\n";
  ics += `X-WR-CALNAME:${escapeICS(trip.name)}\n`;
  ics += `X-WR-CALDESC:Trip to ${escapeICS(trip.destination || trip.name)}\n`;

  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Add all events
  sortedEvents.forEach((event) => {
    ics += generateEventICS(event, trip.name);
  });

  ics += "END:VCALENDAR";

  return ics;
}

/**
 * Download ICS file for a trip
 */
export function downloadICS(trip: Trip, events: TripEvent[]): void {
  const icsContent = generateICS(trip, events);

  // Create blob
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });

  // Create download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${trip.name.replace(/[^a-z0-9]/gi, "_")}_calendar.ics`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
