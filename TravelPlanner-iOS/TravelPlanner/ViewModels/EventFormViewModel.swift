import Foundation
import SwiftData

@Observable
final class EventFormViewModel {
    var isGeocoding = false
    var geocodeError: String?
    var resolvedAddress: String?

    // Search results for dropdown selection
    var searchResults: [LocationService.GeocodedLocation] = []
    var selectedResult: LocationService.GeocodedLocation?

    private let locationService = LocationService()

    // MARK: - Multi-result Search

    /// Search for a place name across trip cities, returning multiple candidates for user selection.
    func searchPlace(query: String, cities: [String]) async {
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil
        resolvedAddress = nil
        searchResults = []
        selectedResult = nil

        let results = await locationService.searchPlaces(query: query, cities: cities)

        await MainActor.run {
            self.searchResults = results
            self.isGeocoding = false

            if results.isEmpty {
                self.geocodeError = "No locations found. Try a different name."
            } else if results.count == 1 {
                // Auto-select if only one result
                self.selectedResult = results.first
                self.resolvedAddress = results.first?.formattedAddress
            }
        }
    }

    /// Select a specific search result from the dropdown.
    func selectSearchResult(_ result: LocationService.GeocodedLocation) {
        selectedResult = result
        resolvedAddress = result.formattedAddress
    }

    /// Clear search state when the name field changes.
    func clearSearchState() {
        resolvedAddress = nil
        geocodeError = nil
        searchResults = []
        selectedResult = nil
    }

    // MARK: - Apply Selected Result to Models

    func applyToHotel(_ hotel: HotelEvent) {
        guard let result = selectedResult else { return }
        hotel.hotelLatitude = result.latitude
        hotel.hotelLongitude = result.longitude
        hotel.hotelAddress = result.formattedAddress
        hotel.latitude = result.latitude
        hotel.longitude = result.longitude
        hotel.locationName = result.formattedAddress
    }

    func applyToRestaurant(_ restaurant: RestaurantEvent) {
        guard let result = selectedResult else { return }
        restaurant.restaurantLatitude = result.latitude
        restaurant.restaurantLongitude = result.longitude
        restaurant.restaurantAddress = result.formattedAddress
        restaurant.latitude = result.latitude
        restaurant.longitude = result.longitude
        restaurant.locationName = result.formattedAddress
    }

    func applyToActivity(_ activity: ActivityEvent) {
        guard let result = selectedResult else { return }
        activity.activityLatitude = result.latitude
        activity.activityLongitude = result.longitude
        activity.latitude = result.latitude
        activity.longitude = result.longitude
        activity.locationName = result.formattedAddress
    }

    // MARK: - Legacy Single-result Geocoding (for save fallback)

    func geocodeHotel(_ hotel: HotelEvent, destination: String = "") async {
        let query = destination.isEmpty ? hotel.hotelName : "\(hotel.hotelName), \(destination)"
        guard !hotel.hotelName.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil
        resolvedAddress = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                hotel.hotelLatitude = result.latitude
                hotel.hotelLongitude = result.longitude
                hotel.hotelAddress = result.formattedAddress
                hotel.latitude = result.latitude
                hotel.longitude = result.longitude
                hotel.locationName = result.formattedAddress
                self.resolvedAddress = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = "Could not find location."
                self.isGeocoding = false
            }
        }
    }

    // MARK: - Activity Geocoding

    func geocodeActivity(_ activity: ActivityEvent, destination: String = "") async {
        let query = destination.isEmpty ? activity.activityLocationName : "\(activity.activityLocationName), \(destination)"
        guard !activity.activityLocationName.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil
        resolvedAddress = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                activity.activityLatitude = result.latitude
                activity.activityLongitude = result.longitude
                activity.latitude = result.latitude
                activity.longitude = result.longitude
                activity.locationName = result.formattedAddress
                self.resolvedAddress = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = "Could not find location."
                self.isGeocoding = false
            }
        }
    }

    // MARK: - Restaurant Geocoding

    func geocodeRestaurant(_ restaurant: RestaurantEvent, destination: String = "") async {
        let query = destination.isEmpty ? restaurant.restaurantName : "\(restaurant.restaurantName), \(destination)"
        guard !restaurant.restaurantName.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil
        resolvedAddress = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                restaurant.restaurantLatitude = result.latitude
                restaurant.restaurantLongitude = result.longitude
                restaurant.restaurantAddress = result.formattedAddress
                restaurant.latitude = result.latitude
                restaurant.longitude = result.longitude
                restaurant.locationName = result.formattedAddress
                self.resolvedAddress = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = "Could not find location."
                self.isGeocoding = false
            }
        }
    }

    // MARK: - Car Rental Location Geocoding

    func geocodeCarRentalPickup(_ carRental: CarRentalEvent) async {
        let query = carRental.pickupAirportCode.isEmpty
            ? carRental.pickupLocationName
            : "\(carRental.pickupAirportCode) airport"
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                carRental.pickupLatitude = result.latitude
                carRental.pickupLongitude = result.longitude
                carRental.latitude = result.latitude
                carRental.longitude = result.longitude
                carRental.locationName = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = error.localizedDescription
                self.isGeocoding = false
            }
        }
    }

    func geocodeCarRentalReturn(_ carRental: CarRentalEvent) async {
        let query = carRental.returnAirportCode.isEmpty
            ? carRental.returnLocationName
            : "\(carRental.returnAirportCode) airport"
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                carRental.returnLatitude = result.latitude
                carRental.returnLongitude = result.longitude
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = error.localizedDescription
                self.isGeocoding = false
            }
        }
    }
}
