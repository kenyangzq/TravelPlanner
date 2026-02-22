# TravelPlanner Change History

## 2026-02-22: Add daily journal feature to calendar view
- Extended journal feature (previously only in list view) to the calendar view
- Journal button (BookOpen icon) now appears in each day column header in the calendar grid
- Button shows in primary color when an entry exists, gray when empty
- Clicking opens the same JournalDialog component used in list view
- Integrated using the existing `useReminders` hook for live queries
- Files modified: `TravelPlanner-Web/src/components/itinerary/calendar-view.tsx`, `TravelPlanner-Web/CLAUDE.md`

## 2026-02-22: Add daily journal feature to itinerary list view
- Added journal button (BookOpen icon) in each day's header in the itinerary list view
- Button opens a dialog with a textarea for writing/viewing the day's journal entry
- Button shows in primary color when an entry exists, gray when empty
- Journal entries are stored in the existing `reminders` IndexedDB table, keyed by `[tripId+dayKey]`
- Dialog shows day number and date in the header, with a placeholder prompting users to write about their day
- Word count displayed at the bottom of the textarea
- Save button commits the entry; Cancel closes without saving; empty content deletes existing entry
- Files created: `TravelPlanner-Web/src/components/itinerary/journal-dialog.tsx`
- Files modified: `TravelPlanner-Web/src/components/itinerary/day-section.tsx`, `TravelPlanner-Web/CLAUDE.md`

## 2026-02-22: Fix Airbnb mode to use direct address geocoding instead of place search
- **Problem**: Airbnb mode was still using `searchPlaces()` which searches for establishments/properties near the entered location
- **Solution**: Created new `geocodeAddress()` function in `googlePlacesService.ts` that uses Google Geocoding API to geocode exact street addresses
- **Updated `LocationSearchSection`**: Added `isAddressMode` prop — when true, uses `geocodeAddress()` instead of `searchPlaces()`
- **Airbnb mode now works correctly**: User enters exact address (e.g., "123 Main St, Tokyo, Japan") and Google returns the precise coordinates for that address, not nearby properties
- **Auto-selection**: Address geocoding auto-selects the single result (no dropdown needed) since geocoding an address should return a unique location
- Files modified: `TravelPlanner-Web/src/lib/services/googlePlacesService.ts`, `TravelPlanner-Web/src/lib/services/locationService.ts`, `TravelPlanner-Web/src/components/forms/location-search-section.tsx`, `TravelPlanner-Web/src/components/forms/hotel-form.tsx`

## 2026-02-22: Add Airbnb/vacation rental mode to hotel form
- Added checkbox option "This is an Airbnb / vacation rental" to hotel form
- When Airbnb mode is enabled:
  - Hotel name field is hidden (auto-uses Google Place name or "Airbnb")
  - Shows info banner: "Enter the exact address below, then tap 'Find' to confirm the location with Google Places"
  - Address placeholder changes to "e.g., 123 Main St, Tokyo, Japan"
  - Location label changes to "Address *" (required)
- Save validation requires coordinates to be set for Airbnb bookings
- Save button text dynamically changes to "Add/Update Airbnb" when mode is active
- Created new Checkbox UI component (`src/components/ui/checkbox.tsx`)
- Files modified: `TravelPlanner-Web/src/components/forms/hotel-form.tsx`, `TravelPlanner-Web/src/components/forms/location-search-section.tsx`
- Files created: `TravelPlanner-Web/src/components/ui/checkbox.tsx`

## 2026-02-19: Remove unused day-map components
- Deleted `day-map.tsx` and `leaflet-map.tsx` (Leaflet-based per-day inline map that was never wired into the UI — redundant with the existing Google Maps tab)
- Removed `DayMapLocation` interface from `models.ts` (only used by the deleted components)

