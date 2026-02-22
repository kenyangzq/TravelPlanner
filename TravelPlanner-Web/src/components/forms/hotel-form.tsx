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
import { Checkbox } from "../ui/checkbox";
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
  const [isAirbnb, setIsAirbnb] = useState(false);
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
    existingEvent?.hotelAddress || ""
  );
  const [locationData, setLocationData] = useState<{
    address: string;
    googlePlaceName?: string;
    googlePlaceId?: string;
    latitude?: number;
    longitude?: number;
  }>(
    existingEvent
      ? {
          address: existingEvent.hotelAddress,
          googlePlaceName: existingEvent.googlePlaceName,
          googlePlaceId: existingEvent.googlePlaceId,
          latitude: existingEvent.hotelLatitude,
          longitude: existingEvent.hotelLongitude,
        }
      : { address: "" }
  );

  const isEditing = existingEvent !== null;
  const hasCoordinates = locationData.latitude !== undefined && locationData.longitude !== undefined;

  const handleLocationSelected = (result: LocationResult) => {
    setLocationQuery(result.formatted_address);
    setLocationData({
      address: result.formatted_address,
      googlePlaceName: result.name, // Store official Google Places name
      googlePlaceId: result.place_id, // Store place_id for direct map links
      latitude: result.lat,
      longitude: result.lng,
    });
  };

  const handleSave = async () => {
    // For Airbnb, use the Google Place name or fallback to "Airbnb"
    const finalHotelName = isAirbnb
      ? (locationData.googlePlaceName || "Airbnb")
      : hotelName.trim();

    if (!finalHotelName || (!isAirbnb && !hotelName.trim())) {
      return;
    }

    // For Airbnb, require location to be set
    if (isAirbnb && !locationData.latitude) {
      return;
    }

    const startDateTime = `${checkInDate}T${checkInTime}`;
    const endDateTime = `${checkOutDate}T${checkOutTime}`;

    const eventData: Omit<HotelEvent, "id"> = {
      ...createDefaultHotelEvent(tripId, finalHotelName, startDateTime, endDateTime),
      hotelName: finalHotelName,
      googlePlaceName: locationData.googlePlaceName,
      googlePlaceId: locationData.googlePlaceId,
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
      <div className="flex items-center gap-2">
        <Checkbox
          id="is-airbnb"
          checked={isAirbnb}
          onChange={(e) => {
            setIsAirbnb(e.target.checked);
            // Reset hotel name when toggling Airbnb mode
            if (e.target.checked) {
              setHotelName("Airbnb");
            } else {
              setHotelName("");
            }
          }}
        />
        <Label htmlFor="is-airbnb" className="cursor-pointer">
          This is an Airbnb / vacation rental
        </Label>
      </div>

      {!isAirbnb && (
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
      )}

      {isAirbnb && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Enter the exact address below, then tap "Find" to confirm the location with Google Places.
          </p>
        </div>
      )}

      <LocationSearchSection
        query={locationQuery}
        onQueryChange={setLocationQuery}
        cities={trip.citiesRaw ? trip.citiesRaw.split("|||").filter(c => c) : []}
        onLocationSelected={handleLocationSelected}
        coordinateFields={locationData}
        placeholder={isAirbnb ? "e.g., 123 Main St, Tokyo, Japan" : "Search for a place..."}
        label={isAirbnb ? "Address *" : "Location"}
        isAddressMode={isAirbnb}
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
          disabled={
            !checkInDate || !checkOutDate ||
            (!isAirbnb && !hotelName.trim()) ||
            (isAirbnb && !locationData.latitude)
          }
          className="flex-1"
        >
          {isEditing ? "Update" : "Add"} {isAirbnb ? "Airbnb" : "Hotel"}
        </Button>
      </div>
    </div>
  );
};
