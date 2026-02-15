import Foundation
import SwiftData

struct EventNavigationLink {
    let destinationLabel: String
    let directionsURL: URL?
}

struct DayHotelInfo {
    let hotel: HotelEvent
    let navigationToHotel: EventNavigationLink?
}

struct ItineraryItem: Identifiable {
    var id: UUID { event.id }
    let event: TripEvent
    let navigationToEvent: EventNavigationLink?
    let navigationToHotel: EventNavigationLink?
    let navigationToDeparture: EventNavigationLink? // For flights - nav to departure airport
}

@Observable
final class TripDetailViewModel {
    var showingAddEvent = false
    var editingEvent: TripEvent?
    var selectedEventType: EventType = .flight

    enum EventType: String, CaseIterable, Identifiable {
        case flight = "Flight"
        case carRental = "Car Rental"
        case hotel = "Hotel"
        case restaurant = "Restaurant"
        case activity = "Activity"

        var id: String { rawValue }

        var icon: String {
            switch self {
            case .flight: return "airplane"
            case .carRental: return "car.fill"
            case .hotel: return "building.2.fill"
            case .restaurant: return "fork.knife"
            case .activity: return "star.fill"
            }
        }
    }

    func itineraryItems(for trip: Trip) -> [ItineraryItem] {
        let sorted = trip.sortedEvents
        let hotels = trip.sortedEvents.compactMap { $0 as? HotelEvent }
        var items: [ItineraryItem] = []

        // Group events by day for back-to-hotel navigation
        let eventsByDay = Dictionary(grouping: sorted) { $0.startDate.startOfDay }

        for (index, event) in sorted.enumerated() {
            var navToEvent: EventNavigationLink? = nil
            var navToHotel: EventNavigationLink? = nil
            var navToDeparture: EventNavigationLink? = nil

            // Navigation to event (from user's current location)
            if !(event is HotelEvent) {
                navToEvent = buildNavigationToEvent(event)
            }

            // For flights: add navigation to departure airport
            if let flight = event as? FlightEvent {
                navToDeparture = buildNavigationToDeparture(flight)
            }

            // Add back-to-hotel navigation for last non-hotel event of each day
            if !(event is HotelEvent) {
                let eventDay = event.startDate.startOfDay
                let dayEvents = eventsByDay[eventDay] ?? []

                // Check if the next event is a hotel on the same day
                let nextEventIsHotelOnSameDay = index < sorted.count - 1 &&
                    sorted[index + 1] is HotelEvent &&
                    sorted[index + 1].startDate.startOfDay == eventDay

                // Check if this is the last non-hotel event of the day
                let nonHotelEvents = dayEvents.filter { !($0 is HotelEvent) }
                if let lastEvent = nonHotelEvents.last,
                    lastEvent.id == event.id,
                    !nextEventIsHotelOnSameDay {
                    // Find the latest hotel for this day
                    let dayHotels = findHotelsForDay(eventDay, in: hotels)
                    if let latestHotel = dayHotels.max(by: { $0.checkInDate < $1.checkInDate }) {
                        navToHotel = buildNavigationToHotel(latestHotel)
                    }
                }
            }

            items.append(ItineraryItem(
                event: event,
                navigationToEvent: navToEvent,
                navigationToHotel: navToHotel,
                navigationToDeparture: navToDeparture
            ))
        }

        return items
    }

    func eventsByDay(for trip: Trip) -> [(date: Date, items: [ItineraryItem], dayHotel: DayHotelInfo?)] {
        let allItems = itineraryItems(for: trip)
        let hotels = trip.sortedEvents.compactMap { $0 as? HotelEvent }

        let grouped = Dictionary(grouping: allItems) {
            $0.event.startDate.startOfDay
        }

        return grouped
            .sorted { $0.key < $1.key }
            .map { entry in
                let date = entry.key
                let items = entry.value

                // Find hotel covering this day, but skip if this is the check-in date
                let dayHotel: DayHotelInfo?
                if let hotel = findHotel(for: date, in: hotels),
                   date.startOfDay != hotel.checkInDate.startOfDay {
                    // Add navigation to hotel from user's current location
                    dayHotel = DayHotelInfo(hotel: hotel, navigationToHotel: buildNavigationToHotel(hotel))
                } else {
                    dayHotel = nil
                }

                return (date: date, items: items, dayHotel: dayHotel)
            }
    }

    func deleteEvent(_ event: TripEvent, from modelContext: ModelContext) {
        modelContext.delete(event)
        try? modelContext.save()
    }

    // MARK: - Navigation Link Generation

