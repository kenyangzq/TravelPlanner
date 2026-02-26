/**
 * TravelPlanner Web - Import Places Dialog
 *
 * Dialog for importing a list of places from Google Maps URLs or coordinate/name text.
 * Supports importing as activity events or saved places.
 */

"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Upload,
  Link,
  List,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Calendar,
  ExternalLink,
  Info,
} from "lucide-react";
import type { Trip } from "@/lib/models";
import { parseCities } from "@/lib/models";
import {
  parseGoogleMapsUrl,
  parseCoordinateText,
  detectGoogleMapsUrlType,
  geocodeLocations,
  importAsActivities,
  importAsSavedPlaces,
  type ParsedLocation,
} from "@/lib/services/importService";

interface ImportPlacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  trip: Trip;
}

type InputMode = "url" | "text";
type ImportMode = "activities" | "savedPlaces";

export const ImportPlacesDialog: React.FC<ImportPlacesDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  trip,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [importMode, setImportMode] = useState<ImportMode>("activities");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [parsedLocations, setParsedLocations] = useState<ParsedLocation[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  // Activity-specific options
  const [activityDate, setActivityDate] = useState(trip.startDate);
  const [activityStartTime, setActivityStartTime] = useState("10:00");
  const [activityDuration, setActivityDuration] = useState(60);

  // Track detected list URL for "Open in Maps" flow
  const [listUrl, setListUrl] = useState<string | null>(null);

  const cities = parseCities(trip.citiesRaw);

  const handleParse = async () => {
    setIsParsing(true);
    setImportResult(null);
    setListUrl(null);

    try {
      let locations: ParsedLocation[];

      if (inputMode === "url") {
        // Support multiple URLs (one per line)
        const urls = urlInput
          .split("\n")
          .map((u) => u.trim())
          .filter((u) => u.length > 0);

        // Check if any URL is a list or shortened URL
        for (const url of urls) {
          const urlType = detectGoogleMapsUrlType(url);
          if (urlType === "list" || urlType === "shortened" || urlType === "other") {
            setListUrl(url);
            setIsParsing(false);
            return;
          }
        }

        locations = [];
        for (const url of urls) {
          const parsed = parseGoogleMapsUrl(url);
          locations.push(...parsed);
        }
      } else {
        locations = parseCoordinateText(textInput);
      }

      if (locations.length === 0) {
        setParsedLocations([]);
        setIsParsing(false);
        return;
      }

      // Geocode locations that don't have coordinates
      const geocoded = await geocodeLocations(locations, cities);
      setParsedLocations(geocoded);
    } catch (error) {
      console.error("Parse error:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const geocodedLocations = parsedLocations.filter((l) => l.isGeocoded);
    if (geocodedLocations.length === 0) return;

    setIsImporting(true);
    try {
      let count: number;
      if (importMode === "activities") {
        count = await importAsActivities(
          geocodedLocations,
          tripId,
          activityDate,
          activityStartTime,
          activityDuration
        );
      } else {
        count = await importAsSavedPlaces(geocodedLocations, tripId);
      }

      const failed = geocodedLocations.length - count;
      setImportResult({ success: count, failed });

      // Auto-close after brief delay on success
      if (count > 0) {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setUrlInput("");
    setTextInput("");
    setParsedLocations([]);
    setImportResult(null);
    setListUrl(null);
    setIsParsing(false);
    setIsImporting(false);
    onOpenChange(false);
  };

  const handleSwitchToText = () => {
    setListUrl(null);
    setInputMode("text");
    setParsedLocations([]);
  };

  const geocodedCount = parsedLocations.filter((l) => l.isGeocoded).length;
  const failedCount = parsedLocations.filter((l) => !l.isGeocoded).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>Import Places</DialogTitle>
        <DialogClose onClick={handleClose} />
      </DialogHeader>

      <div className="p-4 space-y-4">
        {/* Input mode tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => { setInputMode("url"); setParsedLocations([]); setImportResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              inputMode === "url"
                ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
            }`}
          >
            <Link className="w-4 h-4" />
            Google Maps URL
          </button>
          <button
            onClick={() => { setInputMode("text"); setParsedLocations([]); setImportResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              inputMode === "text"
                ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm"
                : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"
            }`}
          >
            <List className="w-4 h-4" />
            Text / Coords
          </button>
        </div>

        {/* Input area */}
        {inputMode === "url" ? (
          <div>
            <Label htmlFor="import-url">Google Maps Direction URL(s)</Label>
            <textarea
              id="import-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={"https://www.google.com/maps/dir/Tokyo+Station/Shibuya/Senso-ji/@35.7,139.7,12z"}
              className="w-full h-24 px-3 py-2 mt-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste Google Maps direction URLs or shared list links (one per line)
            </p>
          </div>
        ) : (
          <div>
            <Label htmlFor="import-text">Place Names or Coordinates</Label>
            <textarea
              id="import-text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={"Tokyo Tower\nSenso-ji Temple · Temple\nCafe Du Monde · Coffee shop\n35.6762, 139.6503\nMeiji Shrine, 35.6764, 139.6993"}
              className="w-full h-24 px-3 py-2 mt-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              One place per line. Supports: place names, &quot;Name · Category&quot; (from Google Maps lists), coordinates, or &quot;Name, lat, lng&quot;
            </p>
          </div>
        )}

        {/* Parse button */}
        <Button
          onClick={handleParse}
          disabled={isParsing || (inputMode === "url" ? !urlInput.trim() : !textInput.trim())}
          className="w-full"
          variant="secondary"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Parsing & Geocoding...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Parse Locations
            </>
          )}
        </Button>

        {/* List URL detected - show instructions */}
        {listUrl && (
          <div className="space-y-3 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Google Maps list detected</p>
                <p className="mt-1 text-blue-600 dark:text-blue-400">
                  List URLs can&apos;t be parsed automatically. To import these places:
                </p>
                <ol className="mt-1 ml-4 list-decimal space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>Open the list in Google Maps</li>
                  <li>Copy the place names from the list</li>
                  <li>Paste them in the &quot;Text / Coords&quot; tab</li>
                </ol>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={listUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </a>
              <button
                onClick={handleSwitchToText}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                <List className="w-4 h-4" />
                Paste Place Names
              </button>
            </div>
          </div>
        )}

        {/* Parsed locations preview */}
        {parsedLocations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                Found {parsedLocations.length} location{parsedLocations.length !== 1 ? "s" : ""}
              </Label>
              {failedCount > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {failedCount} could not be geocoded
                </span>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2 bg-slate-50 dark:bg-slate-800/50">
              {parsedLocations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded"
                >
                  {loc.isGeocoded ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`truncate ${loc.isGeocoded ? "text-gray-900 dark:text-gray-100" : "text-gray-400 line-through"}`}>
                    {loc.googlePlaceName || loc.name}
                  </span>
                  {loc.address && loc.googlePlaceName && (
                    <span className="text-xs text-gray-400 truncate hidden sm:inline">
                      {loc.address}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import mode selection */}
        {parsedLocations.length > 0 && geocodedCount > 0 && !importResult && (
          <>
            <div>
              <Label>Import as</Label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setImportMode("activities")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all ${
                    importMode === "activities"
                      ? "border-primary bg-primary/5 text-primary dark:bg-primary/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Activities
                </button>
                <button
                  onClick={() => setImportMode("savedPlaces")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all ${
                    importMode === "savedPlaces"
                      ? "border-primary bg-primary/5 text-primary dark:bg-primary/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Saved Places
                </button>
              </div>
            </div>

            {/* Activity options */}
            {importMode === "activities" && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="import-date">Date</Label>
                  <Input
                    id="import-date"
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    min={trip.startDate}
                    max={trip.endDate}
                  />
                </div>
                <div>
                  <Label htmlFor="import-time">Start Time</Label>
                  <Input
                    id="import-time"
                    type="time"
                    value={activityStartTime}
                    onChange={(e) => setActivityStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="import-duration">Each (min)</Label>
                  <Input
                    id="import-duration"
                    type="number"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(parseInt(e.target.value) || 60)}
                    min={15}
                    step={15}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Import result */}
        {importResult && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">
              Imported {importResult.success} place{importResult.success !== 1 ? "s" : ""} successfully
              {importResult.failed > 0 && ` (${importResult.failed} failed)`}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      {parsedLocations.length > 0 && geocodedCount > 0 && !importResult && (
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || geocodedCount === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {geocodedCount} Place{geocodedCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
};
