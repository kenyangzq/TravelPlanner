import Foundation
import SwiftData

@Observable
final class EventFormViewModel {
    var isGeocoding = false
    var geocodeError: String?

    private let locationService = LocationService()

    // MARK: - Hotel Geocoding

    func geocodeHotel(_ hotel: HotelEvent) async {
        let query = hotel.hotelName
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                hotel.hotelLatitude = result.latitude
                hotel.hotelLongitude = result.longitude
                hotel.hotelAddress = result.formattedAddress
                hotel.latitude = result.latitude
                hotel.longitude = result.longitude
                hotel.locationName = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = error.localizedDescription
                self.isGeocoding = false
            }
        }
    }

    // MARK: - Activity Geocoding

    func geocodeActivity(_ activity: ActivityEvent) async {
        let query = activity.activityLocationName
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                activity.activityLatitude = result.latitude
                activity.activityLongitude = result.longitude
                activity.latitude = result.latitude
                activity.longitude = result.longitude
                activity.locationName = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = error.localizedDescription
                self.isGeocoding = false
            }
        }
    }

    // MARK: - Restaurant Geocoding

    func geocodeRestaurant(_ restaurant: RestaurantEvent) async {
        let query = restaurant.restaurantName
        guard !query.isEmpty else { return }

        isGeocoding = true
        geocodeError = nil

        do {
            let result = try await locationService.geocode(address: query)
            await MainActor.run {
                restaurant.restaurantLatitude = result.latitude
                restaurant.restaurantLongitude = result.longitude
                restaurant.restaurantAddress = result.formattedAddress
                restaurant.latitude = result.latitude
                restaurant.longitude = result.longitude
                restaurant.locationName = result.formattedAddress
                self.isGeocoding = false
            }
        } catch {
            await MainActor.run {
                self.geocodeError = error.localizedDescription
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
