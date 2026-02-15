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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              TravelPlanner
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsNewTripDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Trip
          </Button>
        </div>
      </header>

      {/* Trip list */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <TripList
          trips={trips}
          onSelectTrip={(tripId) => router.push(`/trips/${tripId}`)}
          onDeleteTrip={(tripId) =>
            setDeleteConfirmation({ type: "trip", id: tripId })
          }
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
