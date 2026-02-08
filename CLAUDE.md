# TravelPlanner

## Project Overview
iOS travel planning app built with SwiftUI targeting iOS 26. Allows users to create trip itineraries with flights, car rentals, hotels, restaurants, and activities. Features automatic Google Maps navigation links between consecutive events, calendar view, tap-to-edit, and location finding via geocoding with Google Maps integration.

## Tech Stack
- **Language**: Swift
- **UI**: SwiftUI
- **Persistence**: SwiftData (with class inheritance for event types - iOS 26 feature)
- **Architecture**: MVVM + Services
- **Min Target**: iOS 26
- **Flight API**: AeroDataBox via RapidAPI
- **Maps**: Google Maps deep links (no SDK)
- **Geocoding**: Apple CLGeocoder (with trip cities context for multi-result search)

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
│   └── Components/         # Reusable UI components
├── Services/               # FlightAPI, GoogleMaps, Location services
├── Networking/             # APIClient, error types, Codable models
└── Utilities/              # Constants, date formatters, Secrets (gitignored)
```

## Key Architecture Decisions
- **SwiftData inheritance**: `TripEvent` is the base `@Model` class. `FlightEvent`, `CarRentalEvent`, `HotelEvent`, `RestaurantEvent`, `ActivityEvent` are subclasses. All must be registered in `modelContainer(for:)`.
- **Google Maps deep links**: Uses `comgooglemaps://` URL scheme with `https://www.google.com/maps` fallback. No Maps SDK dependency.
- **Navigation links**: Auto-generated between consecutive events by extracting end-coordinates from event N and start-coordinates from event N+1 (e.g., flight arrival airport → hotel location). Falls back to name-based Google Maps directions when coordinates are unavailable.
- **Coordinates**: Stored as separate `Double?` fields (not `CLLocationCoordinate2D`) for SwiftData compatibility.
- **Location finding**: Hotel, restaurant, and activity forms include a "Find Location" button that searches across trip cities using CLGeocoder. Returns multiple results as a dropdown for user selection. Auto-selects if only one result. Falls back to a "Search on Google Maps" link on failure.
- **Trip cities**: Stored as `citiesRaw` (pipe-delimited string) with computed `cities: [String]` property. Used as search context for location finding across all event forms.
- **Unified form views**: `HotelFormView`, `RestaurantFormView`, and `ActivityFormView` support both create and edit modes via optional `existingEvent` parameter. `EditEventView` delegates to these unified forms.
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
- Google Maps URL scheme requires `LSApplicationQueriesSchemes` in Info.plist with `comgooglemaps` entry
- Event form dates default to `trip.startDate` (not today)
- `ItineraryItem.id` derives from `event.id` (not a new UUID) to avoid memory issues
- Location search uses `LocationService.searchPlaces(query:cities:)` to geocode across all trip cities, returning multiple candidates for user selection
- `EventFormViewModel` manages search results (`searchResults`, `selectedResult`) and applies chosen location to event models via `applyToHotel/Restaurant/Activity`
- Navigation links use coordinate-based directions when available, falling back to name-based directions via `GoogleMapsService.directionsURLByName()`

## Event Types
| Type | Key Fields | Geocoding |
|------|-----------|-----------|
| Flight | Flight number, airports, terminals, gates, status | Airport coords from AeroDataBox API |
| Car Rental | Pickup/return locations, airport codes, rental company | CLGeocoder (pickup & return separately) |
| Hotel | Hotel name, check-in/out dates, address | CLGeocoder multi-city search + dropdown picker |
| Restaurant | Restaurant name, cuisine, party size, reservation time | CLGeocoder multi-city search + dropdown picker |
| Activity | Title, location name, description | CLGeocoder multi-city search + dropdown picker |

## Views
- **List view**: Events grouped by day, sorted by time, with navigation links between consecutive events
- **Calendar view**: Google Calendar-style day columns with time-positioned event blocks
- **Tap-to-edit**: Tapping a flight → FlightDetailView; tapping other events → edit sheet
- **Flight detail**: Full scrollable view with route card, airport cards, map links

## Build & Run
1. Open `TravelPlanner.xcodeproj` in Xcode
2. Add all Swift files to the Xcode project target if not auto-detected
3. Set deployment target to iOS 26
4. Create `Utilities/Secrets.swift` with `enum Secrets { static let rapidAPIKey = "YOUR_KEY" }`
5. Add `comgooglemaps` to `LSApplicationQueriesSchemes` in Info.plist
6. Build and run on iOS 26 simulator or device

## GitHub
- Repository: https://github.com/kenyangzq/TravelPlanner
- `Secrets.swift` is gitignored — each developer must create their own
