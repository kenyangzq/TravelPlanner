import SwiftUI

struct CalendarItineraryView: View {
    let trip: Trip
    let viewModel: TripDetailViewModel
    let onEditEvent: (TripEvent) -> Void
    let onFlightTap: (FlightEvent) -> Void

    private let hourHeight: CGFloat = 60
    private let startHour = 0
    private let endHour = 24

    var body: some View {
        let dayGroups = viewModel.eventsByDay(for: trip)

        if dayGroups.isEmpty {
            ContentUnavailableView(
                "No Events",
                systemImage: "calendar",
                description: Text("Add events to see them in calendar view")
            )
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 0) {
                    // Time labels column
                    timeLabelsColumn

                    // Day columns
                    ForEach(dayGroups, id: \.date) { day in
                        dayColumn(date: day.date, items: day.items)
                    }
                }
            }
        }
    }

    // MARK: - Time Labels

    private var timeLabelsColumn: some View {
        VStack(spacing: 0) {
            // Header spacer for day title
            Text("")
                .frame(height: 44)

            ScrollView(.vertical, showsIndicators: false) {
                ZStack(alignment: .topLeading) {
                    VStack(spacing: 0) {
                        ForEach(startHour..<endHour, id: \.self) { hour in
                            HStack {
                                Text(formatHour(hour))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .frame(width: 44, alignment: .trailing)
                                Spacer()
                            }
                            .frame(height: hourHeight)
                        }
                    }
                }
            }
        }
        .frame(width: 52)
    }

    // MARK: - Day Column

    private func dayColumn(date: Date, items: [ItineraryItem]) -> some View {
        VStack(spacing: 0) {
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

            // Event blocks
            ScrollView(.vertical, showsIndicators: false) {
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
                    ForEach(items) { item in
                        eventBlock(event: item.event)
                    }
                }
                .frame(height: CGFloat(endHour - startHour) * hourHeight)
            }
        }
        .frame(width: max(120, UIScreen.main.bounds.width / CGFloat(min(viewModel.eventsByDay(for: trip).count, 4))))
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(Color(.systemGray4))
                .frame(width: 0.5)
        }
    }

    // MARK: - Event Block

    private func eventBlock(event: TripEvent) -> some View {
        let startMinutes = minutesSinceStartOfDay(event.startDate)
        let endMinutes = minutesSinceStartOfDay(event.endDate)
        let duration = max(endMinutes - startMinutes, 30) // minimum 30 min display
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
        let formatter = DateFormatter()
        formatter.dateFormat = "ha"
        var comps = DateComponents()
        comps.hour = hour
        if let date = Calendar.current.date(from: comps) {
            return formatter.string(from: date).lowercased()
        }
        return "\(hour)"
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
