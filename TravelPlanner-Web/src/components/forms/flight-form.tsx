/**
 * TravelPlanner Web - Flight Form Component
 *
 * Form for creating/editing flight events with flight API search.
 * Port of iOS FlightFormView.swift.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FlightStatusBadge } from "../ui/badge";
import {
  createDefaultFlightEvent,
  dbHelpers,
} from "@/lib/db";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Trip, FlightEvent } from "@/lib/models";
import { Search, Loader2, AlertCircle, Plane } from "lucide-react";

interface FlightFormProps {
  tripId: string;
  trip: Trip;
  existingEvent?: FlightEvent | null;
  onClose: () => void;
}

export const FlightForm: React.FC<FlightFormProps> = ({
  tripId,
  trip,
  existingEvent,
  onClose,
}) => {
  const { createEvent, updateEvent } = useEvents(tripId);
  const [flightNumber, setFlightNumber] = useState(existingEvent?.flightNumber || "");
  const [date, setDate] = useState(
    existingEvent?.startDate ? existingEvent.startDate.split("T")[0] : trip.startDate
  );
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<FlightEvent | null>(existingEvent || null);

  const isEditing = existingEvent !== null;

  const handleSearch = async () => {
    if (!flightNumber.trim() || !date) {
      setError("Please enter a flight number and date");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Call Next.js API route to search flight
      const response = await fetch(`/api/flights?number=${encodeURIComponent(flightNumber)}&date=${date}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search flight");
      }

      setFetchedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search flight");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!fetchedData) {
      setError("Please search for a flight first");
      return;
    }

    try {
      if (isEditing && existingEvent) {
        await updateEvent(existingEvent.id, fetchedData);
      } else {
        await createEvent({
          ...fetchedData,
          tripId,
        });
      }
      onClose();
    } catch (err) {
      setError("Failed to save flight");
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search section */}
      <div>
        <Label htmlFor="flight-number">Flight Number</Label>
        <Input
          id="flight-number"
          type="text"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
          placeholder="e.g., UA1234"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
      </div>

      <div>
        <Label htmlFor="flight-date">Date</Label>
        <Input
          id="flight-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={trip.startDate}
          max={trip.endDate}
        />
      </div>

      <Button
        type="button"
        onClick={handleSearch}
        disabled={!flightNumber.trim() || !date || isSearching}
        className="w-full"
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Search className="w-4 h-4 mr-2" />
        )}
        Search Flight
      </Button>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Results section */}
      {fetchedData && (
        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {fetchedData.airlineName} {fetchedData.flightNumber}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Departure</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {fetchedData.departureAirportIATA}
              </p>
              <p className="text-xs text-gray-500">{fetchedData.departureAirportName}</p>
              {fetchedData.departureTerminal && (
                <p className="text-xs text-gray-500">Terminal {fetchedData.departureTerminal}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Arrival</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {fetchedData.arrivalAirportIATA}
              </p>
              <p className="text-xs text-gray-500">{fetchedData.arrivalAirportName}</p>
              {fetchedData.arrivalTerminal && (
                <p className="text-xs text-gray-500">Terminal {fetchedData.arrivalTerminal}</p>
              )}
            </div>
          </div>

          {fetchedData.flightStatus && (
            <div className="mt-2">
              <FlightStatusBadge status={fetchedData.flightStatus} />
            </div>
          )}

          <Button type="button" onClick={handleSave} className="w-full mt-2">
            {isEditing ? "Update Flight" : "Add Flight"}
          </Button>
        </div>
      )}
    </div>
  );
};
