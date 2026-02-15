import Foundation
import MapKit

struct MapsService {

    /// Directions from user's current location to destination by coordinates
    static func directionsURLFromCurrentLocation(toLat lat: Double, toLng lng: Double) -> URL? {
        // Apple Maps URL format
        let urlString = "http://maps.apple.com/?daddr=\(lat),\(lng)&dirflg=d"
        return URL(string: urlString)
    }

    /// Directions from user's current location to destination by address/name
    static func directionsURLFromCurrentLocation(to destination: String) -> URL? {
        // Apple Maps URL format with address
        let encoded = destination.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? destination
        let urlString = "http://maps.apple.com/?daddr=\(encoded)&dirflg=d"
        return URL(string: urlString)
    }

    /// Open Apple Maps with a specific placemark (more reliable than URL)
    static func openDirections(to coordinate: CLLocationCoordinate2D, name: String = "") {
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)

        if !name.isEmpty {
            mapItem.name = name
        }

        let currentLocationMapItem = MKMapItem.forCurrentLocation()
        let options = [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving]

        MKMapItem.openMaps(
            with: [currentLocationMapItem, mapItem],
            launchOptions: options as [String : Any]
        )
    }

    /// Open Apple Maps with an address string
    static func openDirections(to address: String, name: String = "") {
        let geocoder = CLGeocoder()
        geocoder.geocodeAddressString(address) { placemarks, error in
            if let placemark = placemarks?.first,
               let coordinate = placemark.location?.coordinate {
                let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
                if !name.isEmpty {
                    mapItem.name = name
                }

                let currentLocationMapItem = MKMapItem.forCurrentLocation()
                let options = [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving]

                MKMapItem.openMaps(
                    with: [currentLocationMapItem, mapItem],
                    launchOptions: options as [String : Any]
                )
            }
        }
    }
}
