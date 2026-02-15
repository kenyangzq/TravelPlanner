/**
 * TravelPlanner Web - Car Rental Form Component
 *
 * Form for creating/editing car rental events with pickup/return locations.
 * Port of iOS CarRentalFormView.swift.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LocationSearchSection } from "./location-search-section";
import { createDefaultCarRentalEvent } from "@/lib/db";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Trip, CarRentalEvent } from "@/lib/models";
import type { LocationResult } from "@/lib/services/locationService";
import { Car } from "lucide-react";

interface CarRentalFormProps {
  tripId: string;
  trip: Trip;
  existingEvent?: CarRentalEvent | null;
  onClose: () => void;
}

export const CarRentalForm: React.FC<CarRentalFormProps> = ({
  tripId,
  trip,
  existingEvent,
  onClose,
}) => {
  const { createEvent, updateEvent } = useEvents(tripId);
  const [rentalCompany, setRentalCompany] = useState(existingEvent?.rentalCompany || "");
  const [pickupDate, setPickupDate] = useState(
    existingEvent?.pickupDate ? existingEvent.pickupDate.split("T")[0] : trip.startDate
  );
  const [pickupTime, setPickupTime] = useState(
    existingEvent?.pickupDate ? existingEvent.pickupDate.split("T")[1]?.slice(0, 5) || "10:00" : "10:00"
  );
  const [returnDate, setReturnDate] = useState(
    existingEvent?.returnDate ? existingEvent.returnDate.split("T")[0] : trip.endDate
  );
  const [returnTime, setReturnTime] = useState(
    existingEvent?.returnDate ? existingEvent.returnDate.split("T")[1]?.slice(0, 5) || "10:00" : "10:00"
  );
  const [pickupLocationQuery, setPickupLocationQuery] = useState(
    existingEvent?.pickupLocationName || existingEvent?.pickupAirportCode || ""
  );
  const [pickupLocationData, setPickupLocationData] = useState<{
    locationName: string;
    latitude?: number;
    longitude?: number;
  }>(
    existingEvent
      ? {
          locationName: existingEvent.pickupLocationName || existingEvent.pickupAirportCode,
          latitude: existingEvent.pickupLatitude,
          longitude: existingEvent.pickupLongitude,
        }
      : { locationName: "" }
  );
  const [returnLocationQuery, setReturnLocationQuery] = useState(
    existingEvent?.returnLocationName || existingEvent?.returnAirportCode || ""
  );
  const [returnLocationData, setReturnLocationData] = useState<{
    locationName: string;
    latitude?: number;
    longitude?: number;
  }>(
    existingEvent
      ? {
          locationName: existingEvent.returnLocationName || existingEvent.returnAirportCode,
          latitude: existingEvent.returnLatitude,
          longitude: existingEvent.returnLongitude,
        }
      : { locationName: "" }
  );
  const [confirmationNumber, setConfirmationNumber] = useState(
    existingEvent?.confirmationNumber || ""
  );

  const isEditing = existingEvent !== null;

  const handlePickupLocationSelected = (result: LocationResult) => {
    const shortName = result.address.name || result.display_name.split(",")[0];
    setPickupLocationQuery(shortName);
    setPickupLocationData({
      locationName: shortName,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  const handleReturnLocationSelected = (result: LocationResult) => {
    const shortName = result.address.name || result.display_name.split(",")[0];
    setReturnLocationQuery(shortName);
    setReturnLocationData({
      locationName: shortName,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  const handleSave = async () => {
    if (!rentalCompany.trim()) {
      return;
    }

    const startDateTime = `${pickupDate}T${pickupTime}`;
    const endDateTime = `${returnDate}T${returnTime}`;

    const eventData: Omit<CarRentalEvent, "id"> = {
      ...createDefaultCarRentalEvent(tripId, startDateTime, endDateTime),
      rentalCompany: rentalCompany.trim(),
      pickupDate: startDateTime,
      returnDate: endDateTime,
      pickupLocationName: pickupLocationData.locationName,
      pickupLatitude: pickupLocationData.latitude,
      pickupLongitude: pickupLocationData.longitude,
      returnLocationName: returnLocationData.locationName,
      returnLatitude: returnLocationData.latitude,
      returnLongitude: returnLocationData.longitude,
      confirmationNumber: confirmationNumber.trim(),
    };

    try {
      if (isEditing && existingEvent) {
        await updateEvent(existingEvent.id, eventData);
      } else {
        await createEvent({
          ...eventData,
          tripId,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save car rental:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rental-company">Rental Company *</Label>
        <Input
          id="rental-company"
          type="text"
          value={rentalCompany}
          onChange={(e) => setRentalCompany(e.target.value)}
          placeholder="e.g., Hertz, Avis"
          required
        />
      </div>

      <div>
        <Label>Pickup Location</Label>
        <LocationSearchSection
          query={pickupLocationQuery}
          onQueryChange={setPickupLocationQuery}
          cities={trip.citiesRaw ? trip.citiesRaw.split("|||").filter(c => c) : []}
          onLocationSelected={handlePickupLocationSelected}
          coordinateFields={pickupLocationData}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pickup-date">Pickup Date *</Label>
          <Input
            id="pickup-date"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            min={trip.startDate}
            max={trip.endDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="pickup-time">Pickup Time</Label>
          <Input
            id="pickup-time"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Return Location</Label>
        <LocationSearchSection
          query={returnLocationQuery}
          onQueryChange={setReturnLocationQuery}
          cities={trip.citiesRaw ? trip.citiesRaw.split("|||").filter(c => c) : []}
          onLocationSelected={handleReturnLocationSelected}
          coordinateFields={returnLocationData}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="return-date">Return Date *</Label>
          <Input
            id="return-date"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={pickupDate}
            max={trip.endDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="return-time">Return Time</Label>
          <Input
            id="return-time"
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="confirmation-number">Confirmation Number</Label>
        <Input
          id="confirmation-number"
          type="text"
          value={confirmationNumber}
          onChange={(e) => setConfirmationNumber(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!rentalCompany.trim() || !pickupDate || !returnDate}
          className="flex-1"
        >
          {isEditing ? "Update" : "Add"} Car Rental
        </Button>
      </div>
    </div>
  );
};
