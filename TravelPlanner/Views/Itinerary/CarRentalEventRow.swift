import SwiftUI

struct CarRentalEventRow: View {
    let carRental: CarRentalEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: carRental.hasCarRental ? "car.fill" : "car")
                .font(.title2)
                .foregroundStyle(carRental.hasCarRental ? .green : .gray)
                .frame(width: 36)

            if carRental.hasCarRental {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Car Rental")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        if !carRental.rentalCompany.isEmpty {
                            Text("- \(carRental.rentalCompany)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }

                    // Pickup info
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.green)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Pick up: \(carRental.pickupDate.displayDateTime)")
                                .font(.caption)
                            if !carRental.pickupLocationName.isEmpty {
                                Text(carRental.pickupLocationName)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    // Return info
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.red)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Return: \(carRental.returnDate.displayDateTime)")
                                .font(.caption)
                            if !carRental.returnLocationName.isEmpty {
                                Text(carRental.returnLocationName)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    if !carRental.confirmationNumber.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "number")
                                .font(.caption2)
                            Text(carRental.confirmationNumber)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    // Map links
                    HStack(spacing: 12) {
                        if let lat = carRental.pickupLatitude, let lng = carRental.pickupLongitude {
                            MapLinkButton(label: "Pickup", lat: lat, lng: lng)
                        }
                        if let lat = carRental.returnLatitude, let lng = carRental.returnLongitude {
                            MapLinkButton(label: "Return", lat: lat, lng: lng)
                        }
                    }
                }
            } else {
                Text("No Car Rental")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding(.vertical, 4)
    }
}
