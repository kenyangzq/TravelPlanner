# TravelPlanner Change History

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