## 2026-02-17: Add hotel map links, fix map view dates, fix timeline overlap
- **Hotel map links**: Day hotel headers ("You're staying here") now show a Maps link to the hotel, consistent with hotel event rows
- **Map view date bug**: Fixed timezone issue where `new Date("YYYY-MM-DD")` parsed as UTC, causing a date before trip start to appear in filter buttons. Replaced with `parseISO` from date-fns throughout `trip-map-view.tsx`
- **Timeline timestamp overlap**: Increased left padding and timestamp width in day-section so time labels no longer overlap the vertical timeline line
- Files modified: `src/components/itinerary/day-section.tsx`, `src/components/itinerary/trip-map-view.tsx`

## 2026-02-17: Fix weather condition icons not displaying
- **Bug**: Weather badges in day headers showed temperature but no weather condition icon (sunny/rainy/cloudy etc.)
- **Root cause**: Icon URL was constructed with incorrect suffix `1x.png` — Google Weather API expects `.png` appended directly to `iconBaseUri`
- **Fix**: Changed `${iconBaseUri}1x.png` to `${iconBaseUri}.png` in weatherService.ts
- Files modified: `src/lib/services/weatherService.ts`

## 2026-02-16: Fix map view empty state display
- **Bug**: When filtering by a date with no locations, the entire map and filter controls disappeared
- **Fix**: Map and filter controls now remain visible even when no locations exist for the selected date
- **City centering**: When there are no markers, the map centers on the first trip city (geocoded via Google Maps Geocoding API)
- **Overlay message**: Semi-transparent overlay shows "No locations for this date" message while keeping the map visible
- Files modified: `src/components/itinerary/trip-map-view.tsx`

## 2026-02-16: Improve map view filtering and marker styling
- **Date filter**: Added date filter bar at top of map view with clickable buttons for each trip date. "All dates" button shows all locations. Filter shows count of locations for selected date.
- **Airport city filtering**: Arrival airports are now filtered to only show those whose name contains one of the trip's cities. Return airports (outside target cities) are excluded from the map.
- **Smaller marker dots**: Reduced map marker scale from 10 to 6 for better visibility and less visual clutter.
- Files modified: `src/components/itinerary/trip-map-view.tsx`

## 2026-02-16: Fix Google Places session token usage
- **Problem**: Session tokens were being created as UUID strings but not passed to Google Places API calls. This meant each autocomplete and details call was billed separately instead of as a bundled session.
- **Fix**: Updated `googlePlacesService.ts` to use Google Maps JavaScript API's `AutocompleteSessionToken` class instead of custom UUID tokens.
- **Session tokens now properly passed**: Both `AutocompleteService.getPlacePredictions()` and `PlacesService.getDetails()` now receive the session token parameter for correct billing per Google's requirements.
- Files modified: `src/lib/services/googlePlacesService.ts`

## 2026-02-16: Fix RedNote links not opening on mobile
- **Problem**: RedNote web URL (`xiaohongshu.com/search_result?keyword=...`) doesn't work on mobile — redirects to app download pages instead of showing search results
- **Fix**: Changed to `xhsdiscover://` deep link scheme (`xhsdiscover://search/result?keyword=...`) which opens the RedNote app directly on mobile
- **Centralized URL generation**: All three event rows (hotel, restaurant, activity) now use `buildRedNoteSearchURL()` from `reviewsService.ts` instead of inlining the URL
- **Removed `target="_blank"`**: Deep links don't need `target="_blank"` or `rel="noopener noreferrer"`
- **Relaxed condition**: RedNote link now shows when `googlePlaceName` exists regardless of `tripCities` (city is optional context)
- Files modified: `src/lib/services/reviewsService.ts`, `src/components/itinerary/event-rows/hotel-event-row.tsx`, `src/components/itinerary/event-rows/restaurant-event-row.tsx`, `src/components/itinerary/event-rows/activity-event-row.tsx`

