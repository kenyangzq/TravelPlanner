import SwiftUI

struct ItineraryDaySection: View {
    let date: Date
    let items: [ItineraryItem]
    let onDelete: (TripEvent) -> Void
    let onTap: (TripEvent) -> Void

    var body: some View {
        Section {
            ForEach(items) { item in
                VStack(spacing: 0) {
                    EventRowView(event: item.event)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            onTap(item.event)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                onDelete(item.event)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }

                    // Hotel navigation links
                    if let hotelLink = item.hotelLink {
                        HotelDirectionsRow(link: hotelLink)
                    }

                    if let navLink = item.navigationLink {
                        NavigationLinkRow(link: navLink)
                    }
                }
            }
        } header: {
            HStack {
                Image(systemName: "calendar")
                Text(date.dayOfWeek)
                    .font(.headline)
            }
            .padding(.vertical, 4)
        }
    }
}

// MARK: - Hotel Directions Row

struct HotelDirectionsRow: View {
    let link: HotelDirectionsLink

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "building.2.fill")
                .font(.caption)
                .foregroundStyle(.purple)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                if let fromURL = link.fromHotelURL {
                    Link(destination: fromURL) {
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.right.circle.fill")
                                .font(.caption)
                                .foregroundStyle(.green)
                            Text("From \(link.hotelName)")
                                .font(.caption)
                            Spacer()
                            Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                                .font(.caption)
                        }
                        .foregroundStyle(.blue)
                        .padding(.vertical, 4)
                        .contentShape(Rectangle())
                    }
                }

                if let toURL = link.toHotelURL {
                    Link(destination: toURL) {
                        HStack(spacing: 5) {
                            Image(systemName: "arrow.left.circle.fill")
                                .font(.caption)
                                .foregroundStyle(.orange)
                            Text("Back to \(link.hotelName)")
                                .font(.caption)
                            Spacer()
                            Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                                .font(.caption)
                        }
                        .foregroundStyle(.blue)
                        .padding(.vertical, 4)
                        .contentShape(Rectangle())
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
        .padding(.leading, 4)
    }
}
