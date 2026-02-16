/**
 * TravelPlanner Web - Add/Edit Event Dialog
 *
 * Main dialog for adding/editing events with event type selection.
 * Port of iOS AddEventView.swift + EditEventView.swift.
 */

"use client";

import * as React from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useEvents } from "@/lib/hooks/useEvents";
import { useUIStore } from "@/lib/store";
import { X } from "lucide-react";
import { FlightForm } from "./flight-form";
import { HotelForm } from "./hotel-form";
import { RestaurantForm } from "./restaurant-form";
import { ActivityForm } from "./activity-form";
import { CarRentalForm } from "./car-rental-form";
import type { Trip, FlightEvent, HotelEvent, RestaurantEvent, ActivityEvent, CarRentalEvent } from "@/lib/models";

interface AddEventDialogProps {
  tripId: string;
  trip: Trip;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({ tripId, trip }) => {
  const {
    isAddEventOpen,
    setIsAddEventOpen,
    editingEvent,
    setEditingEvent,
    selectedEventType,
    setSelectedEventType,
  } = useUIStore();
  const { deleteEvent } = useEvents(tripId);

  const isEditing = editingEvent !== null;
  const eventType = selectedEventType || editingEvent?.eventType || null;

  const handleClose = () => {
    setIsAddEventOpen(false);
    setEditingEvent(null);
    setSelectedEventType(null);
  };

  const handleDelete = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
      handleClose();
    }
  };

  // Event type options for horizontal tabs
  const eventTypes = [
    { value: "flight" as const, label: "Flight", icon: "flight" },
    { value: "hotel" as const, label: "Hotel", icon: "hotel" },
    { value: "restaurant" as const, label: "Restaurant", icon: "restaurant" },
    { value: "carRental" as const, label: "Car", icon: "directions_car" },
    { value: "activity" as const, label: "Other", icon: "more_horiz" },
  ];

  return (
    <Dialog open={isAddEventOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
              {isEditing ? "Edit Event" : "Add Event to Itinerary"}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[85vh] overflow-y-auto p-6">
          {/* Event type selection (only when creating new event) */}
          {!isEditing && !eventType && (
            <div className="">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                What type of event?
              </p>
              <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedEventType(type.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md transition-all ${
                      eventType === type.value
                        ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                        : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="material-icons text-xl">{type.icon}</span>
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Event type forms */}
          {eventType === "flight" && (
            <FlightForm
              tripId={tripId}
              trip={trip}
              existingEvent={editingEvent as FlightEvent | null}
              onClose={handleClose}
            />
          )}
          {eventType === "hotel" && (
            <HotelForm
              tripId={tripId}
              trip={trip}
              existingEvent={editingEvent as HotelEvent | null}
              onClose={handleClose}
            />
          )}
          {eventType === "restaurant" && (
            <RestaurantForm
              tripId={tripId}
              trip={trip}
              existingEvent={editingEvent as RestaurantEvent | null}
              onClose={handleClose}
            />
          )}
          {eventType === "activity" && (
            <ActivityForm
              tripId={tripId}
              trip={trip}
              existingEvent={editingEvent as ActivityEvent | null}
              onClose={handleClose}
            />
          )}
          {eventType === "carRental" && (
            <CarRentalForm
              tripId={tripId}
              trip={trip}
              existingEvent={editingEvent as CarRentalEvent | null}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
