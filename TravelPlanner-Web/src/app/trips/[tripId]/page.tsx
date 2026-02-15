/**
 * TravelPlanner Web - Trip Detail / Itinerary Page
 *
 * Itinerary view with list/calendar toggle.
 * Port of iOS ItineraryView.swift + CalendarItineraryView.swift.
 */

"use client";

import { useEventsByDay, useTripHotels } from "@/lib/hooks/useTripDetail";
import { useTrips } from "@/lib/hooks/useTrips";
import { useUIStore } from "@/lib/store";
import { ListView } from "@/components/itinerary/list-view";
import { CalendarView } from "@/components/itinerary/calendar-view";
import { AddEventDialog } from "@/components/forms/add-event-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, List, Calendar, ArrowLeft, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: { tripId: string };
}

export default function TripDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { tripId } = params;
  const { trips, deleteTrip } = useTrips();
  const { isAddEventOpen, setIsAddEventOpen, deleteConfirmation, setDeleteConfirmation } =
    useUIStore();

  const trip = trips.find((t) => t.id === tripId);
  const eventsByDay = useEventsByDay(tripId);
  const hotels = useTripHotels(tripId);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Trip not found
          </h2>
          <Button variant="secondary" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteTrip = async () => {
    if (deleteConfirmation?.type === "trip" && deleteConfirmation.id) {
      await deleteTrip(deleteConfirmation.id);
      setDeleteConfirmation(null);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => router.push("/")}
              className="p-1 -ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {trip.name}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{trip.destination || "No destination"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {eventsByDay.reduce((sum, day) => sum + day.items.length, 0)} events
            </p>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  onClick={() => useUIStore.getState().setItineraryViewMode("list")}
                  className={`p-2 ${
                    useUIStore.getState().itineraryViewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => useUIStore.getState().setItineraryViewMode("calendar")}
                  className={`p-2 ${
                    useUIStore.getState().itineraryViewMode === "calendar"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  useUIStore.getState().setSelectedEventType(null);
                  setIsAddEventOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {useUIStore.getState().itineraryViewMode === "list" ? (
          <ListView
            tripId={tripId}
            eventsByDay={eventsByDay}
            onEventClick={(eventId) => {
              const event = eventsByDay
                .flatMap((d) => d.items)
                .find((i) => i.event.id === eventId)?.event;
              if (event) {
                useUIStore.getState().setEditingEvent(event);
                useUIStore.getState().setIsAddEventOpen(true);
              }
            }}
            onDeleteEvent={(eventId) =>
              setDeleteConfirmation({ type: "event", id: eventId })
            }
          />
        ) : (
          <CalendarView
            tripId={tripId}
            trip={trip}
            hotels={hotels}
            eventsByDay={eventsByDay}
            onEventClick={(eventId) => {
              const event = eventsByDay
                .flatMap((d) => d.items)
                .find((i) => i.event.id === eventId)?.event;
              if (event) {
                useUIStore.getState().setEditingEvent(event);
                useUIStore.getState().setIsAddEventOpen(true);
              }
            }}
            onDeleteEvent={(eventId) =>
              setDeleteConfirmation({ type: "event", id: eventId })
            }
          />
        )}
      </main>

      {/* Add/Edit event dialog */}
      <AddEventDialog tripId={tripId} trip={trip} />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmation !== null}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title={
          deleteConfirmation?.type === "trip"
            ? "Delete Trip?"
            : "Delete Event?"
        }
        message={
          deleteConfirmation?.type === "trip"
            ? "This will delete the trip and all its events. This action cannot be undone."
            : "This will delete this event. This action cannot be undone."
        }
        confirmLabel={deleteConfirmation?.type === "trip" ? "Delete Trip" : "Delete Event"}
        onConfirm={
          deleteConfirmation?.type === "trip" ? handleDeleteTrip : async () => {
            // Event deletion handled in AddEventDialog
            setDeleteConfirmation(null);
          }
        }
        variant="danger"
      />
    </div>
  );
}
