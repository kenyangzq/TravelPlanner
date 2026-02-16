/**
 * TravelPlanner Web - Trip Detail Client Component
 *
 * Client-side interactivity for itinerary view.
 */

"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useEventsByDay, useTripHotels } from "@/lib/hooks/useTripDetail";
import { useTrips } from "@/lib/hooks/useTrips";
import { useUIStore } from "@/lib/store";
import { ListView } from "@/components/itinerary/list-view";
import { CalendarView } from "@/components/itinerary/calendar-view";
import { TripMapView } from "@/components/itinerary/trip-map-view";
import { AddEventDialog } from "@/components/forms/add-event-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, MapPin, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { downloadICS } from "@/lib/utils/calendarExport";
import { useEvents } from "@/lib/hooks/useEvents";
import { getTripImageUrl, getTripImageUrlAsync } from "@/lib/services/imageService";

interface TripDetailClientProps {
  tripId: string;
}

// Generate gradient color based on trip name for image placeholder
const getGradientColor = (name: string) => {
  const gradients = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-emerald-400 to-emerald-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-cyan-400 to-cyan-600",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

// City image banner component for trip detail page
const TripImageBanner: React.FC<{ citiesRaw: string; tripName: string }> = ({ citiesRaw, tripName }) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const fallbackUrl = getTripImageUrl(citiesRaw);
    setImageSrc(fallbackUrl);

    getTripImageUrlAsync(citiesRaw)
      .then((url) => {
        setImageSrc(url);
      })
      .catch((error) => {
        console.error("Failed to load city image:", error);
      });
  }, [citiesRaw]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const gradientColor = getGradientColor(tripName);

  return (
    <div className="relative h-[25vh] min-h-[180px] max-h-[300px] overflow-hidden">
      {isLoading && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} transition-opacity duration-300`} />
      )}
      <img
        key={imageSrc}
        src={imageSrc}
        alt={tripName}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f6f7f8] dark:from-[#111921] via-transparent to-transparent" />
    </div>
  );
};

export function TripDetailClient({ tripId: propTripId }: TripDetailClientProps) {
  // In production static export, the server param is always '_' due to SWA rewrite.
  // Read the real tripId from the URL path on the client.
  const [tripId, setTripId] = useState(propTripId);
  useEffect(() => {
    const segments = window.location.pathname.split("/").filter(Boolean);
    // URL: /trips/{tripId}/ → segments = ["trips", "{tripId}"]
    if (segments.length >= 2 && segments[0] === "trips") {
      setTripId(segments[1]);
    }
  }, []);
  const router = useRouter();
  const { trips, deleteTrip } = useTrips();
  const { isAddEventOpen, setIsAddEventOpen, deleteConfirmation, setDeleteConfirmation } =
    useUIStore();

  const trip = trips.find((t) => t.id === tripId);
  const eventsByDay = useEventsByDay(tripId);
  const hotels = useTripHotels(tripId);
  const { events } = useEvents(tripId);

  const handleExportCalendar = () => {
    if (trip) {
      downloadICS(trip, events);
    }
  };

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
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#111921] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-primary p-2 rounded-lg flex-shrink-0 hidden sm:flex">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {trip.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {format(parseISO(trip.startDate), "MMM d")} — {format(parseISO(trip.endDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export calendar button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCalendar}
            className="text-primary hover:bg-primary/5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              useUIStore.getState().setSelectedEventType(null);
              setIsAddEventOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-1 sm:hidden">Add</span>
            <span className="hidden sm:inline ml-1">Add Event</span>
          </Button>
        </div>
      </header>

      {/* City Image Banner */}
      <TripImageBanner citiesRaw={trip.citiesRaw} tripName={trip.name} />

      {/* View mode toggle */}
      <div className="sticky top-[52px] sm:top-[68px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-primary/10 px-3 sm:px-6 py-2 -mt-px">
        <div className="max-w-3xl mx-auto flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          <button
            onClick={() => useUIStore.getState().setItineraryViewMode("list")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              useUIStore.getState().itineraryViewMode === "list"
                ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => useUIStore.getState().setItineraryViewMode("calendar")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              useUIStore.getState().itineraryViewMode === "calendar"
                ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => useUIStore.getState().setItineraryViewMode("map")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              useUIStore.getState().itineraryViewMode === "map"
                ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
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
        ) : useUIStore.getState().itineraryViewMode === "calendar" ? (
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
        ) : (
          <TripMapView trip={trip} events={events} hotels={hotels} />
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
