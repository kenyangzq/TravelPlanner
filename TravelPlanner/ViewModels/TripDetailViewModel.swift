import Foundation
import SwiftData

struct EventNavigationLink {
    let fromEvent: TripEvent
    let toEvent: TripEvent
    let fromLabel: String
    let toLabel: String
    let directionsURL: URL?
}

struct HotelDirectionsLink {
    let hotelName: String
    let toHotelURL: URL?
    let fromHotelURL: URL?
}

struct ItineraryItem: Identifiable {
    var id: UUID { event.id }
    let event: TripEvent
    let navigationLink: EventNavigationLink?
    let hotelLink: HotelDirectionsLink?
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
        var items: [ItineraryItem] = []

        // Collect all hotels for hotel link generation
        let hotels = sorted.compactMap { $0 as? HotelEvent }

        for (index, event) in sorted.enumerated() {
            var navLink: EventNavigationLink? = nil

            if index < sorted.count - 1 {
                let nextEvent = sorted[index + 1]
                navLink = buildNavigationLink(from: event, to: nextEvent)
            }

            // Build hotel directions link for non-hotel events
            let hotelLink: HotelDirectionsLink?
            if event is HotelEvent {
                hotelLink = nil
            } else {
                hotelLink = buildHotelLink(for: event, hotels: hotels)
            }

            items.append(ItineraryItem(event: event, navigationLink: navLink, hotelLink: hotelLink))
        }

        return items
    }

    func eventsByDay(for trip: Trip) -> [(date: Date, items: [ItineraryItem])] {
        let allItems = itineraryItems(for: trip)

        let grouped = Dictionary(grouping: allItems) {
            $0.event.startDate.startOfDay
        }

        return grouped
            .sorted { $0.key < $1.key }
            .map { (date: $0.key, items: $0.value) }
    }

    func deleteEvent(_ event: TripEvent, from modelContext: ModelContext) {
        modelContext.delete(event)
        try? modelContext.save()
    }

    // MARK: - Navigation Link Generation

    private func buildNavigationLink(from: TripEvent, to: TripEvent) -> EventNavigationLink? {
        // Skip navigation link between a hotel and itself (or two hotels)
        if from is HotelEvent && to is HotelEvent {
            return nil
        }

        let fromCoord = extractEndCoordinate(from: from)
        let toCoord = extractStartCoordinate(from: to)
        let fromLabel = extractEndLabel(from: from)
        let toLabel = extractStartLabel(from: to)
        let fromQuery = extractEndLocationName(from: from)
        let toQuery = extractStartLocationName(from: to)

        var url: URL? = nil

        if let fromCoord, let toCoord {
            // Both have coordinates — use coordinate-based directions
            url = GoogleMapsService.directionsURL(
                fromLat: fromCoord.lat, fromLng: fromCoord.lng,
                toLat: toCoord.lat, toLng: toCoord.lng
            )
        } else if let fromCoord, !toQuery.isEmpty {
            // Origin has coords, destination is name-based
            url = GoogleMapsService.directionsURLByName(
                origin: "\(fromCoord.lat),\(fromCoord.lng)",
                destination: toQuery
            )
        } else if !fromQuery.isEmpty, let toCoord {
            // Origin is name-based, destination has coords
            url = GoogleMapsService.directionsURLByName(
                origin: fromQuery,
                destination: "\(toCoord.lat),\(toCoord.lng)"
            )
        } else if !fromQuery.isEmpty && !toQuery.isEmpty {
            // Both name-based
            url = GoogleMapsService.directionsURLByName(origin: fromQuery, destination: toQuery)
        }

        // Only show link if we have a URL
        guard let url else { return nil }

        return EventNavigationLink(
            fromEvent: from,
            toEvent: to,
            fromLabel: fromLabel,
            toLabel: toLabel,
            directionsURL: url
        )
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

    // MARK: - Hotel Directions

    /// Find the hotel that covers a given date (check-in <= date < check-out).
    private func findHotel(for date: Date, in hotels: [HotelEvent]) -> HotelEvent? {
        hotels.first { hotel in
            let day = date.startOfDay
            return hotel.checkInDate.startOfDay <= day && day < hotel.checkOutDate.startOfDay
        }
    }

    /// Build directions links to/from the hotel for a non-hotel event.
    private func buildHotelLink(for event: TripEvent, hotels: [HotelEvent]) -> HotelDirectionsLink? {
        // Skip hotel links for flights — flights have their own airport navigation
        if event is FlightEvent { return nil }

        guard let hotel = findHotel(for: event.startDate, in: hotels) else { return nil }

        let hotelCoord: (lat: Double, lng: Double)?
        if let lat = hotel.hotelLatitude, let lng = hotel.hotelLongitude {
            hotelCoord = (lat, lng)
        } else {
            hotelCoord = nil
        }

        // Use the event's actual location coordinates
        let eventCoord = extractEndCoordinate(from: event)
        let hotelName = hotel.hotelName.isEmpty ? "Hotel" : hotel.hotelName
        let eventName = extractEndLocationName(from: event)

        var toHotelURL: URL?
        var fromHotelURL: URL?

        if let ec = eventCoord, let hc = hotelCoord {
            // Both have coordinates
            toHotelURL = GoogleMapsService.directionsURL(fromLat: ec.lat, fromLng: ec.lng, toLat: hc.lat, toLng: hc.lng)
            fromHotelURL = GoogleMapsService.directionsURL(fromLat: hc.lat, fromLng: hc.lng, toLat: ec.lat, toLng: ec.lng)
        } else if let ec = eventCoord, !hotelName.isEmpty {
            // Event has coords, hotel name-based
            toHotelURL = GoogleMapsService.directionsURLByName(origin: "\(ec.lat),\(ec.lng)", destination: hotelName)
            fromHotelURL = GoogleMapsService.directionsURLByName(origin: hotelName, destination: "\(ec.lat),\(ec.lng)")
        } else if !eventName.isEmpty, let hc = hotelCoord {
            // Event name-based, hotel has coords
            toHotelURL = GoogleMapsService.directionsURLByName(origin: eventName, destination: "\(hc.lat),\(hc.lng)")
            fromHotelURL = GoogleMapsService.directionsURLByName(origin: "\(hc.lat),\(hc.lng)", destination: eventName)
        } else if !eventName.isEmpty && !hotelName.isEmpty {
            // Both name-based
            toHotelURL = GoogleMapsService.directionsURLByName(origin: eventName, destination: hotelName)
            fromHotelURL = GoogleMapsService.directionsURLByName(origin: hotelName, destination: eventName)
        }

        guard toHotelURL != nil || fromHotelURL != nil else { return nil }

        return HotelDirectionsLink(
            hotelName: hotelName,
            toHotelURL: toHotelURL,
            fromHotelURL: fromHotelURL
        )
    }
}
