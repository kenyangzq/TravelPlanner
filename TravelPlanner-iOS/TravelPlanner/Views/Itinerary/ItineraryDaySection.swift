import SwiftUI

struct ItineraryDaySection: View {
    let date: Date
    let items: [ItineraryItem]
    let dayHotel: DayHotelInfo?
    let onDelete: (TripEvent) -> Void
    let onTap: (TripEvent) -> Void

    var body: some View {
        Section {
            // Hotel banner at top of each day
            if let dayHotel {
                VStack(spacing: 0) {
                    HStack(spacing: 10) {
                        Image(systemName: "building.2.fill")
                            .font(.title3)
                            .foregroundStyle(.purple)
                            .frame(width: 36)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(dayHotel.hotel.hotelName.isEmpty ? "Hotel" : dayHotel.hotel.hotelName)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            if !dayHotel.hotel.hotelAddress.isEmpty {
                                HStack(spacing: 4) {
                                    Image(systemName: "mappin")
                                        .font(.caption2)
                                    Text(dayHotel.hotel.hotelAddress)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }

                        Spacer()
                    }
                    .padding(.vertical, 6)
                    .simultaneousGesture(TapGesture().onEnded {
                        onTap(dayHotel.hotel)
                    })

                    // Navigation to hotel from user's current location
                    if let navToHotel = dayHotel.navigationToHotel {
                        NavigationLinkRow(link: navToHotel)
                    }
                }
            }

            ForEach(items) { item in
                VStack(spacing: 0) {
                    // Navigation to departure airport (for flights)
                    if let navToDeparture = item.navigationToDeparture {
                        NavigationLinkRow(link: navToDeparture)
                    }

                    EventRowView(event: item.event)
                        .simultaneousGesture(TapGesture().onEnded {
                            onTap(item.event)
                        })
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                onDelete(item.event)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }

                    // Navigation to event from user's current location
                    if let navToEvent = item.navigationToEvent {
                        NavigationLinkRow(link: navToEvent)
                    }

                    // Back-to-hotel navigation
                    if let navToHotel = item.navigationToHotel {
                        NavigationLinkRow(link: navToHotel)
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
