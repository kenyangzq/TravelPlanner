# TravelPlanner

## Project Overview
iOS travel planning app built with SwiftUI targeting iOS 26. Allows users to create trip itineraries with flights, car rentals, hotels, restaurants, and activities. Features automatic Google Maps navigation links between consecutive events, hotel-to/from directions on each event, calendar view with hotel as day-level attribute, tap-to-edit, and location finding via MKLocalSearch with Google Maps integration.

## Tech Stack
- **Language**: Swift
- **UI**: SwiftUI
- **Persistence**: SwiftData (with class inheritance for event types - iOS 26 feature)
- **Architecture**: MVVM + Services
- **Min Target**: iOS 26
- **Flight API**: AeroDataBox via RapidAPI
- **Maps**: Google Maps deep links (no SDK)
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
│   └── Components/         # Reusable UI components
├── Services/               # FlightAPI, GoogleMaps, Location services
├── Networking/             # APIClient, error types, Codable models
└── Utilities/              # Constants, date formatters, Secrets (gitignored)
```

## Key Architecture Decisions
- **SwiftData inheritance**: `TripEvent` is the base `@Model` class. `FlightEvent`, `CarRentalEvent`, `HotelEvent`, `RestaurantEvent`, `ActivityEvent` are subclasses. All must be registered in `modelContainer(for:)`.
- **Google Maps deep links**: Uses `comgooglemaps://` URL scheme with `https://www.google.com/maps` fallback. No Maps SDK dependency.
- **Navigation links**: Auto-generated between consecutive events by extracting end-coordinates from event N and start-coordinates from event N+1 (e.g., flight arrival airport → hotel location). Falls back to mixed-mode (coords + name) or name-based Google Maps directions when one or both sides lack coordinates. Hotel-to-hotel links are skipped.
- **Hotel directions**: Each non-hotel, non-flight event shows "From Hotel" and "Back to Hotel" direction links when an active hotel exists for that day. Hotel matching uses check-in/check-out date range.
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
- Google Maps URL scheme requires `LSApplicationQueriesSchemes` in Info.plist with `comgooglemaps` entry
- Event form dates default to `trip.startDate` (not today)
- `ItineraryItem.id` derives from `event.id` (not a new UUID) to avoid memory issues
- Location search uses `LocationService.searchPlaces(query:cities:)` with `MKLocalSearch` and city-based region bias, returning multiple candidates for user selection
- `EventFormViewModel` manages search results (`searchResults`, `selectedResult`) and applies chosen location to event models via `applyToHotel/Restaurant/Activity`
- Navigation links use coordinate-based directions when available, mixed-mode (coords as origin/destination string) when one side has coords, falling back to fully name-based directions via `GoogleMapsService.directionsURLByName()`
- On edit, forms only re-geocode if no coordinates exist yet (prevents overwriting saved location data)
- `HotelDirectionsLink` provides to/from hotel navigation for non-hotel events based on active hotel for that day
- Hotel-to-hotel navigation links are skipped; flight events don't show hotel direction links

## Event Types
| Type | Key Fields | Geocoding |
|------|-----------|-----------|
| Flight | Flight number, airports, terminals, gates, status | Airport coords from AeroDataBox API |
| Car Rental | Pickup/return locations, airport codes, rental company | CLGeocoder (pickup & return separately) |
| Hotel | Hotel name, check-in/out dates, address | MKLocalSearch multi-city + dropdown picker |
| Restaurant | Restaurant name, party size, start time + duration | MKLocalSearch multi-city + dropdown picker |
| Activity | Title, location name, description, start time + duration | MKLocalSearch multi-city + dropdown picker |

## Views
- **List view**: Events grouped by day, sorted by time, with navigation links between consecutive events and hotel direction links per event
- **Calendar view**: Google Calendar-style day columns with hotel as day-level banner (not time-positioned block), other events as time-positioned blocks
- **Tap-to-edit**: Tapping a flight → FlightDetailView; tapping other events → edit sheet; tapping hotel banner in calendar → hotel edit sheet
- **Flight detail**: Full scrollable view with route card, airport cards, map links
- **Trip list**: Shows trip name, destination, cities, date range, and event count

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
