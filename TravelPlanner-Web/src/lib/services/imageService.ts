/**
 * TravelPlanner Web - Image Service
 *
 * Fetches travel-related images from Unsplash with IndexedDB caching.
 */

import { db } from "@/lib/db";

// Default travel-themed image URLs as fallback
const DEFAULT_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80",
];

// Mapping of common cities to specific Unsplash photo IDs
const CITY_IMAGE_MAP: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
  "san francisco": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
  "los angeles": "https://images.unsplash.com/photo-1488625343239-b3e661bb1689?w=800&q=80",
  chicago: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
  miami: "https://images.unsplash.com/photo-1533104816931-20fa691ae6fe?w=800&q=80",
  venice: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80",
  prague: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80",
  budapest: "https://images.unsplash.com/photo-1596483640530-cb0f6ef5f1a3?w=800&q=80",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80",
  seattle: "https://images.unsplash.com/photo-1369000153341-822754aa3735?w=800&q=80",
  boston: "https://images.unsplash.com/photo-1474231682423-7e25577a1214?w=800&q=80",
  toronto: "https://images.unsplash.com/photo-1517090704661-d5846f34f82c?w=800&q=80",
  vancouver: "https://images.unsplash.com/photo-1528702748619-e2a67b7f566c?w=800&q=80",
  montreal: "https://images.unsplash.com/photo-1519178614-68676b53f92c?w=800&q=80",
  "hong kong": "https://images.unsplash.com/photo-1478479405421-ce83c92fb4ba?w=800&q=80",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
  shanghai: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=800&q=80",
  beijing: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
  seoul: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80",
  taipei: "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800&q=80",
  manila: "https://images.unsplash.com/photo-1522686425397-a5c9c1301f3f?w=800&q=80",
  jakarta: "https://images.unsplash.com/photo-1555897931-c872a7aa4f5e?w=800&q=80",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
  mumbai: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
  munich: "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800&q=80",
  florence: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
  edinburgh: "https://images.unsplash.com/photo-1467241201914-61169cbe1915?w=800&q=80",
  lisbon: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
  porto: "https://images.unsplash.com/photo-1555881400-89e2a848d6c4?w=800&q=80",
  athens: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80",
  santorini: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80",
  mykonos: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
  cairo: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80",
  "cape town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
  rio: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  "buenos aires": "https://images.unsplash.com/photo-15282965597088-95ebaa5bf5e0?w=800&q=80",
  lima: "https://images.unsplash.com/photo-1518177693434-62e4a7025058?w=800&q=80",
  "mexico city": "https://images.unsplash.com/photo-1518659526054-1282d38f5c31?w=800&q=80",
  cancun: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80",
  quebec: "https://images.unsplash.com/photo-1585136917228-c5d6cbe5e2e4?w=800&q=80",
  melbourne: "https://images.unsplash.com/photo-1514215416122-1b8cfe9dfc27?w=800&q=80",
  auckland: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80",
  wellington: "https://images.unsplash.com/photo-1511206767509-d56eb6108974?w=800&q=80",
  reykjavik: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80",
  oslo: "https://images.unsplash.com/photo-1509346876183-6a612765459f?w=800&q=80",
  stockholm: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&q=80",
  helsinki: "https://images.unsplash.com/photo-1538345761972-46c9427096fb?w=800&q=80",
  copenhagen: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80",
  brussels: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80",
  geneva: "https://images.unsplash.com/photo-1530280639168-b614b4f1b698?w=800&q=80",
  zurich: "https://images.unsplash.com/photo-1547707996-cf3858f0c0a4?w=800&q=80",
};

// Common aliases and abbreviations mapping to canonical city names
const CITY_ALIASES: Record<string, string> = {
  nyc: "new york",
  "new york city": "new york",
  "new york, ny": "new york",
  la: "los angeles",
  sf: "san francisco",
  "san fran": "san francisco",
  dc: "washington dc",
  "washington d.c.": "washington dc",
  vegas: "las vegas",
  "rio de janeiro": "rio",
  bkk: "bangkok",
  hk: "hong kong",
  "mexico city": "mexico city",
  cdmx: "mexico city",
  "cape town": "cape town",
  "buenos aires": "buenos aires",
  ba: "buenos aires",
};

/**
 * Get an image URL for a given city (synchronous, no network call).
 * Tries exact match, then aliases, then substring matching against known cities.
 * Returns a deterministic default image for unknown cities (not random).
 */
