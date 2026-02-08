import SwiftUI

struct MapLinkButton: View {
    let label: String
    let lat: Double
    let lng: Double

    var body: some View {
        if let url = GoogleMapsService.locationURL(lat: lat, lng: lng, label: label) {
            Link(destination: url) {
                HStack(spacing: 3) {
                    Image(systemName: "map")
                        .font(.caption2)
                    Text("Map")
                        .font(.caption2)
                }
                .foregroundStyle(.blue)
            }
        }
    }
}
