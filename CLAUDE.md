# TravelPlanner

## Project Overview
iOS travel planning app built with SwiftUI targeting iOS 26. Allows users to create trip itineraries with flights, car rentals, hotels, restaurants, and activities. Features automatic Google Maps navigation links between consecutive events, calendar view, and tap-to-edit.

## Tech Stack
- **Language**: Swift
- **UI**: SwiftUI
- **Persistence**: SwiftData (with class inheritance for event types - iOS 26 feature)
- **Architecture**: MVVM + Services
- **Min Target**: iOS 26
- **Flight API**: AeroDataBox via RapidAPI
- **Maps**: Google Maps deep links (no SDK)
- **Geocoding**: Apple CLGeocoder

## Project Structure
```
TravelPlanner/
├── App/                    # App entry point, ContentView
├── Models/                 # SwiftData models (Trip, TripEvent + subclasses)
├── ViewModels/             # @Observable view models
├── Views/
│   ├── Trips/              # Trip list, creation
│   ├── Itinerary/          # Itinerary day view, event rows
│   ├── EventForms/         # Add/edit event forms (flight, car, hotel, restaurant, activity)
│   └── Components/         # Reusable UI components
├── Services/               # FlightAPI, GoogleMaps, Location services
├── Networking/             # APIClient, error types, Codable models
└── Utilities/              # Constants, date formatters
```

## Key Architecture Decisions
- **SwiftData inheritance**: `TripEvent` is the base `@Model` class. `FlightEvent`, `CarRentalEvent`, `HotelEvent`, `RestaurantEvent`, `ActivityEvent` are subclasses. All must be registered in `modelContainer(for:)`.
- **Google Maps deep links**: Uses `comgooglemaps://` URL scheme with `https://www.google.com/maps` fallback. No Maps SDK dependency.
- **Navigation links**: Auto-generated between consecutive events by extracting end-coordinates from event N and start-coordinates from event N+1 (e.g., flight arrival airport → hotel location).
- **Coordinates**: Stored as separate `Double?` fields (not `CLLocationCoordinate2D`) for SwiftData compatibility.

## API Configuration
- RapidAPI key goes in `Utilities/Constants.swift` → `Constants.API.rapidAPIKey`
- The key must be replaced from `YOUR_RAPIDAPI_KEY_HERE` before flight search will work
- Free tier: ~300 calls/month on AeroDataBox

## Important Patterns
- All view models use `@Observable` macro
- Models use default values for all stored properties (SwiftData requirement)
- Subclass models need `required init()` for SwiftData
- Date formatting uses shared `DateFormatter` statics in `DateFormatters.swift`
- Google Maps URL scheme requires `LSApplicationQueriesSchemes` in Info.plist with `comgooglemaps` entry

## Build & Run
1. Open `TravelPlanner.xcodeproj` in Xcode
2. Add all Swift files to the Xcode project target if not auto-detected
3. Set deployment target to iOS 26
4. Replace API key in `Constants.swift`
5. Add `comgooglemaps` to `LSApplicationQueriesSchemes` in Info.plist
6. Build and run on iOS 26 simulator or device
