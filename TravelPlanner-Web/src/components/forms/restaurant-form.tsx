/**
 * TravelPlanner Web - Restaurant Form Component
 *
 * Form for creating/editing restaurant events with location search and duration picker.
 * Port of iOS RestaurantFormView.swift.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LocationSearchSection } from "./location-search-section";
import { DurationPicker } from "../ui/duration-picker";
import { createDefaultRestaurantEvent } from "@/lib/db";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Trip, RestaurantEvent } from "@/lib/models";
import type { LocationResult } from "@/lib/services/locationService";
import { Utensils } from "lucide-react";

interface RestaurantFormProps {
  tripId: string;
  trip: Trip;
  existingEvent?: RestaurantEvent | null;
  onClose: () => void;
}

export const RestaurantForm: React.FC<RestaurantFormProps> = ({
  tripId,
  trip,
  existingEvent,
  onClose,
}) => {
  const { createEvent, updateEvent } = useEvents(tripId);
  const [restaurantName, setRestaurantName] = useState(existingEvent?.restaurantName || "");
  const [date, setDate] = useState(
    existingEvent?.reservationTime ? existingEvent.reservationTime.split("T")[0] : trip.startDate
  );
  const [time, setTime] = useState(
    existingEvent?.reservationTime ? existingEvent.reservationTime.split("T")[1]?.slice(0, 5) || "19:00" : "19:00"
  );
  const [duration, setDuration] = useState(
    existingEvent
      ? Math.floor((new Date(existingEvent.endDate).getTime() - new Date(existingEvent.startDate).getTime()) / 60000)
      : 90
  );
  const [partySize, setPartySize] = useState(existingEvent?.partySize || 2);
  const [locationQuery, setLocationQuery] = useState(
    existingEvent?.restaurantName || existingEvent?.restaurantAddress || ""
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
          address: existingEvent.restaurantAddress,
          googlePlaceName: existingEvent.googlePlaceName,
          googlePlaceId: existingEvent.googlePlaceId,
          latitude: existingEvent.restaurantLatitude,
          longitude: existingEvent.restaurantLongitude,
        }
      : { address: "" }
  );

  const isEditing = existingEvent !== null;

  const handleLocationSelected = (result: LocationResult) => {
    setLocationQuery(result.name);
    setLocationData({
      address: result.formatted_address,
      googlePlaceName: result.name, // Store official Google Places name
      googlePlaceId: result.place_id, // Store place_id for direct map links
      latitude: result.lat,
      longitude: result.lng,
    });
  };

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      return;
    }

    const startDateTime = `${date}T${time}`;
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const eventData: Omit<RestaurantEvent, "id"> = {
      ...createDefaultRestaurantEvent(
        tripId,
        restaurantName.trim(),
        startDateTime,
        endDate.toISOString()
      ),
      restaurantName: restaurantName.trim(),
      googlePlaceName: locationData.googlePlaceName,
      googlePlaceId: locationData.googlePlaceId,
      cuisineType: "",
      reservationTime: startDateTime,
      partySize,
      restaurantAddress: locationData.address,
      confirmationNumber: "",
      restaurantLatitude: locationData.latitude,
      restaurantLongitude: locationData.longitude,
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
      console.error("Failed to save restaurant:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="restaurant-name">Restaurant Name *</Label>
        <Input
          id="restaurant-name"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="e.g., Sukiyabashi Jiro"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reservation-date">Date *</Label>
          <Input
            id="reservation-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={trip.startDate}
            max={trip.endDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="reservation-time">Time *</Label>
          <Input
            id="reservation-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="party-size">Party Size</Label>
          <Input
            id="party-size"
            type="number"
            min="1"
            max="100"
            value={partySize}
            onChange={(e) => setPartySize(parseInt(e.target.value) || 2)}
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <DurationPicker
            value={duration}
            onChange={setDuration}
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
          disabled={!restaurantName.trim() || !date || !time}
          className="flex-1"
        >
          {isEditing ? "Update" : "Add"} Restaurant
        </Button>
      </div>
    </div>
  );
};
