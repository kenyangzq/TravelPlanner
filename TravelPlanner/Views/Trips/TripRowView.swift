import SwiftUI

struct TripRowView: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(trip.name)
                    .font(.headline)
                Spacer()
                Text("\(trip.events.count) events")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if !trip.destination.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.red)
                    Text(trip.destination)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            HStack(spacing: 4) {
                Image(systemName: "calendar")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("\(trip.startDate.displayDate) - \(trip.endDate.displayDate)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
