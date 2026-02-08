import Foundation
import CoreLocation
import MapKit

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

    struct GeocodedLocation: Identifiable, Hashable {
        let id = UUID()
        let latitude: Double
        let longitude: Double
        let formattedAddress: String
        let name: String
    }

    func geocode(address: String) async throws -> GeocodedLocation {
        do {
            let placemarks = try await geocoder.geocodeAddressString(address)
            guard let placemark = placemarks.first,
                  let location = placemark.location else {
                throw LocationError.notFound
            }

            let formattedAddress = [
                placemark.name,
                placemark.locality,
                placemark.administrativeArea,
                placemark.country
            ].compactMap { $0 }.joined(separator: ", ")

            return GeocodedLocation(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                formattedAddress: formattedAddress,
                name: placemark.name ?? address
            )
        } catch let error as LocationError {
            throw error
        } catch {
            throw LocationError.geocodingFailed(error)
        }
    }

    /// Search for places matching a query across multiple cities using MKLocalSearch.
    /// Returns multiple results with region bias toward each trip city.
    func searchPlaces(query: String, cities: [String]) async -> [GeocodedLocation] {
        var results: [GeocodedLocation] = []

        // Build search regions from trip cities
        var searchRegions: [MKCoordinateRegion?] = []
        if cities.isEmpty {
            searchRegions = [nil]
        } else {
            for city in cities {
                if let placemarks = try? await geocoder.geocodeAddressString(city),
                   let location = placemarks.first?.location {
                    let region = MKCoordinateRegion(
                        center: location.coordinate,
                        latitudinalMeters: 50_000,
                        longitudinalMeters: 50_000
                    )
                    searchRegions.append(region)
                }
            }
            if searchRegions.isEmpty {
                searchRegions = [nil]
            }
        }

        for region in searchRegions {
            let request = MKLocalSearch.Request()
            request.naturalLanguageQuery = query
            if let region = region {
                request.region = region
            }

            let search = MKLocalSearch(request: request)
            guard let response = try? await search.start() else { continue }

            for mapItem in response.mapItems {
                let coord = mapItem.placemark.coordinate

                // Deduplicate by coordinate proximity (~100m)
                let isDuplicate = results.contains { existing in
                    abs(existing.latitude - coord.latitude) < 0.001
                    && abs(existing.longitude - coord.longitude) < 0.001
                }
                guard !isDuplicate else { continue }

                let placemark = mapItem.placemark
                let formattedAddress = [
                    placemark.subThoroughfare,
                    placemark.thoroughfare,
                    placemark.locality,
                    placemark.administrativeArea,
                    placemark.country
                ].compactMap { $0 }.joined(separator: ", ")

                results.append(GeocodedLocation(
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                    formattedAddress: formattedAddress.isEmpty ? (mapItem.name ?? query) : formattedAddress,
                    name: mapItem.name ?? query
                ))
            }
        }

        return Array(results.prefix(5))
    }

    func geocodeAirportCode(_ code: String) async throws -> GeocodedLocation {
        try await geocode(address: "\(code) airport")
    }
}