## 2026-02-16: Add daily weather forecasts to itinerary list view
- **New feature**: Weather badges now appear on each day's header in the itinerary list view, showing high/low temperature, weather icon, and precipitation probability (if >30%)
- **Google Weather API**: Uses `weather.googleapis.com/v1/forecast/days:lookup` with the existing Google Maps API key (Weather API must be enabled on the Google Cloud project)
- **IndexedDB caching**: Weather data cached in `weatherCache` table (Dexie v5) with 3-hour TTL, keyed by rounded coordinates + date. Falls back to stale cache on API error.
- **Graceful degradation**: No badges shown for dates >10 days away, API errors, or missing API key
- **Uses first trip city**: Geocodes first city via existing `geocodeCity()` function for coordinates
- Files created: `src/lib/services/weatherService.ts`, `src/lib/hooks/useWeather.ts`, `src/components/itinerary/weather-badge.tsx`
- Files modified: `src/lib/services/googlePlacesService.ts` (exported `geocodeCity`), `src/lib/models.ts` (added `WeatherCache`, `DayWeather` interfaces), `src/lib/db.ts` (added v5 with `weatherCache` table), `src/components/itinerary/list-view.tsx`, `src/components/itinerary/day-section.tsx`

## 2026-02-16: Fix Google Places in production (static export)
- **Root cause**: `output: 'export'` in Next.js means no API routes exist in production. The `/api/places/*` proxy routes that handled CORS were unavailable in the static build.
- **Fix**: Rewrote `googlePlacesService.ts` to use the **Google Maps JavaScript API** (Places library) instead of REST API proxied through API routes. The JS API is designed for client-side use and has no CORS issues.
- **Added `@types/google.maps`** dev dependency for TypeScript support.
- **Updated `trip-map-view.tsx`**: Added `libraries=places` to the Google Maps script URL to ensure Places library is always loaded (prevents conflict with googlePlacesService).
- **Important**: The Google Cloud project must have both **Maps JavaScript API** and **Places API** enabled.
- Files modified: `src/lib/services/googlePlacesService.ts`, `src/components/itinerary/trip-map-view.tsx`, `package.json`

## 2026-02-16: Fix Maps link, delete event bug, and mobile header padding
- **Fixed Maps link**: Removed broken `place_id` URL format (`/maps/place/?api=1&place_id=...`). Now uses `googlePlaceName` (official Google Places name) for search-based URLs that reliably open the correct place page, matching the RedNote link approach.
- **Fixed event deletion bug**: The delete confirmation dialog's `onConfirm` handler was not actually deleting the event — it only closed the dialog. Now properly calls `deleteEvent()` from the `useEvents` hook.
- **Fixed mobile PWA header overlap**: Sticky headers were hidden behind the phone status bar in PWA mode. Added `sticky-safe` CSS class that uses `env(safe-area-inset-top)` for both `top` positioning and `padding-top`.
- Files modified: `src/lib/utils/navigationLinks.ts`, `src/lib/services/mapsService.ts`, `src/app/trips/[tripId]/_components/trip-detail-client.tsx`, `src/app/page.tsx`, `src/app/globals.css`

## 2026-02-16: Fix CORS issue with Google Places API
- **Added Next.js API routes**: Created `/api/places/autocomplete` and `/api/places/details` to proxy Google Places requests server-side
- **Fixed CORS error**: Google Places API cannot be called directly from browser due to CORS policy. Using Next.js API routes as proxy solves this.
- **Updated googlePlacesService**: Changed to use internal API routes instead of calling Google directly
- Files created: `src/app/api/places/autocomplete/route.ts`, `src/app/api/places/details/route.ts`
- Files modified: `src/lib/services/googlePlacesService.ts`, `src/components/forms/location-search-section.tsx`

