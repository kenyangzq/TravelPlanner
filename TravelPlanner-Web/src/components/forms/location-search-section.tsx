/**
 * TravelPlanner Web - Location Search Section Component
 *
 * Reusable location search for event forms.
 * Port of iOS EventFormViewModel.swift location search logic.
 */

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  searchPlaces,
  buildFormattedAddress,
  extractShortName,
  type LocationResult,
} from "@/lib/services/locationService";
import { MapPin, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface LocationSearchSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  cities: string[];
  onLocationSelected: (result: LocationResult) => void;
  coordinateFields?: { latitude?: number; longitude?: number };
  className?: string;
  placeholder?: string;
  label?: string;
}

export const LocationSearchSection: React.FC<LocationSearchSectionProps> = ({
  query,
  onQueryChange,
  cities,
  onLocationSelected,
  coordinateFields,
  className,
  placeholder = "Search for a place...",
  label = "Location",
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCoordinates =
    coordinateFields &&
    coordinateFields.latitude !== undefined &&
    coordinateFields.longitude !== undefined;

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      console.log("Searching for:", query, "in cities:", cities);
      const results = await searchPlaces(query, cities);

      console.log("Search results:", results);

      if (results.length === 0) {
        setError("No results found. Try a different search term or search on Google Maps.");
      } else if (results.length === 1) {
        // Auto-select if only one result
        onLocationSelected(results[0]);
        setSearchResults(null);
      } else {
        // Show dropdown if multiple results
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(`Failed to search: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: LocationResult) => {
    onLocationSelected(result);
    setSearchResults(null);
  };

  const clearSearch = () => {
    setSearchResults(null);
    setError(null);
  };

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    // Clear search state when query changes
    if (searchResults || error) {
      clearSearch();
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="location-search">{label}</Label>
          <Input
            id="location-search"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="mb-[1px]"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Find
          </Button>
        </div>
      </div>

      {hasCoordinates && (
        <div className="mt-2">
          <Badge variant="success" className="text-xs">
            Location set
          </Badge>
        </div>
      )}

      {/* Search results dropdown */}
      {searchResults && searchResults.length > 0 && (
        <div className="mt-2 border rounded-md bg-white dark:bg-gray-900 shadow-lg max-h-60 overflow-auto">
          <div className="p-2 text-xs text-gray-500 border-b">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
          </div>
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-b last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {extractShortName(result)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {buildFormattedAddress(result.address)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message with Google Maps fallback */}
      {error && (
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Search on Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Google attribution */}
      <div className="mt-2 text-xs text-gray-400">
        Powered by Google Places
      </div>
    </div>
  );
};
