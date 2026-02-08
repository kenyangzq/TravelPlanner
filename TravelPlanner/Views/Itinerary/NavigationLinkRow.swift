import SwiftUI

struct NavigationLinkRow: View {
    let link: EventNavigationLink

    var body: some View {
        if let url = link.directionsURL {
            HStack(spacing: 8) {
                // Dotted connector line
                VStack(spacing: 2) {
                    ForEach(0..<3, id: \.self) { _ in
                        Circle()
                            .fill(.secondary.opacity(0.4))
                            .frame(width: 3, height: 3)
                    }
                }
                .frame(width: 36)

                // Direction info
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(link.fromLabel)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Image(systemName: "arrow.right")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Text(link.toLabel)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                // Navigate button
                Link(destination: url) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                            .font(.caption)
                        Text("Navigate")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.blue, in: Capsule())
                }
            }
            .padding(.vertical, 2)
        }
    }
}