    /// Build navigation link to an event from user's current location
    func buildNavigationToEvent(_ event: TripEvent) -> EventNavigationLink? {
        let locationName = extractStartLocationName(from: event)
        let address = extractStartAddress(from: event)
        let coord = extractStartCoordinate(from: event)

        print("🗺️ Navigation Debug:")
        print("   Event: \(locationName)")
        print("   Address: '\(address)'")
        print("   Coordinates: \(coord?.lat ?? 0), \(coord?.lng ?? 0)")

        guard !locationName.isEmpty || !address.isEmpty || coord != nil else { return nil }

        // Prioritize coordinates (most reliable), then address (fallback), then name (last resort)
        let url: URL?
        if let coord {
            print("   Using coordinates: \(coord.lat), \(coord.lng)")
            url = MapsService.directionsURLFromCurrentLocation(toLat: coord.lat, toLng: coord.lng)
        } else if !address.isEmpty {
            print("   Using address: '\(address)'")
            url = MapsService.directionsURLFromCurrentLocation(to: address)
        } else if !locationName.isEmpty {
            print("   Using location name: '\(locationName)'")
            url = MapsService.directionsURLFromCurrentLocation(to: locationName)
        } else {
            url = nil
        }

        guard let url else { return nil }

        print("   Final URL: \(url.absoluteString)")

        let label = extractStartLabel(from: event)
        return EventNavigationLink(destinationLabel: label, directionsURL: url)
    }

    /// Build navigation link to a hotel from user's current location
    func buildNavigationToHotel(_ hotel: HotelEvent) -> EventNavigationLink? {
        let locationName = hotel.hotelName
        let address = hotel.hotelAddress
        let coord: (lat: Double, lng: Double)?
        if let lat = hotel.hotelLatitude, let lng = hotel.hotelLongitude {
            coord = (lat, lng)
        } else {
            coord = nil
        }

        print("🏨 Hotel Navigation Debug:")
        print("   Hotel: \(locationName)")
        print("   Address: '\(address)'")
        print("   Coordinates: \(coord?.lat ?? 0), \(coord?.lng ?? 0)")

        guard !locationName.isEmpty || !address.isEmpty || coord != nil else { return nil }

        // Prioritize coordinates (most reliable), then address (fallback), then name (last resort)
        let url: URL?
        if let coord {
            print("   Using coordinates: \(coord.lat), \(coord.lng)")
            url = MapsService.directionsURLFromCurrentLocation(toLat: coord.lat, toLng: coord.lng)
        } else if !address.isEmpty {
            print("   Using address: '\(address)'")
            url = MapsService.directionsURLFromCurrentLocation(to: address)
        } else if !locationName.isEmpty {
            print("   Using location name: '\(locationName)'")
            url = MapsService.directionsURLFromCurrentLocation(to: locationName)
        } else {
            url = nil
        }

        guard let url else { return nil }

        print("   Final URL: \(url.absoluteString)")

        let label = locationName.isEmpty ? "Hotel" : locationName
        return EventNavigationLink(destinationLabel: label, directionsURL: url)
    }

    /// Build navigation link to departure airport for a flight
    func buildNavigationToDeparture(_ flight: FlightEvent) -> EventNavigationLink? {
        let locationName = flight.departureAirportName.isEmpty ? flight.departureAirportIATA : flight.departureAirportName
        let coord: (lat: Double, lng: Double)?
        if let lat = flight.departureLatitude, let lng = flight.departureLongitude {
            coord = (lat, lng)
        } else {
            coord = nil
        }

        guard !locationName.isEmpty || coord != nil else { return nil }

        // Prefer coordinates (most precise), then airport name
        let url: URL?
        if let coord {
            url = MapsService.directionsURLFromCurrentLocation(toLat: coord.lat, toLng: coord.lng)
        } else if !locationName.isEmpty {
            url = MapsService.directionsURLFromCurrentLocation(to: locationName)
        } else {
            url = nil
        }

        guard let url else { return nil }

        let label = locationName.isEmpty ? "Departure Airport" : locationName
        return EventNavigationLink(destinationLabel: label, directionsURL: url)
    }

    private func extractEndCoordinate(from event: TripEvent) -> (lat: Double, lng: Double)? {
        switch event {
        case let flight as FlightEvent:
            if let lat = flight.arrivalLatitude, let lng = flight.arrivalLongitude {
                return (lat, lng)
            }
        case let car as CarRentalEvent:
            if let lat = car.returnLatitude, let lng = car.returnLongitude {
                return (lat, lng)
            }
        case let hotel as HotelEvent:
            if let lat = hotel.hotelLatitude, let lng = hotel.hotelLongitude {
                return (lat, lng)
            }
        case let restaurant as RestaurantEvent:
            if let lat = restaurant.restaurantLatitude, let lng = restaurant.restaurantLongitude {
                return (lat, lng)
            }
        case let activity as ActivityEvent:
            if let lat = activity.activityLatitude, let lng = activity.activityLongitude {
                return (lat, lng)
            }
        default:
            if let lat = event.latitude, let lng = event.longitude {
                return (lat, lng)
            }
        }
        return nil
    }

