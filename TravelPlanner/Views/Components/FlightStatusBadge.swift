import SwiftUI

struct FlightStatusBadge: View {
    let status: String

    var body: some View {
        Text(status)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(statusColor.opacity(0.15), in: Capsule())
            .foregroundStyle(statusColor)
    }

    private var statusColor: Color {
        switch status.lowercased() {
        case "scheduled":
            return .blue
        case "departed", "en route", "active":
            return .orange
        case "arrived", "landed":
            return .green
        case "cancelled", "canceled":
            return .red
        case "delayed":
            return .yellow
        case "diverted":
            return .purple
        default:
            return .gray
        }
    }
}
