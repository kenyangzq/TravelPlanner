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
