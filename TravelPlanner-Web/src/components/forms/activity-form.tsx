/**
 * TravelPlanner Web - Activity Form Component
 *
 * Form for creating/editing activity events with location search and duration picker.
 * Port of iOS ActivityFormView.swift.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LocationSearchSection } from "./location-search-section";
import { DurationPicker } from "../ui/duration-picker";
import { createDefaultActivityEvent } from "@/lib/db";
import { useEvents } from "@/lib/hooks/useEvents";
import type { Trip, ActivityEvent } from "@/lib/models";
import type { LocationResult } from "@/lib/services/locationService";
import { Star } from "lucide-react";

interface ActivityFormProps {
  tripId: string;
  trip: Trip;
  existingEvent?: ActivityEvent | null;
  onClose: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  tripId,
  trip,
  existingEvent,
  onClose,
}) => {
  const { createEvent, updateEvent } = useEvents(tripId);
  const [title, setTitle] = useState(existingEvent?.title || "");
  const [date, setDate] = useState(
    existingEvent?.startDate ? existingEvent.startDate.split("T")[0] : trip.startDate
  );
  const [time, setTime] = useState(
    existingEvent?.startDate ? existingEvent.startDate.split("T")[1]?.slice(0, 5) || "10:00" : "10:00"
  );
  const [duration, setDuration] = useState(
    existingEvent
      ? Math.floor((new Date(existingEvent.endDate).getTime() - new Date(existingEvent.startDate).getTime()) / 60000)
      : 120
  );
  const [description, setDescription] = useState(existingEvent?.activityDescription || "");
  const [locationQuery, setLocationQuery] = useState(
    existingEvent?.activityLocationName || ""
  );
  const [locationData, setLocationData] = useState<{
    locationName: string;
    googlePlaceName?: string;
    googlePlaceId?: string;
    latitude?: number;
    longitude?: number;
  }>(
    existingEvent
      ? {
          locationName: existingEvent.activityLocationName,
          googlePlaceName: existingEvent.googlePlaceName,
          googlePlaceId: existingEvent.googlePlaceId,
          latitude: existingEvent.activityLatitude,
          longitude: existingEvent.activityLongitude,
        }
      : { locationName: "" }
  );

  const isEditing = existingEvent !== null;

  const handleLocationSelected = (result: LocationResult) => {
    const shortName = result.name || result.formatted_address.split(",")[0];
    setLocationQuery(shortName);
    setLocationData({
      locationName: shortName,
      googlePlaceName: result.name, // Store official Google Places name
      googlePlaceId: result.place_id, // Store place_id for direct map links
      latitude: result.lat,
      longitude: result.lng,
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    const startDateTime = `${date}T${time}`;
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const eventData: Omit<ActivityEvent, "id"> = {
      ...createDefaultActivityEvent(tripId, title.trim(), startDateTime, endDate.toISOString()),
      title: title.trim(),
      activityLocationName: locationData.locationName,
      googlePlaceName: locationData.googlePlaceName,
      googlePlaceId: locationData.googlePlaceId,
      activityDescription: description.trim(),
      activityLatitude: locationData.latitude,
      activityLongitude: locationData.longitude,
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
      console.error("Failed to save activity:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="activity-title">Activity Title *</Label>
        <Input
          id="activity-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Visit Louvre Museum"
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
          <Label htmlFor="activity-date">Date *</Label>
          <Input
            id="activity-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={trip.startDate}
            max={trip.endDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="activity-time">Start Time *</Label>
          <Input
            id="activity-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="activity-duration">Duration</Label>
        <DurationPicker value={duration} onChange={setDuration} />
      </div>

      <div>
        <Label htmlFor="activity-description">Description</Label>
        <Input
          id="activity-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || !date || !time}
          className="flex-1"
        >
          {isEditing ? "Update" : "Add"} Activity
        </Button>
      </div>
    </div>
  );
};
