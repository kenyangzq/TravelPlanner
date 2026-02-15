import SwiftUI

struct NavigationLinkRow: View {
    let link: EventNavigationLink

    var body: some View {
        HStack(spacing: 10) {
            // Navigation icon
            Image(systemName: "location.fill")
                .font(.caption)
                .foregroundStyle(.blue)
                .frame(width: 36)

            // Destination info
            Text("Navigate to \(link.destinationLabel)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            // Navigate button
            if let url = link.directionsURL {
                GoogleMapsButton(
                    url: url,
                    label: "Go",
                    icon: "arrow.triangle.turn.up.right.circle.fill",
                    size: .medium
                )
            }
        }
        .padding(.vertical, 4)
        .padding(.leading, 4)
    }
}
