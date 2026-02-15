import SwiftUI
import MapKit

/// A button that opens Apple Maps with proper error handling and logging
struct GoogleMapsButton: View {
    let url: URL
    let label: String
    let icon: String
    var size: GoogleMapsButtonSize = .medium

    enum GoogleMapsButtonSize {
        case small, medium

        var font: Font {
            switch self {
            case .small: return .caption
            case .medium: return .caption
            }
        }

        var iconFont: Font {
            switch self {
            case .small: return .system(size: 8)
            case .medium: return .caption
            }
        }

        var padding: (horizontal: CGFloat, vertical: CGFloat) {
            switch self {
            case .small: return (4, 2)
            case .medium: return (10, 6)
            }
        }

        var spacing: CGFloat {
            switch self {
            case .small: return 2
            case .medium: return 4
            }
        }
    }

    var body: some View {
        Button {
            openAppleMaps()
        } label: {
            HStack(spacing: size.spacing) {
                Image(systemName: icon)
                    .font(size.iconFont)
                if size == .medium {
                    Text(label)
                        .font(size.font)
                        .fontWeight(.medium)
                }
            }
            .foregroundStyle(.white)
            .padding(.horizontal, size.padding.horizontal)
            .padding(.vertical, size.padding.vertical)
            .background(.blue, in: Capsule())
        }
        .buttonStyle(.plain) // Prevents conflict with parent buttons
    }

    private func openAppleMaps() {
        print("🗺️ Opening Apple Maps")

        // Try to use the URL with Apple Maps
        if UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url, options: [:]) { success in
                print("   Open result: \(success)")
            }
        }
    }
}
