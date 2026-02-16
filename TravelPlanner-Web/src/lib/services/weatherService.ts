/**
 * TravelPlanner Web - Weather Service
 *
 * Fetches daily weather forecasts from Google Weather API.
 * Caches results in IndexedDB with a 3-hour TTL.
 */

import { db } from "../db";
import type { DayWeather, WeatherCache } from "../models";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface GoogleWeatherDay {
  interval?: {
    startTime?: string;
    endTime?: string;
  };
  displayDateTime?: {
    year?: number;
    month?: number;
    day?: number;
  };
  daytimeForecast?: {
    weather?: {
      iconBaseUri?: string;
      description?: { text?: string };
    };
  };
  nighttimeForecast?: {
    weather?: {
      iconBaseUri?: string;
      description?: { text?: string };
    };
  };
  temperature?: {
    maxTemperature?: { degrees?: number; unit?: string };
    minTemperature?: { degrees?: number; unit?: string };
  };
  maxTemperature?: { degrees?: number; unit?: string };
  minTemperature?: { degrees?: number; unit?: string };
  precipitationProbability?: number;
}

/**
 * Round coordinates to 2 decimal places for cache grouping
 */
function roundCoord(val: number): number {
  return Math.round(val * 100) / 100;
}

function cacheId(lat: number, lng: number, date: string): string {
  return `${roundCoord(lat)}_${roundCoord(lng)}_${date}`;
}

/**
 * Get cached weather entries that are still fresh
 */
async function getCachedWeather(
  lat: number,
  lng: number,
  dates: string[]
): Promise<Map<string, DayWeather>> {
  const result = new Map<string, DayWeather>();
  const now = Date.now();
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);

  try {
    const ids = dates.map((d) => cacheId(rLat, rLng, d));
    const entries = await db.weatherCache.bulkGet(ids);

    for (const entry of entries) {
      if (!entry) continue;
      const age = now - new Date(entry.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        result.set(entry.date, {
          tempHigh: entry.tempHigh,
          tempLow: entry.tempLow,
          conditionDescription: entry.conditionDescription,
          iconUri: entry.iconUri,
          precipitationProbability: entry.precipitationProbability,
        });
      }
    }
  } catch (error) {
    console.error("Weather cache read error:", error);
  }

  return result;
}

/**
 * Get stale cache entries as fallback on API error
 */
async function getStaleCachedWeather(
  lat: number,
  lng: number,
  dates: string[]
): Promise<Map<string, DayWeather>> {
  const result = new Map<string, DayWeather>();
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);

  try {
    const ids = dates.map((d) => cacheId(rLat, rLng, d));
    const entries = await db.weatherCache.bulkGet(ids);

    for (const entry of entries) {
      if (!entry) continue;
      result.set(entry.date, {
        tempHigh: entry.tempHigh,
        tempLow: entry.tempLow,
        conditionDescription: entry.conditionDescription,
        iconUri: entry.iconUri,
        precipitationProbability: entry.precipitationProbability,
      });
    }
  } catch {
    // Ignore cache errors on fallback
  }

  return result;
}

/**
 * Store weather entries in IndexedDB cache
 */
async function cacheWeatherEntries(
  lat: number,
  lng: number,
  entries: Map<string, DayWeather>
): Promise<void> {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  const now = new Date().toISOString();

  const records: WeatherCache[] = [];
  for (const [date, weather] of entries) {
    records.push({
      id: cacheId(rLat, rLng, date),
      lat: rLat,
      lng: rLng,
      date,
      tempHigh: weather.tempHigh,
      tempLow: weather.tempLow,
      conditionDescription: weather.conditionDescription,
      iconUri: weather.iconUri,
      precipitationProbability: weather.precipitationProbability,
      fetchedAt: now,
    });
  }

  try {
    await db.weatherCache.bulkPut(records);
  } catch (error) {
    console.error("Weather cache write error:", error);
  }
}

/**
 * Fetch weather forecast from Google Weather API
 */
async function fetchWeatherFromApi(
  lat: number,
  lng: number
): Promise<Map<string, DayWeather>> {
  if (!API_KEY) return new Map();

  const url = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=10&unitsSystem=METRIC`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const result = new Map<string, DayWeather>();

  const forecastDays: GoogleWeatherDay[] =
    data.forecastDays || data.dailyForecasts || [];

  for (const day of forecastDays) {
    let dateStr: string | null = null;

    // Try displayDateTime first
    if (day.displayDateTime) {
      const { year, month, day: d } = day.displayDateTime;
      if (year && month && d) {
        dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }

    // Fall back to interval.startTime
    if (!dateStr && day.interval?.startTime) {
      dateStr = day.interval.startTime.substring(0, 10);
    }

    if (!dateStr) continue;

    // Extract temperatures - try nested structure first, then flat
    const tempContainer = day.temperature || day;
    const highTemp = tempContainer.maxTemperature?.degrees ?? 0;
    const lowTemp = tempContainer.minTemperature?.degrees ?? 0;

    // Extract weather description and icon from daytime forecast
    const daytimeWeather = day.daytimeForecast?.weather;
    const description = daytimeWeather?.description?.text || "";
    const iconBaseUri = daytimeWeather?.iconBaseUri || "";
    const iconUri = iconBaseUri ? `${iconBaseUri}1x.png` : "";

    const precipProb = day.precipitationProbability ?? 0;

    result.set(dateStr, {
      tempHigh: Math.round(highTemp),
      tempLow: Math.round(lowTemp),
      conditionDescription: description,
      iconUri,
      precipitationProbability: precipProb,
    });
  }

  return result;
}

/**
 * Get weather for a location on specific dates.
 * Checks IndexedDB cache first (3h TTL), fetches from API if stale/missing.
 * Falls back to stale cache on API error.
 */
export async function getWeatherForLocation(
  lat: number,
  lng: number,
  dates: string[]
): Promise<Map<string, DayWeather>> {
  if (!API_KEY || dates.length === 0) return new Map();

  // Check cache for all requested dates
  const cached = await getCachedWeather(lat, lng, dates);

  // If all dates are cached and fresh, return immediately
  const missingDates = dates.filter((d) => !cached.has(d));
  if (missingDates.length === 0) return cached;

  // Fetch from API (returns up to 10 days)
  try {
    const apiResults = await fetchWeatherFromApi(lat, lng);

    // Cache all API results
    if (apiResults.size > 0) {
      await cacheWeatherEntries(lat, lng, apiResults);
    }

    // Merge: cached (fresh) + api results for missing dates
    const merged = new Map(cached);
    for (const date of missingDates) {
      const apiWeather = apiResults.get(date);
      if (apiWeather) {
        merged.set(date, apiWeather);
      }
    }

    return merged;
  } catch (error) {
    console.error("Weather API fetch error:", error);
    // Fall back to stale cache
    const stale = await getStaleCachedWeather(lat, lng, dates);
    // Merge fresh cache + stale for missing
    const merged = new Map(cached);
    for (const [date, weather] of stale) {
      if (!merged.has(date)) {
        merged.set(date, weather);
      }
    }
    return merged;
  }
}