export function getCityImageUrl(city: string): string {
  const normalizedCity = city.toLowerCase().trim();

  // 1. Exact match
  if (CITY_IMAGE_MAP[normalizedCity]) {
    return CITY_IMAGE_MAP[normalizedCity];
  }

  // 2. Check aliases
  const aliasKey = CITY_ALIASES[normalizedCity];
  if (aliasKey && CITY_IMAGE_MAP[aliasKey]) {
    return CITY_IMAGE_MAP[aliasKey];
  }

  // 3. Substring match: input contains a known city, or a known city contains the input
  for (const key of Object.keys(CITY_IMAGE_MAP)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      return CITY_IMAGE_MAP[key];
    }
  }

  // For unknown cities, return a deterministic default based on string hash (stable across renders)
  const hash = city.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_TRAVEL_IMAGES[hash % DEFAULT_TRAVEL_IMAGES.length];
}

/**
 * Get an image URL for a trip based on its cities (synchronous, no network call).
 * Uses the first city, or a deterministic default image if no cities are specified.
 */
export function getTripImageUrl(citiesRaw: string): string {
  const cities = citiesRaw.split("|").filter((c) => c.length > 0);

  if (cities.length > 0) {
    return getCityImageUrl(cities[0]);
  }

  // No cities specified, use first default image
  return DEFAULT_TRAVEL_IMAGES[0];
}

/**
 * Get an image URL for a given city with async caching.
 * This function implements a cache-first strategy to fetch fresh images:
 * 1. Check IndexedDB cache → return if cached
 * 2. If NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is set, fetch from Unsplash API, cache result, return URL
 * 3. Fall back to hardcoded map (+ aliases + substring) for instant result
 * 4. Fall back to deterministic default image (hash-based, stable across renders)
 *
 * Note: This skips the hardcoded map check first to ensure we always try to get
 * fresh images from the API/cache, even for cities that have hardcoded entries.
 * The hardcoded map is used as a fallback if the API fails or has no key.
 *
 * @param city - The city name to fetch an image for
 * @returns Promise<string> - The image URL
 */
export async function getCityImageUrlAsync(city: string): Promise<string> {
  const normalizedCity = city.toLowerCase().trim();

  // 1. Check IndexedDB cache first
  try {
    const cached = await db.imageCache.get(normalizedCity);
    if (cached) {
      return cached.url;
    }
  } catch (error) {
    console.error("Failed to read from image cache:", error);
  }

  // 2. Fetch from Unsplash API if key is available
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (accessKey) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          city + " city travel"
        )}&per_page=1&client_id=${accessKey}`
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular;

        // Cache the result in IndexedDB
        try {
          await db.imageCache.put({
            city: normalizedCity,
            url: imageUrl,
            fetchedAt: new Date().toISOString(),
          });
        } catch (cacheError) {
          console.error("Failed to cache image:", cacheError);
        }

        return imageUrl;
      }
    } catch (error) {
      console.error("Failed to fetch image from Unsplash:", error);
    }
  }

  // 3. Fall back to hardcoded map (+ aliases + substring) for instant result
  if (CITY_IMAGE_MAP[normalizedCity]) {
    return CITY_IMAGE_MAP[normalizedCity];
  }

  const aliasKey = CITY_ALIASES[normalizedCity];
  if (aliasKey && CITY_IMAGE_MAP[aliasKey]) {
    return CITY_IMAGE_MAP[aliasKey];
  }

  for (const key of Object.keys(CITY_IMAGE_MAP)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      return CITY_IMAGE_MAP[key];
    }
  }

  // 4. Fall back to deterministic default image (hash-based, not random)
  const hash = city.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_TRAVEL_IMAGES[hash % DEFAULT_TRAVEL_IMAGES.length];
}

/**
 * Get an image URL for a trip based on its cities with async caching.
 * Uses the first city, or a deterministic default image if no cities are specified.
 *
 * @param citiesRaw - Pipe-delimited string of cities
 * @returns Promise<string> - The image URL
 */
export async function getTripImageUrlAsync(citiesRaw: string): Promise<string> {
  const cities = citiesRaw.split("|").filter((c) => c.length > 0);

  if (cities.length > 0) {
    return getCityImageUrlAsync(cities[0]);
  }

  // No cities specified, use first default image
  return DEFAULT_TRAVEL_IMAGES[0];
}

/**
 * Fetch a city image from Unsplash API (legacy function, kept for compatibility).
 * Requires NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to be set.
 * @deprecated Use getCityImageUrlAsync() instead for better caching.
 */
export async function fetchCityImageFromUnsplash(
  city: string
): Promise<string | null> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("Unsplash access key not set, using default images");
    return null;
  }

  try {
    const response = await fetch(
      "https://api.unsplash.com/search/photos?query=" +
        encodeURIComponent(city + " city travel") +
        "&per_page=1&client_id=" +
        accessKey
    );

    if (!response.ok) {
      throw new Error("Unsplash API error: " + response.status);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch image from Unsplash:", error);
    return null;
  }
}
