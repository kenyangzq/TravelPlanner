import SwiftUI

struct HotelEventRow: View {
    let hotel: HotelEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "building.2.fill")
                .font(.title2)
                .foregroundStyle(.purple)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(hotel.hotelName.isEmpty ? "Hotel" : hotel.hotelName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Spacer()
                }

                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.green)
                        Text("Check-in: \(hotel.checkInDate.displayDateTime)")
                            .font(.caption)
                    }
                }

                HStack(spacing: 4) {
                    Image(systemName: "arrow.left.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.red)
                    Text("Check-out: \(hotel.checkOutDate.displayDateTime)")
                        .font(.caption)
                }

                if !hotel.hotelAddress.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(hotel.hotelAddress)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if let lat = hotel.hotelLatitude, let lng = hotel.hotelLongitude {
                    MapLinkButton(
                        label: hotel.hotelName.isEmpty ? "Hotel Location" : hotel.hotelName,
                        lat: lat, lng: lng
                    )
                }
            }
        }
        .padding(.vertical, 4)
    }
}
