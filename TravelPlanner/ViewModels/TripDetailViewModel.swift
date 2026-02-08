import Foundation
import SwiftData

struct EventNavigationLink {
    let fromEvent: TripEvent
    let toEvent: TripEvent
    let fromLabel: String
    let toLabel: String
    let directionsURL: URL?
}

struct ItineraryItem: Identifiable {
    var id: UUID { event.id }
    let event: TripEvent
    let navigationLink: EventNavigationLink?
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

        for (index, event) in sorted.enumerated() {
            var navLink: EventNavigationLink? = nil

            if index < sorted.count - 1 {
                let nextEvent = sorted[index + 1]
                navLink = buildNavigationLink(from: event, to: nextEvent)
            }

            items.append(ItineraryItem(event: event, navigationLink: navLink))
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
        let fromCoord = extractEndCoordinate(from: from)
        let toCoord = extractStartCoordinate(from: to)
        let fromLabel = extractEndLabel(from: from)
        let toLabel = extractStartLabel(from: to)

        var url: URL? = nil

        if let fromCoord, let toCoord {
            // Both have coordinates — use coordinate-based directions
            url = GoogleMapsService.directionsURL(
                fromLat: fromCoord.lat, fromLng: fromCoord.lng,
                toLat: toCoord.lat, toLng: toCoord.lng
            )
        } else {
            // Use name-based Google Maps directions as fallback
            let fromQuery = extractEndLocationName(from: from)
            let toQuery = extractStartLocationName(from: to)
            if !fromQuery.isEmpty && !toQuery.isEmpty {
                url = GoogleMapsService.directionsURLByName(origin: fromQuery, destination: toQuery)
            }
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
}
