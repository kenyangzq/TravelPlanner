import SwiftUI

struct NavigationLinkRow: View {
    let link: EventNavigationLink

    var body: some View {
        if let url = link.directionsURL {
            Link(destination: url) {
                HStack(spacing: 10) {
                    // Dotted connector line
                    VStack(spacing: 3) {
                        ForEach(0..<3, id: \.self) { _ in
                            Circle()
                                .fill(.secondary.opacity(0.4))
                                .frame(width: 4, height: 4)
                        }
                    }
                    .frame(width: 36)

                    // Direction info
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(link.fromLabel)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Image(systemName: "arrow.right")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(link.toLabel)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    // Navigate button
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                            .font(.subheadline)
                        Text("Navigate")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(.blue, in: Capsule())
                }
                .padding(.vertical, 6)
                .contentShape(Rectangle())
            }
        }
    }
}
