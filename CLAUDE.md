# TravelPlanner

## Rules
- **Always update this CLAUDE.md file immediately after making any changes** to reflect the current state of the codebase. This includes bug fixes, new features, refactoring, or any other code changes.
- **Do NOT commit and push changes until explicitly asked** by the user.
- **Do NOT build the project unless explicitly asked** by the user. Just make the code changes and inform the user when complete.

## Project Overview
TravelPlanner is a cross-platform travel planning app with both iOS and web (PWA) versions. Allows users to create trip itineraries with flights, car rentals, hotels, restaurants, and activities. Features automatic navigation links between consecutive events, day-level hotel header with navigation to first event, calendar view with hotels on all covered dates, tap-to-edit, and location finding with city-based biasing.

### iOS Version
Built with SwiftUI targeting iOS 26. Uses SwiftData with class inheritance, Apple Maps navigation, and MKLocalSearch for location finding.

### Web Version (Progressive Web App)
Built with Next.js 14, React, TypeScript, and Tailwind CSS. Can be installed on iPhone (Add to Home Screen) and works offline. Uses IndexedDB via Dexie.js for data persistence, Google Maps for navigation, and Nominatim (OpenStreetMap) for location search. See [Web App Implementation](#web-app-implementation) below for details.

## Tech Stack
- **Language**: Swift
- **UI**: SwiftUI
- **Persistence**: SwiftData (with class inheritance for event types - iOS 26 feature)
- **Architecture**: MVVM + Services
- **Min Target**: iOS 26
- **Flight API**: AeroDataBox via RapidAPI
- **Maps**: Apple Maps (via `maps.apple.com` URLs and MapKit)
- **Location Search**: Apple MKLocalSearch (MapKit) for POI/business searches with trip city region bias

## Project Structure
```
TravelPlanner/
├── App/                    # App entry point, ContentView
├── Models/                 # SwiftData models (Trip, TripEvent + subclasses)
├── ViewModels/             # @Observable view models
├── Views/
│   ├── Trips/              # Trip list, creation
│   ├── Itinerary/          # Itinerary day view, event rows, calendar view, flight detail
│   ├── EventForms/         # Add/edit event forms (flight, car, hotel, restaurant, activity)
│   └── Components/         # Reusable UI components (MinuteIntervalDatePicker, etc.)
├── Services/               # FlightAPI, GoogleMaps, Location services
├── Networking/             # APIClient, error types, Codable models
└── Utilities/              # Constants, date formatters, Secrets (gitignored)
```

## Key Architecture Decisions
- **SwiftData inheritance**: `TripEvent` is the base `@Model` class. `FlightEvent`, `CarRentalEvent`, `HotelEvent`, `RestaurantEvent`, `ActivityEvent` are subclasses. All must be registered in `modelContainer(for:)`.
- **Google Maps deep links**: Uses `comgooglemaps://` URL scheme directly to open in Google Maps app. iOS handles fallback if app is not installed. URL query values encoded with a custom character set that excludes `&`, `=`, `+`, `#` to prevent parameter corruption.
- **Navigation links**: Auto-generated between consecutive events by extracting end-coordinates from event N and start-coordinates from event N+1 (e.g., flight arrival airport → hotel location). Uses specialized methods for mixed-mode scenarios: `directionsURL` (both coords), `directionsURLFromNameToCoords` (name to coords), `directionsURLFromCoordsToName` (coords to name), and `directionsURLByName` (both names). Hotel-to-hotel links are skipped.
- **Day hotel header**: Each day in the list view shows the active hotel at the top of the section (via `DayHotelInfo`), with a navigation link from the hotel to the first non-hotel event of the day. The hotel header is NOT shown on the check-in date (the hotel event appears in chronological order like other events), but IS shown on subsequent dates including check-out date. No per-event "from/to hotel" links — hotel navigation is handled at the day level only.
- **Coordinates**: Stored as separate `Double?` fields (not `CLLocationCoordinate2D`) for SwiftData compatibility.
- **Location finding**: Hotel, restaurant, and activity forms include a "Find Location" button that searches using `MKLocalSearch` (MapKit) with region bias toward trip cities. Returns multiple results as a dropdown for user selection. Auto-selects if only one result. Falls back to a "Search on Google Maps" link on failure.
- **Trip cities**: Stored as `citiesRaw` (pipe-delimited string) with computed `cities: [String]` property. Used as search context for location finding across all event forms. Displayed under trip in the trip list.
- **Unified form views**: `HotelFormView`, `RestaurantFormView`, and `ActivityFormView` support both create and edit modes via optional `existingEvent` parameter. `EditEventView` delegates to these unified forms.
- **Duration-based event times**: Restaurant and activity forms use start time + duration picker (15-minute increments) instead of separate end time pickers.
- **Secrets management**: API key stored in `Utilities/Secrets.swift` (gitignored). Developers must create this file manually.

## API Configuration
- Actual RapidAPI key goes in `Utilities/Secrets.swift` → `Secrets.rapidAPIKey` (gitignored)
- Create `Secrets.swift` with: `enum Secrets { static let rapidAPIKey = "YOUR_KEY" }`
- `Constants.swift` references `Secrets.rapidAPIKey`
- Free tier: ~300 calls/month on AeroDataBox

## Important Patterns
- All view models use `@Observable` macro (but NOT plain services like `FlightAPIService`)
- Models use default values for all stored properties (SwiftData requirement)
- Subclass models need `required init()` for SwiftData
- Date formatting uses shared `DateFormatter` statics in `DateFormatters.swift`
- Event form dates default to `trip.startDate` (not today)
- `ItineraryItem.id` derives from `event.id` (not a new UUID) to avoid memory issues
- Location search uses `LocationService.searchPlaces(query:cities:)` with `MKLocalSearch` and city-based region bias, returning multiple candidates for user selection
- `EventFormViewModel` manages search results (`searchResults`, `selectedResult`) and applies chosen location to event models via `applyToHotel/Restaurant/Activity`
- Navigation uses Apple Maps via `maps.apple.com` URLs. Prioritizes coordinates (most reliable) → address (fallback) → name (last resort). All navigation opens in Apple Maps app with directions from user's current location.
- On edit, forms only re-geocode if no coordinates exist yet (prevents overwriting saved location data)
- Hotel-to-hotel navigation links are skipped; flight events don't show hotel direction links
- `DayHotelInfo` struct holds per-day hotel info and optional navigation link to first event; passed to `ItineraryDaySection` via `dayHotel` parameter
- `ItineraryItem` struct now includes both `navigationLink` (to next event) and `navigationToHotel` (back to day's hotel) properties
- `eventsByDay(for:)` returns tuples of `(date, items, dayHotel)` — used by list view. Excludes check-in date from dayHotel (hotel appears as a regular event in chronological order on check-in day)
- `itineraryItems(for:)` returns flat list of `ItineraryItem` with both forward and back-to-hotel navigation — used by calendar view which groups by day internally and iterates all trip dates
- `buildNavigationLink(from:to:)` is a public method in `TripDetailViewModel` that creates navigation links between any two events — reused by both list and calendar views
- `findHotelsForDay(_:in:)` returns all hotels active on a given date (including check-out date), with the latest hotel (by check-in date) selected for back-to-hotel navigation
- Time pickers use `MinuteIntervalDatePicker` component which wraps UIKit's `UIDatePicker` with `minuteInterval = 15` for 15-minute increments. The picker is collapsible - shows compact time display by default and expands to full picker wheels on tap, saving vertical space in forms.

## Event Types
| Type | Key Fields | Geocoding |
|------|-----------|-----------|
| Flight | Flight number, airports, terminals, gates, status | Airport coords from AeroDataBox API |
| Car Rental | Pickup/return locations, airport codes, rental company | CLGeocoder (pickup & return separately) |
| Hotel | Hotel name, check-in/out dates, address | MKLocalSearch multi-city + dropdown picker |
| Restaurant | Restaurant name, party size, start time + duration | MKLocalSearch multi-city + dropdown picker |
| Activity | Title, location name, description, start time + duration | MKLocalSearch multi-city + dropdown picker |

## Views
- **List view**: Events grouped by day (only days with events), sorted by time. Each day shows the active hotel at the top (except check-in date where the hotel appears as a regular event) with navigation to the hotel from user's current location. Non-hotel events show navigation from user's current location to the event. Flight events include navigation to the departure airport at the top. The last non-hotel event of each day includes a "Back to hotel" navigation link.
- **Calendar view**: Google Calendar-style with a single `ScrollView([.horizontal, .vertical])` so all day columns scroll together. Shows all dates in the trip range (`trip.startDate` through `trip.endDate`). Time labels with AM/PM on the left. Hotel banners appear on all dates they cover including both check-in and check-out dates via `findHotels(for:)`, with support for overlapping hotels (multiple rows) when switching hotels on a date. Hotel banners include navigation to the hotel from user's current location. Non-hotel events are time-positioned blocks with navigation from user's current location to the event. Flight events include navigation to the departure airport. The last non-hotel event of each day includes a "Back to hotel" navigation link.
- **Tap-to-edit**: Tapping a flight → FlightDetailView; tapping other events → edit sheet; tapping hotel banner in calendar → hotel edit sheet
- **Flight detail**: Full scrollable view with route card, airport cards, map links
- **Trip list**: Shows trip name, destination, cities, date range, and event count

## Build & Run
1. Open `TravelPlanner.xcodeproj` in Xcode
2. Add all Swift files to the Xcode project target if not auto-detected
3. Set deployment target to iOS 26
4. Create `Utilities/Secrets.swift` with `enum Secrets { static let rapidAPIKey = "YOUR_KEY" }`
5. Build and run on iOS 26 simulator or device

## GitHub
- Repository: https://github.com/kenyangzq/TravelPlanner
- `Secrets.swift` is gitignored — each developer must create their own

---

## Web App Implementation

### Tech Stack
- **Framework**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Data**: IndexedDB via Dexie.js (browser-only, no server DB)
- **Flight API**: AeroDataBox via RapidAPI (proxied through Next.js API routes)
- **Maps**: Google Maps URLs (`google.com/maps/dir/?api=1&destination=...`)
- **Location Search**: Nominatim API (OpenStreetMap, free, no API key required)
- **PWA**: `@ducanh2912/next-pwa` for service worker + manifest
- **State**: Zustand for UI state (modals, editing); Dexie `useLiveQuery` for data
- **Icons**: lucide-react
- **Dates**: date-fns
- **Utilities**: clsx, class-variance-authority (for UI components)

### Project Structure (Web)
```
TravelPlanner-Web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout, PWA metadata
│   │   ├── page.tsx                      # Trip list (home)
│   │   ├── manifest.ts                   # PWA manifest
│   │   ├── trips/
│   │   │   └── [tripId]/
│   │   │       ├── page.tsx              # Itinerary (list + calendar toggle)
│   │   │       └── flights/
│   │   │           └── [eventId]/
│   │   │               └── page.tsx      # Flight detail
│   │   └── api/
│   │       └── flights/
│   │           └── route.ts              # AeroDataBox proxy
│   ├── components/
│   │   ├── trips/                        # Trip list and creation
│   │   ├── itinerary/                    # List and calendar views
│   │   ├── forms/                        # Event forms (flight, hotel, etc.)
│   │   └── ui/                           # Shared UI components
│   ├── lib/
│   │   ├── db.ts                         # Dexie database schema
│   │   ├── models.ts                     # TypeScript interfaces
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── services/                     # Maps, flight, location services
│   │   ├── store.ts                      # Zustand UI state store
│   │   └── utils/                        # Date formatters, navigation logic
│   └── app/globals.css                   # Tailwind + custom styles
├── public/
│   └── icons/                            # PWA icons
├── package.json
├── next.config.js                        # PWA config
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                            # RAPIDAPI_KEY
```

### Key Architecture Decisions (Web)
- **Discriminated unions**: Unlike iOS class inheritance, web uses TypeScript discriminated unions with `eventType` field to differentiate event types
- **IndexedDB persistence**: All data stored locally in browser via Dexie.js, no server database required
- **State separation**: Data state (Dexie) separate from UI state (Zustand) - mirrors iOS SwiftData + @Observable pattern
- **City-biased location search**: Nominatim API with viewbox bounding box around trip cities for better results (~50km radius)
- **Rate limiting**: Location search limited to 1 request per second (Nominatim policy)
- **PWA installation**: Can be installed on iPhone via "Add to Home Screen" in Safari, runs in standalone mode
- **Safe area handling**: CSS `env(safe-area-inset-*)` for iPhone notch/home indicator support

### API Configuration (Web)
- RapidAPI key stored in `.env.local` → `RAPIDAPI_KEY` (gitignored)
- Proxied through Next.js API route (`/api/flights`) to hide key from client
- Free tier: ~300 calls/month on AeroDataBox

### Build & Run (Web)
```bash
cd TravelPlanner-Web
npm install
npm run dev          # Start development server at http://localhost:3000
npm run build        # Production build
npm start           # Start production server
```

### Deployment
See `TravelPlanner-Web/DEPLOYMENT.md` for comprehensive Azure deployment guide, including:
- Azure Static Web Apps deployment (recommended - free tier)
- PWA installation on iPhone
- Troubleshooting common issues
- Monitoring and maintenance

### Key Differences from iOS
| iOS | Web |
|-----|-----|
| SwiftData with class inheritance | Dexie.js (IndexedDB) with discriminated unions |
| `@Observable` ViewModels | React hooks + Zustand for UI state |
| MKLocalSearch (MapKit) | Nominatim (OpenStreetMap) - free, no API key |
| Apple Maps URLs (`maps.apple.com`) | Google Maps URLs (`google.com/maps/dir/`) |
| `MinuteIntervalDatePicker` (UIKit) | Native `<input type="time" step="900">` + custom DurationPicker |
| SF Symbols | lucide-react icons |
| SwiftUI NavigationStack | Next.js App Router |
| Sheet presentation | Dialog/Modal components |

### Web App Recent Changes
- **2026-02-15**: Complete PWA implementation - ported all iOS features to Next.js/React with TypeScript. Includes trip management, 5 event types, location search with city biasing, flight API integration, calendar view with time-positioned events, and PWA configuration for iPhone installation.
- **2026-02-15**: Improved location search with city-based bounding box biasing - now uses Nominatim viewbox parameter to prioritize results within ~50km of trip cities, with deduplication by coordinate proximity (~100m) and sorting by importance.
- **2026-02-15**: Fixed calendar view to display flight events with plane icons at actual time positions - events now show in correct time slots (6 AM - 11 PM) with color-coded backgrounds by event type and proper flight indicators.

## Recent Changes (iOS)
- **2026-02-15**: Created companion web app (PWA) version in TravelPlanner-Web/ directory with full feature parity to iOS app. See [Web App Implementation](#web-app-implementation) section above for details.
- **2025-02-08**: Switched from Google Maps to Apple Maps for navigation - much more reliable on iOS. Created `MapsService` with Apple Maps URL format (`maps.apple.com`). Updated all navigation to use Apple Maps. Coordinates are still prioritized over addresses for accuracy. Removed `comgooglemaps` URL scheme from build settings.
- **2025-02-08**: Improved time picker UX - made `MinuteIntervalDatePicker` collapsible. Shows compact time display by default and expands to full picker wheels on tap, saving vertical space in event forms. Picker uses UIKit's `UIDatePicker` with `minuteInterval = 15` for 15-minute increments.
- **2025-02-08**: Fixed Google Maps navigation links to open directly in the Google Maps app - removed `canOpenURL` checks and web URL fallbacks. All navigation now uses `comgooglemaps://` URL scheme directly, letting iOS handle the fallback if Google Maps is not installed.
- **2025-02-08**: Fixed hotel navigation link issue - added new mixed-mode URL generation methods `directionsURLFromNameToCoords` and `directionsURLFromCoordsToName` to `GoogleMapsService` for proper navigation when one event has coordinates and the other doesn't.
- **2025-02-08**: Added back-to-hotel navigation - last non-hotel event of each day now shows navigation link back to the day's hotel. If multiple hotels exist on the same day, uses the latest hotel (by check-in date). Updated `ItineraryItem` struct to include `navigationToHotel` property and modified both list and calendar views to display these links.
- **2025-02-08**: Fixed calendar view hotel banner to show on check-out date - changed `findHotels(for:)` comparison from `<` to `<=` for check-out date so hotel banners now appear on both check-in and check-out dates.
- **2025-02-08**: Updated rules to clarify that commits and pushes should only be done when explicitly asked by the user.
- **2025-02-08**: Fixed hotel map link button not clickable - removed `.contentShape(Rectangle())` and changed to `.simultaneousGesture` in `ItineraryDaySection` to allow map button taps while preserving tap-to-edit on row.
- **2025-02-08**: Fixed hotel-to-restaurant navigation links - calendar view now shows navigation links between events and from hotel banners to first event of each day. Made `buildNavigationLink` public in `TripDetailViewModel` and updated `CalendarItineraryView` to display navigation links.
