import UIKit

enum TravelMode: String {
    case driving
    case walking
    case transit
    case bicycling
}

struct GoogleMapsService {

    /// Character set safe for URL query parameter values (excludes &, =, +, etc.)
    private static var queryValueAllowed: CharacterSet {
        var cs = CharacterSet.urlQueryAllowed
        cs.remove(charactersIn: "&=+#")
        return cs
    }

    private static func encodeValue(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: queryValueAllowed) ?? value
    }

    static func directionsURL(
        fromLat: Double, fromLng: Double,
        toLat: Double, toLng: Double,
        mode: TravelMode = .driving
    ) -> URL? {
        // Direct Google Maps app URL - will open in app if installed, otherwise falls back
        let gmapsString = "comgooglemaps://?saddr=\(fromLat),\(fromLng)&daddr=\(toLat),\(toLng)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }

    static func locationURL(lat: Double, lng: Double, label: String = "") -> URL? {
        let encoded = encodeValue(label)
        let gmapsString = "comgooglemaps://?q=\(encoded)&center=\(lat),\(lng)&zoom=15"
        return URL(string: gmapsString)
    }

    static func directionsURLByName(
        origin: String,
        destination: String,
        mode: TravelMode = .driving
    ) -> URL? {
        let encodedOrigin = encodeValue(origin)
        let encodedDest = encodeValue(destination)

        guard !encodedOrigin.isEmpty, !encodedDest.isEmpty else { return nil }

        let gmapsString = "comgooglemaps://?saddr=\(encodedOrigin)&daddr=\(encodedDest)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }

    static func searchURL(query: String) -> URL? {
        let encoded = encodeValue(query)
        let gmapsString = "comgooglemaps://?q=\(encoded)"
        return URL(string: gmapsString)
    }

    /// Mixed-mode directions: origin by name, destination by coordinates
    static func directionsURLFromNameToCoords(
        origin: String,
        destinationLat: Double,
        destinationLng: Double,
        mode: TravelMode = .driving
    ) -> URL? {
        let encodedOrigin = encodeValue(origin)
        guard !encodedOrigin.isEmpty else { return nil }

        let gmapsString = "comgooglemaps://?saddr=\(encodedOrigin)&daddr=\(destinationLat),\(destinationLng)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }

    /// Mixed-mode directions: origin by coordinates, destination by name
    static func directionsURLFromCoordsToName(
        originLat: Double,
        originLng: Double,
        destination: String,
        mode: TravelMode = .driving
    ) -> URL? {
        let encodedDest = encodeValue(destination)
        guard !encodedDest.isEmpty else { return nil }

        let gmapsString = "comgooglemaps://?saddr=\(originLat),\(originLng)&daddr=\(encodedDest)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }

    /// Directions from user's current location to destination by name
    static func directionsURLFromCurrentLocation(to destination: String, mode: TravelMode = .driving) -> URL? {
        let encodedDest = encodeValue(destination)
        guard !encodedDest.isEmpty else { return nil }

        // Empty saddr means "from current location"
        let gmapsString = "comgooglemaps://?daddr=\(encodedDest)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }

    /// Directions from user's current location to destination by coordinates
    static func directionsURLFromCurrentLocation(toLat lat: Double, toLng lng: Double, mode: TravelMode = .driving) -> URL? {
        // Empty saddr means "from current location"
        let gmapsString = "comgooglemaps://?daddr=\(lat),\(lng)&directionsmode=\(mode.rawValue)"
        return URL(string: gmapsString)
    }
}
