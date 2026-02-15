import SwiftUI

struct CalendarItineraryView: View {
    let trip: Trip
    let viewModel: TripDetailViewModel
    let onEditEvent: (TripEvent) -> Void
    let onFlightTap: (FlightEvent) -> Void

    private let hourHeight: CGFloat = 60
    private let startHour = 0
    private let endHour = 24
    private let timeColumnWidth: CGFloat = 56
    private let hotelBannerHeight: CGFloat = 44
    private let hotelBannerSpacing: CGFloat = 2

    private var hotels: [HotelEvent] {
        trip.events.compactMap { $0 as? HotelEvent }
    }

    /// All dates in the trip range (startDate through endDate inclusive).
    private var allTripDates: [Date] {
        var dates: [Date] = []
        let calendar = Calendar.current
        var current = trip.startDate.startOfDay
        let end = trip.endDate.startOfDay
        while current <= end {
            dates.append(current)
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }
        return dates
    }

    /// Events grouped by day (only days that have events).
    private var eventItemsByDay: [Date: [ItineraryItem]] {
        let items = viewModel.itineraryItems(for: trip)
        return Dictionary(grouping: items) { $0.event.startDate.startOfDay }
    }

    /// Find all hotels active on a given date (supports overlapping).
    /// Includes both check-in and check-out dates.
    private func findHotels(for date: Date) -> [HotelEvent] {
        let day = date.startOfDay
        return hotels.filter { hotel in
            hotel.checkInDate.startOfDay <= day && day <= hotel.checkOutDate.startOfDay
        }
    }

    /// Max number of hotel rows needed across all days.
    private var maxHotelRows: Int {
        var maxRows = 0
        for date in allTripDates {
            let count = findHotels(for: date).count
            if count > maxRows { maxRows = count }
        }
        return max(maxRows, 1)
    }

    private var hotelAreaHeight: CGFloat {
        CGFloat(maxHotelRows) * hotelBannerHeight + CGFloat(max(maxHotelRows - 1, 0)) * hotelBannerSpacing
    }

    private var dayColumnWidth: CGFloat {
        max(120, UIScreen.main.bounds.width / CGFloat(min(allTripDates.count, 4)))
    }

    var body: some View {
        if allTripDates.isEmpty {
            ContentUnavailableView(
                "No Events",
                systemImage: "calendar",
                description: Text("Add events to see them in calendar view")
            )
        } else {
            ScrollView([.horizontal, .vertical], showsIndicators: true) {
                HStack(alignment: .top, spacing: 0) {
                    // Time labels column
                    VStack(spacing: 0) {
                        // Spacer for day header + hotel banners
                        Color.clear.frame(height: 44 + hotelAreaHeight)

                        // Hour labels
                        ForEach(startHour..<endHour, id: \.self) { hour in
                            HStack {
                                Text(formatHour(hour))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .frame(width: 48, alignment: .trailing)
                                Spacer()
                            }
                            .frame(height: hourHeight)
                        }
                    }
                    .frame(width: timeColumnWidth)

                    // Day columns — one for every date in trip range
                    ForEach(allTripDates, id: \.self) { date in
                        let items = eventItemsByDay[date] ?? []
                        dayColumn(date: date, items: items)
                            .frame(width: dayColumnWidth)
                            .overlay(alignment: .leading) {
                                Rectangle()
                                    .fill(Color(.systemGray4))
                                    .frame(width: 0.5)
                            }
                    }
                }
            }
        }
    }

    // MARK: - Day Column

