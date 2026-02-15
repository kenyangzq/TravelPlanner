import SwiftUI

struct EventRowView: View {
    let event: TripEvent

    var body: some View {
        Group {
            switch event {
            case let flight as FlightEvent:
                FlightEventRow(flight: flight)
            case let carRental as CarRentalEvent:
                CarRentalEventRow(carRental: carRental)
            case let hotel as HotelEvent:
                HotelEventRow(hotel: hotel)
            case let restaurant as RestaurantEvent:
                RestaurantEventRow(restaurant: restaurant)
            case let activity as ActivityEvent:
                ActivityEventRow(activity: activity)
            default:
                GenericEventRow(event: event)
            }
        }
    }
}

struct GenericEventRow: View {
    let event: TripEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: event.eventIcon)
                .font(.title2)
                .foregroundStyle(.gray)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                if !event.locationName.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(event.locationName)
                            .font(.caption)
                    }
                    .foregroundStyle(.secondary)
                }

                Text(event.startDate.displayTime)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}
