import UIKit

enum TravelMode: String {
    case driving
    case walking
    case transit
    case bicycling
}

struct GoogleMapsService {

    static func directionsURL(
        fromLat: Double, fromLng: Double,
        toLat: Double, toLng: Double,
        mode: TravelMode = .driving
    ) -> URL? {
        // Try Google Maps app first
        let gmapsString = "comgooglemaps://?saddr=\(fromLat),\(fromLng)&daddr=\(toLat),\(toLng)&directionsmode=\(mode.rawValue)"

        if let gmapsURL = URL(string: gmapsString),
           UIApplication.shared.canOpenURL(gmapsURL) {
            return gmapsURL
        }

        // Fallback to web URL
        let webString = "https://www.google.com/maps/dir/?api=1&origin=\(fromLat),\(fromLng)&destination=\(toLat),\(toLng)&travelmode=\(mode.rawValue)"
        return URL(string: webString)
    }

    static func locationURL(lat: Double, lng: Double, label: String = "") -> URL? {
        let encoded = label.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let gmapsString = "comgooglemaps://?q=\(encoded)&center=\(lat),\(lng)&zoom=15"

        if let gmapsURL = URL(string: gmapsString),
           UIApplication.shared.canOpenURL(gmapsURL) {
            return gmapsURL
        }

        let webString = "https://www.google.com/maps/search/?api=1&query=\(lat),\(lng)"
        return URL(string: webString)
    }

    static func directionsURLByName(
        origin: String,
        destination: String,
        mode: TravelMode = .driving
    ) -> URL? {
        let encodedOrigin = origin.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let encodedDest = destination.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        guard !encodedOrigin.isEmpty, !encodedDest.isEmpty else { return nil }

        let gmapsString = "comgooglemaps://?saddr=\(encodedOrigin)&daddr=\(encodedDest)&directionsmode=\(mode.rawValue)"

        if let gmapsURL = URL(string: gmapsString),
           UIApplication.shared.canOpenURL(gmapsURL) {
            return gmapsURL
        }

        let webString = "https://www.google.com/maps/dir/?api=1&origin=\(encodedOrigin)&destination=\(encodedDest)&travelmode=\(mode.rawValue)"
        return URL(string: webString)
    }

    static func searchURL(query: String) -> URL? {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let gmapsString = "comgooglemaps://?q=\(encoded)"
        if let gmapsURL = URL(string: gmapsString),
           UIApplication.shared.canOpenURL(gmapsURL) {
            return gmapsURL
        }

        let webString = "https://www.google.com/maps/search/?api=1&query=\(encoded)"
        return URL(string: webString)
    }
}
