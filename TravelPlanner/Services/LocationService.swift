import Foundation
import CoreLocation

enum LocationError: LocalizedError {
    case notFound
    case geocodingFailed(Error)

    var errorDescription: String? {
        switch self {
        case .notFound:
            return "Location not found"
        case .geocodingFailed(let error):
            return "Geocoding failed: \(error.localizedDescription)"
        }
    }
}

@Observable
final class LocationService {
    private let geocoder = CLGeocoder()

    struct GeocodedLocation {
        let latitude: Double
        let longitude: Double
        let formattedAddress: String
    }

    func geocode(address: String) async throws -> GeocodedLocation {
        do {
            let placemarks = try await geocoder.geocodeAddressString(address)
            guard let placemark = placemarks.first,
                  let location = placemark.location else {
                throw LocationError.notFound
            }

            let address = [
                placemark.name,
                placemark.locality,
                placemark.administrativeArea,
                placemark.country
            ].compactMap { $0 }.joined(separator: ", ")

            return GeocodedLocation(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                formattedAddress: address
            )
        } catch let error as LocationError {
            throw error
        } catch {
            throw LocationError.geocodingFailed(error)
        }
    }

    func geocodeAirportCode(_ code: String) async throws -> GeocodedLocation {
        try await geocode(address: "\(code) airport")
    }
}
