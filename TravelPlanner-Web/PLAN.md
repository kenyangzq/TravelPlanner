# TravelPlanner Web App (PWA) - Implementation Plan

## Context
The user has an iOS TravelPlanner app built with SwiftUI/SwiftData and wants a web version they can use on iPhone by saving it as a PWA (Add to Home Screen). The web app should replicate all functionality of the iOS app.

## Tech Decisions
- **Framework**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Data**: IndexedDB via Dexie.js (browser-only, no server DB)
- **Flight API**: AeroDataBox via Next.js API route (hides RapidAPI key)
- **Maps**: Google Maps URL links (no API key needed)
- **Location Search**: Nominatim (OpenStreetMap, free, no API key)
- **PWA**: `@ducanh2912/next-pwa` for service worker + manifest
- **State**: Zustand for UI state (modals, editing); Dexie `useLiveQuery` for data
- **Icons**: lucide-react (replaces SF Symbols)
- **Dates**: date-fns

## Project Structure
```
travel-planner-web/
  src/
    app/
      layout.tsx                    # Root layout, PWA metadata
      page.tsx                      # Trip list (home)
      manifest.ts                   # PWA manifest
      trips/[tripId]/
        page.tsx                    # Itinerary (list + calendar toggle)
        flights/[eventId]/page.tsx  # Flight detail
      api/flights/route.ts          # AeroDataBox proxy
    components/
      trips/        # TripList, TripRow, NewTripDialog
      itinerary/    # ListView, DaySection, CalendarView, EventRows, NavigationLinkRow, FlightDetail
      forms/        # FlightForm, HotelForm, RestaurantForm, ActivityForm, CarRentalForm, DurationPicker, LocationSearchSection
      ui/           # Button, Dialog, EmptyState, ConfirmDialog
    lib/
      db.ts         # Dexie database schema
      models.ts     # TypeScript interfaces (discriminated union for events)
      hooks/        # useTrips, useEvents, useTripDetail
      services/     # mapsService, flightService, locationService
      utils/        # dateFormatters, navigationLinks, constants
    public/icons/   # PWA icons
```

## Data Model Approach
No class inheritance in IndexedDB — use a discriminated union with `eventType` field:
- `Trip`: id, name, destination, cities[], startDate, endDate
- `TripEvent` = `FlightEvent | HotelEvent | RestaurantEvent | ActivityEvent | CarRentalEvent`
- Each event type has its own fields plus shared base fields (id, tripId, eventType, title, startDate, endDate, notes, locationName, lat/lng)
- Dexie indexes: `trips: 'id, startDate'`, `events: 'id, tripId, eventType, [tripId+startDate]'`

## Implementation Phases (in dependency order)

### Phase 1: Project Setup
- Initialize Next.js with TypeScript + Tailwind
- Install dependencies (dexie, date-fns, zustand, lucide-react, next-pwa, uuid, clsx)
- Set up `.env.local` with `RAPIDAPI_KEY`
- Configure PWA in `next.config.js`

### Phase 2: Data Layer
- `models.ts` — TypeScript interfaces for all models
- `db.ts` — Dexie DB with trips + events tables
- `useTrips.ts` — CRUD hooks with `useLiveQuery`
- `useEvents.ts` — CRUD hooks for events

### Phase 3: Shared UI Components
- Button, Dialog, EmptyState, ConfirmDialog
- DurationPicker (15-min increments)

### Phase 4: Trip List Page
- TripList, TripRow, NewTripDialog
- Trip CRUD (create, delete, navigate to itinerary)

### Phase 5: Maps & Navigation Logic
- `mapsService.ts` — Google Maps URL generation (`google.com/maps/dir/?api=1&destination=...`)
- `navigationLinks.ts` — Port navigation link logic from `TripDetailViewModel.swift`:
  - `buildNavigationToEvent`, `buildNavigationToHotel`, `buildNavigationToDeparture`
  - Coordinate extraction per event type
  - Priority: coordinates → address → name
- `useTripDetail.ts` — eventsByDay grouping, hotel lookup, back-to-hotel logic

### Phase 6: Itinerary List View
- Event row components (Flight, Hotel, Restaurant, Activity, CarRental)
- NavigationLinkRow (Google Maps link)
- ItineraryDaySection (day header, hotel banner, event rows, nav links)
- ItineraryListView (groups by day, toggle with calendar)

### Phase 7: Event Forms
- LocationSearchSection (reusable: search, dropdown, select, confirm, fallback)
- `locationService.ts` — Nominatim API for location search with city context
- FlightForm, HotelForm, RestaurantForm, ActivityForm, CarRentalForm
- All forms support create + edit modes

### Phase 8: Flight API Integration
- `api/flights/route.ts` — Server-side proxy to AeroDataBox
- `flightService.ts` — Client-side caller + `populateFlightEvent` mapping
- FlightForm search integration

### Phase 9: Flight Detail Page
- Route card, airport cards, status badge, map links, refresh button

### Phase 10: Calendar View
- Google Calendar-style grid with horizontal + vertical scroll
- Time labels (left column), day columns (one per trip date)
- Hotel banners at top (supports overlapping hotels)
- Time-positioned event blocks with colored borders
- Navigation links inside event blocks
- CSS: absolute positioning, `-webkit-overflow-scrolling: touch`

### Phase 11: PWA & Polish
- Manifest with icons, standalone display, theme color
- Service worker via next-pwa (caches app shell)
- Apple-specific meta tags (apple-mobile-web-app-capable, status bar style)
- Safe area insets for notch (`env(safe-area-inset-top)`)
- `touch-action: manipulation` to eliminate 300ms tap delay
- Offline handling (app works offline, API calls show appropriate errors)
- Loading states, error boundaries

## Key Porting Decisions
| iOS | Web |
|-----|-----|
| SwiftData with class inheritance | Dexie.js with discriminated unions |
| `@Observable` ViewModels | React hooks + Zustand |
| MKLocalSearch | Nominatim (OpenStreetMap) |
| Apple Maps URLs | Google Maps URLs |
| `MinuteIntervalDatePicker` (UIKit) | Native `<input type="time" step="900">` + DurationPicker select |
| SF Symbols | lucide-react icons |
| SwiftUI NavigationStack | Next.js App Router |
| Sheet presentation | Dialog/Modal component |

## Verification
1. Create a trip with cities, verify it persists after page reload (IndexedDB)
2. Add each event type, verify forms save correctly
3. Search a flight number, verify API proxy works and populates fields
4. Use "Find Location" on hotel/restaurant/activity, verify Nominatim results
5. Check list view: events grouped by day, hotel banners, navigation links
6. Check calendar view: time-positioned events, hotel banners, scrolling
7. Tap event to edit, verify form pre-fills correctly
8. Delete events and trips, verify cascade deletion
9. Add to Home Screen on iPhone Safari, verify standalone mode works
10. Test offline: app loads, data accessible, API calls show errors gracefully