    private func dayColumn(date: Date, items: [ItineraryItem]) -> some View {
        let nonHotelItems = items.filter { !($0.event is HotelEvent) }

        return VStack(spacing: 0) {
            // Day header
            VStack(spacing: 2) {
                Text(dayAbbrev(date))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(dayNumber(date))
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundStyle(Calendar.current.isDateInToday(date) ? .white : .primary)
                    .frame(width: 28, height: 28)
                    .background {
                        if Calendar.current.isDateInToday(date) {
                            Circle().fill(.blue)
                        }
                    }
            }
            .frame(height: 44)

            // Hotel banners area
            hotelBanners(for: date)
                .frame(height: hotelAreaHeight)

            // Event grid
            ZStack(alignment: .topLeading) {
                // Hour grid lines
                VStack(spacing: 0) {
                    ForEach(startHour..<endHour, id: \.self) { _ in
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 1)
                            .padding(.top, hourHeight - 1)
                    }
                }

                // Event blocks
                ForEach(nonHotelItems) { item in
                    eventBlock(item: item)
                }
            }
            .frame(height: CGFloat(endHour - startHour) * hourHeight)
        }
    }

    // MARK: - Hotel Banners

    private func hotelBanners(for date: Date) -> some View {
        let activeHotels = findHotels(for: date)

        return VStack(spacing: hotelBannerSpacing) {
            ForEach(activeHotels, id: \.id) { hotel in
                Button {
                    onEditEvent(hotel)
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "building.2.fill")
                                .font(.system(size: 10))
                            Text(hotel.hotelName)
                                .font(.system(size: 11))
                                .fontWeight(.medium)
                                .lineLimit(1)
                        }

                        // Navigation to hotel from user's current location
                        if let navToHotel = viewModel.buildNavigationToHotel(hotel),
                           let url = navToHotel.directionsURL {
                            GoogleMapsButton(
                                url: url,
                                label: "Navigate",
                                icon: "arrow.triangle.turn.up.right.circle.fill",
                                size: .small
                            )
                        }
                    }
                    .foregroundStyle(.purple)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .frame(maxWidth: .infinity)
                    .frame(height: hotelBannerHeight)
                    .background(.purple.opacity(0.15), in: RoundedRectangle(cornerRadius: 6))
                }
                .tint(.purple)
                .buttonStyle(.plain)
                .padding(.horizontal, 3)
            }

            // Fill remaining rows if fewer hotels than max
            if activeHotels.count < maxHotelRows {
                ForEach(0..<(maxHotelRows - activeHotels.count), id: \.self) { _ in
                    Spacer()
                        .frame(height: hotelBannerHeight)
                }
            }
        }
    }

    // MARK: - Event Block

    private func eventBlock(item: ItineraryItem) -> some View {
        let event = item.event
        let startMinutes = minutesSinceStartOfDay(event.startDate)
        let endMinutes = minutesSinceStartOfDay(event.endDate)
        let duration = max(endMinutes - startMinutes, 30)
        let topOffset = CGFloat(startMinutes) / 60.0 * hourHeight
        let height = CGFloat(duration) / 60.0 * hourHeight

        return Button {
            if let flight = event as? FlightEvent {
                onFlightTap(flight)
            } else {
                onEditEvent(event)
            }
        } label: {
            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                Text(event.startDate.displayTime)
                    .font(.system(size: 9))

                if !event.locationName.isEmpty {
                    Text(event.locationName)
                        .font(.system(size: 9))
                        .lineLimit(1)
                }

                // Navigation to departure airport (for flights)
                if let navToDeparture = item.navigationToDeparture, let url = navToDeparture.directionsURL {
                    Divider()
                        .padding(.horizontal, 4)

                    GoogleMapsButton(
                        url: url,
                        label: "To \(navToDeparture.destinationLabel)",
                        icon: "arrow.triangle.turn.up.right.circle.fill",
                        size: .small
                    )
                    .foregroundStyle(.blue)
                }

                // Navigation to event from user's current location
                if let navToEvent = item.navigationToEvent, let url = navToEvent.directionsURL {
                    Divider()
                        .padding(.horizontal, 4)

                    GoogleMapsButton(
                        url: url,
                        label: "Navigate here",
                        icon: "location.fill",
                        size: .small
                    )
                    .foregroundStyle(.blue)
                }

                // Back-to-hotel navigation (if available)
                if let navToHotel = item.navigationToHotel, let url = navToHotel.directionsURL {
                    Divider()
                        .padding(.horizontal, 4)

                    GoogleMapsButton(
                        url: url,
                        label: "Back to hotel",
                        icon: "building.2.fill",
                        size: .small
                    )
                    .foregroundStyle(.purple)
                }
            }
            .padding(4)
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .frame(height: max(height, 24), alignment: .top)
            .background(eventColor(event).opacity(0.2), in: RoundedRectangle(cornerRadius: 4))
            .overlay(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(eventColor(event))
                    .frame(width: 3)
            }
            .clipped()
        }
        .tint(.primary)
        .offset(y: topOffset)
        .padding(.horizontal, 2)
    }

    // MARK: - Helpers

    private func minutesSinceStartOfDay(_ date: Date) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.hour, .minute], from: date)
        return (components.hour ?? 0) * 60 + (components.minute ?? 0)
    }

    private func formatHour(_ hour: Int) -> String {
        if hour == 0 || hour == 24 {
            return "12 AM"
        } else if hour == 12 {
            return "12 PM"
        } else if hour < 12 {
            return "\(hour) AM"
        } else {
            return "\(hour - 12) PM"
        }
    }

    private func dayAbbrev(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date).uppercased()
    }

    private func dayNumber(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }

    private func eventColor(_ event: TripEvent) -> Color {
        switch event.eventColor {
        case "blue": return .blue
        case "green": return .green
        case "purple": return .purple
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}
