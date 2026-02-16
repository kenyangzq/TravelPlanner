/**
 * TravelPlanner Web - Hotel Form Component
 *
 * Form for creating/editing hotel events with location search.
 * Port of iOS HotelFormView.swift.
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LocationSearchSection } from "./location-search-section";
import { createDefaultHotelEvent } from "@/lib/db";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Trip, HotelEvent } from "@/lib/models";
import type { LocationResult } from "@/lib/services/locationService";
import { Building2, MapPin } from "lucide-react";
import { DateRangePicker } from "../ui/date-range-picker";

interface HotelFormProps {
  tripId: string;
  trip: Trip;
  existingEvent?: HotelEvent | null;
  onClose: () => void;
}

export const HotelForm: React.FC<HotelFormProps> = ({
  tripId,
  trip,
  existingEvent,
  onClose,
}) => {
  const { createEvent, updateEvent } = useEvents(tripId);
  const [hotelName, setHotelName] = useState(existingEvent?.hotelName || "");
  const [checkInDate, setCheckInDate] = useState(
    existingEvent?.checkInDate ? existingEvent.checkInDate.split("T")[0] : trip.startDate
  );
  const [checkInTime, setCheckInTime] = useState(
    existingEvent?.checkInDate ? existingEvent.checkInDate.split("T")[1]?.slice(0, 5) || "15:00" : "15:00"
  );
  const [checkOutDate, setCheckOutDate] = useState(
    existingEvent?.checkOutDate ? existingEvent.checkOutDate.split("T")[0] : trip.endDate
  );
  const [checkOutTime, setCheckOutTime] = useState(
    existingEvent?.checkOutDate ? existingEvent.checkOutDate.split("T")[1]?.slice(0, 5) || "11:00" : "11:00"
  );
  const [locationQuery, setLocationQuery] = useState(
    existingEvent?.hotelName || existingEvent?.hotelAddress || ""
  );
  const [locationData, setLocationData] = useState<{
    address: string;
    latitude?: number;
    longitude?: number;
  }>(
    existingEvent
      ? {
          address: existingEvent.hotelAddress,
          latitude: existingEvent.hotelLatitude,
          longitude: existingEvent.hotelLongitude,
        }
      : { address: "" }
  );

  const isEditing = existingEvent !== null;
  const hasCoordinates = locationData.latitude !== undefined && locationData.longitude !== undefined;

  const handleLocationSelected = (result: LocationResult) => {
    setLocationQuery(result.display_name);
    setLocationData({
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  const handleSave = async () => {
    if (!hotelName.trim()) {
      return;
    }

    const startDateTime = `${checkInDate}T${checkInTime}`;
    const endDateTime = `${checkOutDate}T${checkOutTime}`;

    const eventData: Omit<HotelEvent, "id"> = {
      ...createDefaultHotelEvent(tripId, hotelName.trim(), startDateTime, endDateTime),
      hotelName: hotelName.trim(),
      checkInDate: startDateTime,
      checkOutDate: endDateTime,
      hotelAddress: locationData.address,
      confirmationNumber: "",
      hotelLatitude: locationData.latitude,
      hotelLongitude: locationData.longitude,
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
      console.error("Failed to save hotel:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hotel-name">Hotel Name *</Label>
        <Input
          id="hotel-name"
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          placeholder="e.g., Grand Hyatt Tokyo"
          required
        />
      </div>

      <LocationSearchSection
        query={locationQuery}
        onQueryChange={setLocationQuery}
        cities={trip.citiesRaw ? trip.citiesRaw.split("|||").filter(c => c) : []}
        onLocationSelected={handleLocationSelected}
        coordinateFields={locationData}
      />

      <div>
        <Label>Stay Dates *</Label>
        <DateRangePicker
          startDate={checkInDate}
          endDate={checkOutDate}
          onRangeChange={(start, end) => {
            setCheckInDate(start);
            if (end) setCheckOutDate(end);
          }}
          minDate={trip.startDate}
          maxDate={trip.endDate}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check-in-time">Check-in Time</Label>
          <Input
            id="check-in-time"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="check-out-time">Check-out Time</Label>
          <Input
            id="check-out-time"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hotelName.trim() || !checkInDate || !checkOutDate}
          className="flex-1"
        >
          {isEditing ? "Update" : "Add"} Hotel
        </Button>
      </div>
    </div>
  );
};