## 2026-02-16: Store Google Places data and improve map/review links
- **Store place_id and official place name**: All location-based events (hotel, restaurant, activity) now store `googlePlaceId` and `googlePlaceName` from Google Places API.
- **Maps button opens Google Place page**: Updated `buildLocationLink()` to use place_id for direct links to Google Place pages (shows reviews, photos, info).
- **Fallback URL generation**: If no place_id, uses name + address search to open the place page. Coordinates-only searches are last resort.
- **Removed Reviews button**: The "Maps" button now opens the Google Place page which includes reviews, so the separate "Reviews" button was removed.
- **RedNote uses official place name**: RedNote search now uses `googlePlaceName` (the official Google Places name) instead of user-entered name for better results.
- **Updated all forms**: Hotel, restaurant, and activity forms now capture and store place_id and googlePlaceName when location is selected.
- **Updated all event rows**: Removed "Reviews" button, kept "Maps" and "RedNote" buttons. Car rental only shows "Maps" button.
- Files modified: `src/lib/models.ts`, `src/lib/services/mapsService.ts`, `src/components/forms/hotel-form.tsx`, `src/components/forms/restaurant-form.tsx`, `src/components/forms/activity-form.tsx`, `src/components/itinerary/event-rows/*.tsx`

## 2026-02-16: Switch to Google Places API for location search
- **Replaced Nominatim with Google Places API**: Location search now uses Google Places Autocomplete + Places Details APIs for better quality and exact place_id for review links.
- **Single API key**: Uses existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for Maps JavaScript API, Places API, and Geocoding API.
- **Better integration**: Google Places provides exact place_id which enables direct links to Google Reviews pages (no more search ambiguity).
- **Faster search**: No more 1 req/sec rate limiting (Nominatim policy). Google Places allows much higher throughput.
- **New service file**: `googlePlacesService.ts` with functions for autocomplete, place details, and geocoding.
- **Backward compatible interface**: `locationService.ts` re-exports from Google Places service, so all forms work without changes.
- **Updated all forms**: Restaurant, hotel, activity, and car rental forms updated to use Google Places data structure (name, formatted_address, numeric lat/lng).
- **Attribution change**: Updated location search UI from "© OpenStreetMap contributors" to "Powered by Google Places".
- Files created: `src/lib/services/googlePlacesService.ts`
- Files modified: `src/lib/services/locationService.ts`, `src/components/forms/*.tsx`, `src/components/forms/location-search-section.tsx`
- Files deleted: `src/lib/services/locationService.old.ts` (Nominatim backup)

## 2026-02-16: Add review integration (Google Reviews + RedNote)
- **Initial implementation**: Added review search buttons to event rows (Maps, Reviews, RedNote).
- **Note**: This feature was later improved - see "Store Google Places data and improve map/review links" entry above for current implementation.
- **Created reviews service**: `reviewsService.ts` for generating review search URLs.
- Files created: `src/lib/services/reviewsService.ts`

## 2026-02-16: Simplify navigation links and add Google Maps trip view
- **Simplified navigation**: Removed between-event navigation links from list view. Events now only show "View on Google Maps" link instead of "Navigate to..." directions.
- **Location search links**: Created `buildLocationSearchLink()` in `navigationLinks.ts` and `buildLocationLink()` in `mapsService.ts` for opening locations in Google Maps (not directions).
- **Updated all event rows**: Restaurant, hotel, activity, car rental, and flight event rows now use location search links that open the place on Google Maps for viewing.
- **New Map view**: Added third view mode "Map" alongside List and Calendar. Shows all trip locations (hotels, restaurants, activities, flight airports) on a Google Map with color-coded markers.
- **Google Maps integration**: New `TripMapView` component uses Google Maps JavaScript API. Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in .env.local.
- **Removed unused components**: Deleted `day-map.tsx` and `leaflet-map.tsx` (per-day Leaflet map is now replaced by trip-wide Google Maps view).
- **Store update**: Added "map" as valid itinerary view mode in `useUIStore`.
- Files modified: `src/lib/services/mapsService.ts`, `src/lib/utils/navigationLinks.ts`, `src/lib/store.ts`, `src/components/itinerary/event-rows/*.tsx`, `src/components/itinerary/day-section.tsx`, `src/app/trips/[tripId]/_components/trip-detail-client.tsx`
- Files created: `src/components/itinerary/trip-map-view.tsx`
- Files deleted: `src/components/itinerary/day-map.tsx`, `src/components/itinerary/leaflet-map.tsx`

