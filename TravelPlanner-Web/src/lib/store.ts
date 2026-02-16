/**
 * TravelPlanner Web - Zustand Store for UI State
 *
 * UI-only state (modals, editing state, view modes).
 * Data lives in Dexie (IndexedDB), UI state lives in Zustand.
 * This separation mirrors iOS: SwiftData for data, @Observable ViewModels for UI state.
 */

import { create } from "zustand";
import type { TripEvent } from "./models";

interface UIState {
  // Trip list modals
  isNewTripDialogOpen: boolean;
  setIsNewTripDialogOpen: (open: boolean) => void;

  // Itinerary view modals
  isAddEventOpen: boolean;
  setIsAddEventOpen: (open: boolean) => void;
  editingEvent: TripEvent | null;
  setEditingEvent: (event: TripEvent | null) => void;

  // View mode (list vs calendar vs map)
  itineraryViewMode: "list" | "calendar" | "map";
  setItineraryViewMode: (mode: "list" | "calendar" | "map") => void;

  // Confirmation dialogs
  deleteConfirmation: { type: "trip" | "event"; id: string } | null;
  setDeleteConfirmation: (conf: { type: "trip" | "event"; id: string } | null) => void;

  // Event type selection for new event
  selectedEventType: TripEvent["eventType"] | null;
  setSelectedEventType: (type: TripEvent["eventType"] | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNewTripDialogOpen: false,
  setIsNewTripDialogOpen: (open) => set({ isNewTripDialogOpen: open }),

  isAddEventOpen: false,
  setIsAddEventOpen: (open) => set({ isAddEventOpen: open }),
  editingEvent: null,
  setEditingEvent: (event) => set({ editingEvent: event }),

  itineraryViewMode: "list",
  setItineraryViewMode: (mode) => set({ itineraryViewMode: mode }),

  deleteConfirmation: null,
  setDeleteConfirmation: (conf) => set({ deleteConfirmation: conf }),

  selectedEventType: null,
  setSelectedEventType: (type) => set({ selectedEventType: type }),
}));
