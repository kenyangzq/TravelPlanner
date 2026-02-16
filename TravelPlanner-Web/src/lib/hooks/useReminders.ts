/**
 * TravelPlanner Web - Reminders Hook
 *
 * Custom hook for reminder CRUD operations using Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, dbHelpers } from "../db";
import type { Reminder } from "../models";

/**
 * Hook to query reminders for a specific trip
 */
export function useReminders(tripId: string) {
  const reminders = useLiveQuery(
    () => dbHelpers.getRemindersForTrip(tripId),
    [tripId]
  );

  const remindersByDay = new Map<string, Reminder>();
  if (reminders) {
    for (const reminder of reminders) {
      remindersByDay.set(reminder.dayKey, reminder);
    }
  }

  return {
    remindersByDay,
    isLoading: reminders === undefined,
    saveReminder: async (dayKey: string, content: string) => {
      await dbHelpers.saveReminder(tripId, dayKey, content);
    },
    deleteReminder: async (id: string) => {
      await dbHelpers.deleteReminder(id);
    },
  };
}
