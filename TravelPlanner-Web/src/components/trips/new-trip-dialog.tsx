/**
 * TravelPlanner Web - New Trip Dialog
 *
 * Create new trip dialog.
 * Port of iOS NewTripView.swift.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useTrips } from "@/lib/hooks/useTrips";
import { useUIStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { formatCities } from "@/lib/models";

export function NewTripDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { createTrip } = useTrips();
  const router = useRouter();
  const { setIsNewTripDialogOpen } = useUIStore();

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDestination("");
    setCitiesInput("");
    setStartDate("");
    setEndDate("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse cities from comma-separated input
      const cities = citiesInput
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const tripId = await createTrip({
        name: name.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        citiesRaw: formatCities(cities),
      });

      resetForm();
      onOpenChange(false);

      // Navigate to the new trip
      router.push(`/trips/${tripId}`);
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set default dates to today and 7 days from now
  const setDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(nextWeek.toISOString().split("T")[0]);
  };

  React.useEffect(() => {
    if (open && !startDate && !endDate) {
      setDefaultDates();
    }
  }, [open, startDate, endDate]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trip-name">Trip Name</Label>
              <Input
                id="trip-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Vacation 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Paris, France"
              />
            </div>

            <div>
              <Label htmlFor="cities">Cities</Label>
              <Input
                id="cities"
                type="text"
                value={citiesInput}
                onChange={(e) => setCitiesInput(e.target.value)}
                placeholder="e.g., Paris, Lyon, Nice"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple cities with commas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !startDate || !endDate || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
