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
import {
  Plane,
  Car,
  Building2,
  Utensils,
  Star,
  X,
} from "lucide-react";
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

  // Event type options
  const eventTypes = [
    { value: "flight" as const, label: "Flight", icon: Plane },
    { value: "carRental" as const, label: "Car Rental", icon: Car },
    { value: "hotel" as const, label: "Hotel", icon: Building2 },
    { value: "restaurant" as const, label: "Restaurant", icon: Utensils },
    { value: "activity" as const, label: "Activity", icon: Star },
  ];

  return (
    <Dialog open={isAddEventOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Edit Event" : "Add Event"}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-1 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Event type selection (only when creating new event) */}
          {!isEditing && !eventType && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select event type:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedEventType(type.value)}
                      className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
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
