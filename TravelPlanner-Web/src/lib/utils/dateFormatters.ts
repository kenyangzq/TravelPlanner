/**
 * TravelPlanner Web - Date Formatters
 *
 * Date formatting utilities using date-fns.
 * Port of iOS DateFormatters.swift.
 */

import { format, parseISO, startOfDay, isSameDay } from "date-fns";

/**
 * Format date as full month day, year (e.g., "January 15, 2025")
 */
export function formatDateFull(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "MMMM d, yyyy");
}

/**
 * Format date as short month day (e.g., "Jan 15")
 */
export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "MMM d");
}

/**
 * Format time as hour:minute AM/PM (e.g., "2:30 PM")
 */
export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "h:mm a");
}

/**
 * Format date and time (e.g., "Jan 15, 2025 at 2:30 PM")
 */
export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format time as hour:minute (24-hour format, e.g., "14:30")
 */
export function formatTime24(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "HH:mm");
}

/**
 * Format date for API (e.g., "2025-01-15")
 */
export function formatDateForAPI(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy-MM-dd");
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Get start of day for a date string
 */
export function getStartOfDay(dateStr: string): Date {
  return startOfDay(parseISO(dateStr));
}

/**
 * Check if two date strings are the same day
 */
export function isSameDayStr(dateStr1: string, dateStr2: string): boolean {
  return isSameDay(parseISO(dateStr1), parseISO(dateStr2));
}

/**
 * Format date range (e.g., "Jan 15 - Jan 20, 2025")
 */
export function formatDateRange(startDateStr: string, endDateStr: string): string {
  const startDate = parseISO(startDateStr);
  const endDate = parseISO(endDateStr);

  if (isSameDay(startDate, endDate)) {
    return format(startDate, "MMMM d, yyyy");
  }

  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${format(startDate, "MMMM d")} - ${format(endDate, "d, yyyy")}`;
  }

  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
}

/**
 * Get day key for grouping (e.g., "2025-01-15")
 */
export function getDayKey(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy-MM-dd");
}

/**
 * Format duration in minutes to human readable string (e.g., "2h 30min")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
}