## 2026-02-16: Fix Unsplash image loading and add trip detail banner
- **Fixed image persistence issue**: Images were disappearing when navigating back from trip detail to trip list. Root cause: hardcoded URL failed (404) setting `hasError = true`, then cached URL arrived but error state wasn't cleared. Fixed by resetting error state when new URL arrives.
- **Improved Unsplash integration**: Reordered `getCityImageUrlAsync()` to skip hardcoded map check and always try cache → API → hardcoded fallback. This ensures fresh images from API even for hardcoded cities, replacing broken hardcoded URLs.
- **Added city image banner to trip detail page**: New `TripImageBanner` component shows city photo at top 25% of trip detail page (min 180px, max 300px height) with gradient overlay blending into page background.
- **Enhanced TripImage component**: Added proper state management with error reset, loading state cleanup, and key prop for proper re-renders.
- Files modified: `src/components/trips/trip-row.tsx`, `src/app/trips/[tripId]/_components/trip-detail-client.tsx`, `src/lib/services/imageService.ts`

## 2026-02-16: Dynamic city images via Unsplash API with IndexedDB caching
- Added `imageCache` table to Dexie DB (version 4) with schema: `city, url, fetchedAt`
- Rewrote `imageService.ts` with cache-first async strategy:
  - `getCityImageUrlAsync()` and `getTripImageUrlAsync()` functions that:
    1. Check hardcoded map (+ aliases + substring) → return immediately if found
    2. Check IndexedDB cache → return if cached
    3. Fetch from Unsplash API if `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` is set, cache result, return URL
    4. Fall back to deterministic default image (hash-based, not random, for stability)
- Updated `TripImage` component in `trip-row.tsx` to use async flow with instant fallback
- Changed default image selection from random to hash-based for stability across renders
- App works gracefully without Unsplash API key (falls back to hardcoded map + defaults)
- Files modified: `src/lib/db.ts`, `src/lib/services/imageService.ts`, `src/components/trips/trip-row.tsx`, `CLAUDE.md`

## 2026-02-16: Mobile UI responsiveness fixes across the web app
- **Trip detail header**: Shortened "Add Event" → "Add" and "Export" → icon-only on mobile. Reduced padding, hid MapPin icon on small screens, added `truncate` to trip name. Fixed sticky view toggle `top` offset to match smaller mobile header.
- **Calendar view**: Merged date header and body into a single scroll container so headers scroll horizontally with content. Reduced column width from 128px to 80px on mobile, slot height from 64px to 40px. Made event blocks more compact with smaller text and hidden time labels on mobile. Added responsive `slotHeight` state that updates on window resize.
- **Home page**: Shortened "Create New Trip" → "New" on mobile. Reduced header height, padding, and font sizes.
- **Trip list**: Reduced grid gap from 32px to 16px on mobile.
- **Day section timeline**: Reduced left padding from 64px to 48px on mobile. Adjusted time label positioning and font sizes. Made day header badge and text smaller on mobile.
- **Flight event row**: Reduced padding and font sizes. Added `truncate` to airport info text.
- **Hotel cards (calendar view)**: More compact padding, smaller icons, single-line date range on mobile.
- Files modified: `trip-detail-client.tsx`, `calendar-view.tsx`, `page.tsx`, `trip-list.tsx`, `day-section.tsx`, `flight-event-row.tsx`

## 2026-02-16: Fix flight API key not found in Azure SWA production
- Root cause: GitHub Actions workflow referenced `secrets.RAPIDAPI_KEY` but the actual GitHub secret is named `NEXT_PUBLIC_RAPIDAPI_KEY`. The mismatch meant the env var was empty at build time.
- Fix: Updated workflow to use `secrets.NEXT_PUBLIC_RAPIDAPI_KEY` to match the actual secret name.
- Files modified: `.github/workflows/azure-static-web-apps-calm-ground-01e6aa11e.yml`