    private func extractStartCoordinate(from event: TripEvent) -> (lat: Double, lng: Double)? {
        switch event {
        case let flight as FlightEvent:
            if let lat = flight.departureLatitude, let lng = flight.departureLongitude {
                return (lat, lng)
            }
        case let car as CarRentalEvent:
            if let lat = car.pickupLatitude, let lng = car.pickupLongitude {
                return (lat, lng)
            }
        case let hotel as HotelEvent:
            if let lat = hotel.hotelLatitude, let lng = hotel.hotelLongitude {
                return (lat, lng)
            }
        case let restaurant as RestaurantEvent:
            if let lat = restaurant.restaurantLatitude, let lng = restaurant.restaurantLongitude {
                return (lat, lng)
            }
        case let activity as ActivityEvent:
            if let lat = activity.activityLatitude, let lng = activity.activityLongitude {
                return (lat, lng)
            }
        default:
            if let lat = event.latitude, let lng = event.longitude {
                return (lat, lng)
            }
        }
        return nil
    }

    private func extractEndLocationName(from event: TripEvent) -> String {
        switch event {
        case let flight as FlightEvent:
            if !flight.arrivalAirportName.isEmpty { return flight.arrivalAirportName }
            if !flight.arrivalAirportIATA.isEmpty { return "\(flight.arrivalAirportIATA) airport" }
            return ""
        case let car as CarRentalEvent:
            return car.returnLocationName
        case let hotel as HotelEvent:
            return hotel.hotelName
        case let restaurant as RestaurantEvent:
            return restaurant.restaurantName
        case let activity as ActivityEvent:
            return activity.activityLocationName
        default:
            return event.locationName.isEmpty ? event.title : event.locationName
        }
    }

    private func extractStartLocationName(from event: TripEvent) -> String {
        switch event {
        case let flight as FlightEvent:
            if !flight.departureAirportName.isEmpty { return flight.departureAirportName }
            if !flight.departureAirportIATA.isEmpty { return "\(flight.departureAirportIATA) airport" }
            return ""
        case let car as CarRentalEvent:
            return car.pickupLocationName
        case let hotel as HotelEvent:
            return hotel.hotelName
        case let restaurant as RestaurantEvent:
            return restaurant.restaurantName
        case let activity as ActivityEvent:
            return activity.activityLocationName
        default:
            return event.locationName.isEmpty ? event.title : event.locationName
        }
    }

    private func extractStartAddress(from event: TripEvent) -> String {
        switch event {
        case let hotel as HotelEvent:
            return hotel.hotelAddress
        case let restaurant as RestaurantEvent:
            return restaurant.restaurantAddress
        case let activity as ActivityEvent:
            return "" // ActivityEvent doesn't have a separate address field
        case let car as CarRentalEvent:
            return car.pickupLocationName // CarRentalEvent uses pickupLocationName, not pickupAddress
        default:
            return ""
        }
    }

    private func extractEndLabel(from event: TripEvent) -> String {
        switch event {
        case let flight as FlightEvent:
            return flight.arrivalAirportIATA.isEmpty ? "Arrival" : flight.arrivalAirportIATA
        case let car as CarRentalEvent:
            return car.returnLocationName.isEmpty ? "Car Return" : car.returnLocationName
        case let hotel as HotelEvent:
            return hotel.hotelName.isEmpty ? "Hotel" : hotel.hotelName
        case let restaurant as RestaurantEvent:
            return restaurant.restaurantName.isEmpty ? "Restaurant" : restaurant.restaurantName
        case let activity as ActivityEvent:
            return activity.activityLocationName.isEmpty ? event.title : activity.activityLocationName
        default:
            return event.locationName.isEmpty ? event.title : event.locationName
        }
    }

    private func extractStartLabel(from event: TripEvent) -> String {
        switch event {
        case let flight as FlightEvent:
            return flight.departureAirportIATA.isEmpty ? "Departure" : flight.departureAirportIATA
        case let car as CarRentalEvent:
            return car.pickupLocationName.isEmpty ? "Car Pickup" : car.pickupLocationName
        case let hotel as HotelEvent:
            return hotel.hotelName.isEmpty ? "Hotel" : hotel.hotelName
        case let restaurant as RestaurantEvent:
            return restaurant.restaurantName.isEmpty ? "Restaurant" : restaurant.restaurantName
        case let activity as ActivityEvent:
            return activity.activityLocationName.isEmpty ? event.title : activity.activityLocationName
        default:
            return event.locationName.isEmpty ? event.title : event.locationName
        }
    }

    // MARK: - Hotel Lookup

    /// Find the hotel that covers a given date (check-in <= date < check-out).
    /// Note: The check-in date is excluded from day header display in eventsByDay.
    private func findHotel(for date: Date, in hotels: [HotelEvent]) -> HotelEvent? {
        hotels.first { hotel in
            let day = date.startOfDay
            return hotel.checkInDate.startOfDay <= day && day < hotel.checkOutDate.startOfDay
        }
    }

    /// Find all hotels that cover a given date (check-in <= date <= check-out).
    private func findHotelsForDay(_ date: Date, in hotels: [HotelEvent]) -> [HotelEvent] {
        let day = date.startOfDay
        return hotels.filter { hotel in
            hotel.checkInDate.startOfDay <= day && day <= hotel.checkOutDate.startOfDay
        }
    }
}
