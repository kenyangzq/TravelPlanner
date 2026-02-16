/**
 * TravelPlanner Web - Home Page (Trip List)
 *
 * Trip list page with create, view, and delete trips.
 * Port of iOS TripListView.swift.
 */

"use client";

import { useTrips } from "@/lib/hooks/useTrips";
import { useUIStore } from "@/lib/store";
import { TripList } from "@/components/trips/trip-list";
import { NewTripDialog } from "@/components/trips/new-trip-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { trips, deleteTrip } = useTrips();
  const router = useRouter();
  const {
    isNewTripDialogOpen,
    setIsNewTripDialogOpen,
    deleteConfirmation,
    setDeleteConfirmation,
  } = useUIStore();

  const handleDeleteTrip = async () => {
    if (deleteConfirmation?.type === "trip" && deleteConfirmation.id) {
      await deleteTrip(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#111921] pb-20">
      {/* Header */}
      <header className="h-16 sm:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 sticky-safe px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            My Trips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {trips.length} trip{trips.length !== 1 ? "s" : ""} planned
          </p>
        </div>
        <Button
          onClick={() => setIsNewTripDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span className="ml-1 sm:hidden">New</span>
          <span className="hidden sm:inline ml-2">Create New Trip</span>
        </Button>
      </header>

      {/* Trip list */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <TripList
          trips={trips}
          onSelectTrip={(tripId) => router.push(`/trips/${tripId}/`)}
          onDeleteTrip={(tripId) =>
            setDeleteConfirmation({ type: "trip", id: tripId })
          }
          onCreateTrip={() => setIsNewTripDialogOpen(true)}
        />
      </main>

      {/* New trip dialog */}
      <NewTripDialog
        open={isNewTripDialogOpen}
        onOpenChange={setIsNewTripDialogOpen}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmation !== null}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title="Delete Trip?"
        message="This will delete the trip and all its events. This action cannot be undone."
        confirmLabel="Delete Trip"
        onConfirm={handleDeleteTrip}
        variant="danger"
      />
    </div>
  );
}