## 2026-02-16: Fix "Trip not found" on Azure SWA production for newly created trips
- Root cause: In static export, Azure SWA rewrites all `/trips/*` to `/trips/_/index.html`. The server component passed `tripId: '_'` as a prop, so the client could never find the actual trip.
- Fix: Client component now reads the real tripId from `window.location.pathname` instead of relying on the server-provided prop.
- Files modified: `src/app/trips/[tripId]/_components/trip-detail-client.tsx`

## 2026-02-16: Fix dialog padding and add DateRangePicker calendar component
- Fixed ConfirmDialog content padding — added `px-6 pt-6` to content wrapper so text doesn't touch edges
- Created new `DateRangePicker` component (`src/components/ui/date-range-picker.tsx`) — calendar-based date range picker with month navigation, two-step selection, and range highlighting
- Updated `NewTripDialog` to use DateRangePicker instead of two separate `<input type="date">` fields
- Updated `HotelForm` to use DateRangePicker for check-in/check-out dates (time inputs remain separate)
- Updated `CarRentalForm` to use DateRangePicker for pickup/return dates (time inputs remain separate)
- Files modified: `confirm-dialog.tsx`, `date-range-picker.tsx` (new), `new-trip-dialog.tsx`, `hotel-form.tsx`, `car-rental-form.tsx`

## 2026-02-16: Add back button, city images, simplify forms, and fix Azure routing
- Added back button (ArrowLeft icon) to trip detail page header for easy navigation back to trip list
- Created `imageService.ts` with pre-defined Unsplash images for 60+ popular cities and 6 default travel-themed fallback images
- Updated trip cards to display city photos instead of gradient placeholders, with loading states and error handling
- Removed `destination` field from new trip form (cities field is sufficient)
- Removed `cuisineType` and `confirmationNumber` fields from restaurant form
- Removed `confirmationNumber` field from hotel form
- **Critical Azure fix**: Added trailing slashes to all dynamic route navigation URLs (`/trips/${tripId}/`) to match `trailingSlash: true` config
- This resolves "Trip Not Found" error on Azure Static Web Apps after creating trips
- Improved Create Trip dialog UI with better padding, consistent spacing, and wider dialog (480px)
- Files modified: `trip-detail-client.tsx`, `imageService.ts`, `trip-row.tsx`, `new-trip-dialog.tsx`, `restaurant-form.tsx`, `hotel-form.tsx`, `page.tsx`

