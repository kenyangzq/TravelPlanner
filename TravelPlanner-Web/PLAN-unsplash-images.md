# Plan: Dynamic City Images via Unsplash API with IndexedDB Caching

## Context
The current image service only handles ~60 hardcoded cities. Any other city falls back to a generic travel photo. The goal is worldwide city coverage using the Unsplash API (free tier: 50 req/hr), with results cached in IndexedDB so each city only needs one API call ever.

## Approach

### 1. Add `imageCache` table to Dexie DB
**File**: `src/lib/db.ts`
- Bump to version 4
- Add `imageCache` table with schema: `city, url, fetchedAt`
- `city` (primary key): lowercase trimmed city name
- `url`: the Unsplash image URL
- `fetchedAt`: timestamp for optional cache expiry

### 2. Rewrite `imageService.ts` with cache-first strategy
**File**: `src/lib/services/imageService.ts`
- Keep the hardcoded `CITY_IMAGE_MAP` as instant results (no network needed)
- New async function `getCityImageUrlAsync(city)`:
  1. Check hardcoded map (+ aliases + substring) → return immediately if found
  2. Check IndexedDB cache → return if cached
  3. If `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` is set, fetch from Unsplash API, cache result in IndexedDB, return URL
  4. Fall back to deterministic default image (hash-based, not random, so it's stable across renders)
- Keep the existing sync `getCityImageUrl()` as a fast fallback (used during initial render before async completes)

### 3. Update `TripImage` component to use async flow
**File**: `src/components/trips/trip-row.tsx`
- `useEffect` calls the new async `getCityImageUrlAsync()`
- Shows the hardcoded/cached URL instantly if available, then upgrades to Unsplash result when fetched
- Gradient placeholder still shown during loading

### 4. Environment variable
**File**: `.env.local` (user adds manually)
- Add `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=<key>`
- Update CLAUDE.md to document this
- App works without the key (falls back to hardcoded map + defaults)

## Files to Modify
1. `src/lib/db.ts` — add imageCache table (version 4)
2. `src/lib/services/imageService.ts` — async fetch + cache logic
3. `src/components/trips/trip-row.tsx` — async image loading in TripImage
4. `CLAUDE.md` — document new env var and caching behavior
5. `HISTORY.md` — append changelog entry

## Verification
- Create a trip with a city NOT in the hardcoded map (e.g., "Kyoto", "Marrakech")
- Verify it fetches from Unsplash and displays the image
- Reload the page — verify the cached image loads instantly (no Unsplash call)
- Create a trip with a hardcoded city (e.g., "Paris") — verify it still works instantly with no API call
- Test without the Unsplash API key — verify graceful fallback to defaults
