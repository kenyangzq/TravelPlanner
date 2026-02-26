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
import { searchFlight } from "@/lib/services/flightService";
import type { Trip, FlightEvent } from "@/lib/models";
import { Search, Loader2, AlertCircle, Plane, Clock, Edit3, Check } from "lucide-react";

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

  // Manual edit mode states
  const [manualEditMode, setManualEditMode] = useState(false);
  const [manualDepartureDate, setManualDepartureDate] = useState("");
  const [manualDepartureTime, setManualDepartureTime] = useState("");
  const [manualArrivalDate, setManualArrivalDate] = useState("");
  const [manualArrivalTime, setManualArrivalTime] = useState("");
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  const isEditing = existingEvent !== null;

  // Initialize manual edit values when fetched data changes
  React.useEffect(() => {
    if (fetchedData) {
      const departureDate = fetchedData.startDate ? new Date(fetchedData.startDate) : null;
      const arrivalDate = fetchedData.endDate ? new Date(fetchedData.endDate) : null;

      setManualDepartureDate(departureDate ? departureDate.toISOString().split("T")[0] : "");
      setManualDepartureTime(departureDate ? departureDate.toTimeString().slice(0, 5) : "");
      setManualArrivalDate(arrivalDate ? arrivalDate.toISOString().split("T")[0] : "");
      setManualArrivalTime(arrivalDate ? arrivalDate.toTimeString().slice(0, 5) : "");
      setHasManuallyEdited(false); // Reset edit flag when new data is fetched
    }
  }, [fetchedData]);

  // Mark as manually edited when any field changes
  const handleManualFieldChange = (field: string, value: string) => {
    setHasManuallyEdited(true);
    switch (field) {
      case "departureDate":
        setManualDepartureDate(value);
        break;
      case "departureTime":
        setManualDepartureTime(value);
        break;
      case "arrivalDate":
        setManualArrivalDate(value);
        break;
      case "arrivalTime":
        setManualArrivalTime(value);
        break;
    }
  };

  const handleSearch = async () => {
    if (!flightNumber.trim() || !date) {
      setError("Please enter a flight number and date");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await searchFlight({ number: flightNumber, date });
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

    // Apply manual date/time edits if user has made manual changes
    let dataToSave = { ...fetchedData };

    if (hasManuallyEdited) {
      // Parse manual departure date/time
      if (manualDepartureDate && manualDepartureTime) {
        const departureDateTime = new Date(`${manualDepartureDate}T${manualDepartureTime}`);
        dataToSave.startDate = departureDateTime.toISOString();
        dataToSave.scheduledDepartureTime = departureDateTime.toISOString();
      }

      // Parse manual arrival date/time
      if (manualArrivalDate && manualArrivalTime) {
        const arrivalDateTime = new Date(`${manualArrivalDate}T${manualArrivalTime}`);
        dataToSave.endDate = arrivalDateTime.toISOString();
        dataToSave.scheduledArrivalTime = arrivalDateTime.toISOString();
      }
    }

    try {
      if (isEditing && existingEvent) {
        await updateEvent(existingEvent.id, dataToSave);
      } else {
        await createEvent({
          ...dataToSave,
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {fetchedData.airlineName} {fetchedData.flightNumber}
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualEditMode(!manualEditMode)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {manualEditMode ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit Times
                </>
              )}
            </Button>
          </div>

          {/* Manual edit section */}
          {manualEditMode && (
            <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                <Clock className="w-4 h-4" />
                <span>Manually Edit Schedule</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Departure Date/Time */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Departure Date</Label>
                  <Input
                    type="date"
                    value={manualDepartureDate}
                    onChange={(e) => handleManualFieldChange("departureDate", e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Departure Time</Label>
                  <Input
                    type="time"
                    value={manualDepartureTime}
                    onChange={(e) => handleManualFieldChange("departureTime", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Arrival Date/Time */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Arrival Date</Label>
                  <Input
                    type="date"
                    value={manualArrivalDate}
                    onChange={(e) => handleManualFieldChange("arrivalDate", e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Arrival Time</Label>
                  <Input
                    type="time"
                    value={manualArrivalTime}
                    onChange={(e) => handleManualFieldChange("arrivalTime", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

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