## 2026-02-15: Force static export mode in GitHub Actions to avoid warmup timeout
- Added `is_static_export: true` to Azure Static Web Apps deployment workflow
- This forces Oryx (Azure's build engine) to treat the app as pure static export
- Prevents Azure from repackaging Next.js for backend deployment which triggers warmup timeout
- Added cleanup step to remove old `.next` and `out` directories before build
- Combined with `output: 'export'` and `trailingSlash: true` in next.config.js
- Files modified: `.github/workflows/azure-static-web-apps-calm-ground-01e6aa11e.yml`

## 2026-02-15: Optimize staticwebapp.config.json for Azure SWA deployment
- Updated `navigationFallback.rewrite` to point directly to `/trips/_/index.html` for accurate dynamic route handling
- Added `/images/*` to exclusion list and updated manifest filename to `manifest.webmanifest`
- Added route redirect from `/index.html` to `/` for cleaner URLs
- Added `.webmanifest` MIME type declaration for proper PWA manifest serving
- This ensures when users refresh `/trips/xxx`, the browser loads the correct HTML/JS and client-side code reads tripId from URL
- Files modified: `staticwebapp.config.json`

## 2026-02-15: Hide map and reminder sidebar from list view
- Map and reminder features remain implemented but are now hidden from UI per user request
- Reverted day-section.tsx to single-column timeline layout
- Removed two-column layout with map/reminder sidebar
- Files modified: `day-section.tsx`

## 2026-02-15: Rename daily notes to reminders and add day map view
- Renamed DayNote model to Reminder (short notes instead of journal entries)
- Added day map view to list view showing relevant locations for each day
- Map uses Leaflet + OpenStreetMap (free, no API key required)
- Hotels shown in purple, restaurants in red, flight airports in blue
- Flight airports filtered by day's primary city (determined from hotel address or first trip city)
- Added `extractDayMapLocations` helper to gather locations with city filtering
- Changed reminder color from amber (notes) to blue for cleaner UI
- Map auto-fits bounds to show all markers with location badges below
- Updated database to version 3 with migration from dayNotes to reminders
- Files modified: `models.ts`, `db.ts`, `day-section.tsx`, `list-view.tsx`
- Files created: `useReminders.ts`, `day-map.tsx`
- Files deleted: `useDayNotes.ts`

## 2026-02-15: Fix dev server with conditional static export configuration
- Fixed Next.js dev server error where `"use client"` components couldn't export `generateStaticParams()` with static export
- Split `trips/[tripId]/page.tsx` into server wrapper (exports `generateStaticParams()`) + client component (`_components/trip-detail-client.tsx`)
- Made `output: 'export'` conditional on `NODE_ENV === 'production'` in `next.config.js`
- Dev mode now uses Next.js hybrid rendering (no static export) for full dynamic routes support
- Production builds still use static export to avoid Azure SWA warmup timeout on free tier
- Files modified: `next.config.js`, `trips/[tripId]/page.tsx`
- Files created: `trips/[tripId]/_components/trip-detail-client.tsx`

## 2026-02-15: Switch to static export to fix Azure SWA warm-up timeout
- Azure SWA deployment was failing with "Web app warm up timed out" due to SSR cold start on free tier
- Added `output: 'export'` and `trailingSlash: true` to `next.config.js` for fully static HTML generation
- Added `generateStaticParams` to `trips/[tripId]/page.tsx` returning placeholder `[{ tripId: '_' }]`
- Added route rewrite rule in `staticwebapp.config.json`: `/trips/*` → `/trips/_/index.html`
- Changed `output_location` from `""` to `"out"` in GitHub Actions workflow for static export output
- Files modified: `next.config.js`, `trips/[tripId]/page.tsx`, `staticwebapp.config.json`, `.github/workflows/azure-static-web-apps-calm-ground-01e6aa11e.yml`

## 2026-02-15: Add daily notes, list view timestamps, and fix calendar positioning
- Fixed calendar view time positioning bug: events were rendered inside per-slot divs causing double offset (e.g., 7 PM event at 1664px instead of 832px). Moved event rendering to the day column div directly.
- Added event start time labels to the left of timeline dots in list view (`day-section.tsx`). Widened timeline padding from `pl-4` to `pl-16` to accommodate time text.
- Added daily notes/journal feature: new `DayNote` model in `models.ts`, `dayNotes` table in Dexie DB (version 2), `useDayNotes` hook, and inline note editing UI in day sections with auto-save.
- Files modified: `calendar-view.tsx`, `day-section.tsx`, `list-view.tsx`, `models.ts`, `db.ts`
- Files created: `useDayNotes.ts`

## 2026-02-15: Switch from static export to Azure SWA hybrid rendering
- Removed `output: 'export'` from `next.config.js` — incompatible with runtime dynamic routes (IndexedDB trip IDs are only known at runtime, not build time)
- Changed `output_location` from `"out"` to `""` in GitHub Actions workflow so Azure SWA auto-detects `.next/` output
- Azure SWA's built-in Next.js hybrid rendering support handles dynamic `[tripId]` routes without needing `generateStaticParams`
- Reverted `trips/[tripId]/page.tsx` to simple `"use client"` component (removed unnecessary server/client split)
- Deleted `trip-detail-client.tsx` (no longer needed)
- Updated CLAUDE.md to reflect new deployment architecture

## 2026-02-15: Fix web app build errors and static export compatibility
- Fixed invalid lucide-react imports in `trip-row.tsx`: `MoreHoriz` → `MoreHorizontal`, `Flight` → `Plane`
- Fixed `day-section.tsx` using non-existent `item.navigationLink` — changed to `item.navigationToEvent` to match `ItineraryItem` interface
- Fixed `flight-event-row.tsx` using `durationLabel` → `destinationLabel` to match `EventNavigationLink` type
- Fixed `calendarExport.ts` exhaustive union fallback — return `""` instead of accessing property on `never`
- Split `trips/[tripId]/page.tsx` into server wrapper + `trip-detail-client.tsx` client component to support `generateStaticParams` with `output: 'export'`
- Added placeholder param `[{ tripId: "_" }]` in `generateStaticParams` (Next.js 14 requires non-empty array with static export)
- Created `staticwebapp.config.json` with `navigationFallback` for Azure SWA client-side routing

## 2026-02-15: Switch to static export for Azure SWA deployment and update web app UI
- Switched to static export (`output: 'export'`) for Azure Static Web Apps compatibility
- Moved flight API from server-side API route to client-side direct calls via `NEXT_PUBLIC_RAPIDAPI_KEY`
- Deleted `/api/flights/route.ts`
- Updated GitHub Actions workflow to use `out/` output directory
- Updated eslint-config-next to match next version, removed `@types/uuid`

## 2026-02-15: Complete PWA implementation
- Ported all iOS features to Next.js/React with TypeScript
- Includes trip management, 5 event types, location search with city biasing, flight API integration, calendar view with time-positioned events, and PWA configuration for iPhone installation

## 2026-02-15: Improve location search with city-based bounding box biasing
- Uses Nominatim viewbox parameter to prioritize results within ~50km of trip cities
- Added deduplication by coordinate proximity (~100m) and sorting by importance

## 2026-02-15: Fix calendar view flight event display
- Fixed calendar view to display flight events with plane icons at actual time positions
- Events now show in correct time slots (6 AM - 11 PM) with color-coded backgrounds by event type and proper flight indicators

## 2026-02-15: Fix edit dialog width on desktop
- Added `sm:max-w-lg` to dialog container in `dialog.tsx` so modals are properly constrained on larger screens while remaining full-width bottom sheets on mobile

## 2026-02-15: Create companion web app (PWA)
- Created companion web app (PWA) version in TravelPlanner-Web/ directory with full feature parity to iOS app

## 2025-02-08: Switch from Google Maps to Apple Maps for navigation
- Created `MapsService` with Apple Maps URL format (`maps.apple.com`)
- Updated all navigation to use Apple Maps; coordinates still prioritized over addresses for accuracy
- Removed `comgooglemaps` URL scheme from build settings

## 2025-02-08: Improve time picker UX
- Made `MinuteIntervalDatePicker` collapsible — shows compact time display by default, expands to full picker wheels on tap
- Picker uses UIKit's `UIDatePicker` with `minuteInterval = 15` for 15-minute increments

## 2025-02-08: Fix Google Maps navigation links
- Removed `canOpenURL` checks and web URL fallbacks
- All navigation now uses `comgooglemaps://` URL scheme directly, letting iOS handle fallback

## 2025-02-08: Fix hotel navigation link issue
- Added new mixed-mode URL generation methods `directionsURLFromNameToCoords` and `directionsURLFromCoordsToName` to `GoogleMapsService`

## 2025-02-08: Add back-to-hotel navigation
- Last non-hotel event of each day now shows navigation link back to the day's hotel
- If multiple hotels exist on same day, uses latest hotel (by check-in date)
- Updated `ItineraryItem` struct to include `navigationToHotel` property
- Modified both list and calendar views to display these links

## 2025-02-08: Fix calendar view hotel banner on check-out date
- Changed `findHotels(for:)` comparison from `<` to `<=` for check-out date

## 2025-02-08: Fix hotel map link button not clickable
- Removed `.contentShape(Rectangle())` and changed to `.simultaneousGesture` in `ItineraryDaySection`

## 2025-02-08: Fix hotel-to-restaurant navigation links in calendar view
- Calendar view now shows navigation links between events and from hotel banners to first event of each day
- Made `buildNavigationLink` public in `TripDetailViewModel`
- Updated `CalendarItineraryView` to display navigation links
