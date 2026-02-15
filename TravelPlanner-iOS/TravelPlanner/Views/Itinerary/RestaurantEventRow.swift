import SwiftUI

struct RestaurantEventRow: View {
    let restaurant: RestaurantEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "fork.knife")
                .font(.title2)
                .foregroundStyle(.red)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(restaurant.restaurantName.isEmpty ? "Restaurant" : restaurant.restaurantName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Spacer()
                }

                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.caption2)
                    Text(restaurant.reservationTime.displayDateTime)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if restaurant.partySize > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "person.2")
                            .font(.caption2)
                        Text("Party of \(restaurant.partySize)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if !restaurant.restaurantAddress.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(restaurant.restaurantAddress)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if let lat = restaurant.restaurantLatitude, let lng = restaurant.restaurantLongitude {
                    MapLinkButton(
                        label: restaurant.restaurantName.isEmpty ? "Restaurant" : restaurant.restaurantName,
                        lat: lat, lng: lng
                    )
                }
            }
        }
        .padding(.vertical, 4)
    }
}
