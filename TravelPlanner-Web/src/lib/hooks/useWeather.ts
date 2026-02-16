/**
 * TravelPlanner Web - useWeather Hook
 *
 * Fetches daily weather data for a trip's first city.
 * Only fetches for dates within the 10-day forecast window.
 */

import { useState, useEffect } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { geocodeCity } from "../services/googlePlacesService";
import { getWeatherForLocation } from "../services/weatherService";
import type { DayWeather } from "../models";

interface UseWeatherResult {
  weatherByDay: Map<string, DayWeather>;
  isLoading: boolean;
}

export function useWeather(
  tripCities: string[],
  dates: Date[]
): UseWeatherResult {
  const [weatherByDay, setWeatherByDay] = useState<Map<string, DayWeather>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);

  const city = tripCities[0] || "";
  // Stable key for dates array to avoid unnecessary re-fetches
  const datesKey = dates.map((d) => format(d, "yyyy-MM-dd")).join(",");

  useEffect(() => {
    if (!city || dates.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to dates within 10-day forecast window
    const forecastDates = dates.filter((d) => {
      const diff = differenceInCalendarDays(d, today);
      return diff >= 0 && diff < 10;
    });

    if (forecastDates.length === 0) return;

    const dateStrings = forecastDates.map((d) => format(d, "yyyy-MM-dd"));

    let cancelled = false;

    async function fetchWeather() {
      setIsLoading(true);
      try {
        const coords = await geocodeCity(city);
        if (!coords || cancelled) return;

        const weather = await getWeatherForLocation(
          coords.lat,
          coords.lng,
          dateStrings
        );

        if (!cancelled) {
          setWeatherByDay(weather);
        }
      } catch (error) {
        console.error("useWeather error:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [city, datesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { weatherByDay, isLoading };
}
