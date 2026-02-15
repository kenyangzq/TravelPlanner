import SwiftUI

struct FlightEventRow: View {
    let flight: FlightEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "airplane")
                .font(.title2)
                .foregroundStyle(.blue)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(flight.flightNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    if !flight.airlineName.isEmpty {
                        Text("- \(flight.airlineName)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if !flight.flightStatus.isEmpty {
                        FlightStatusBadge(status: flight.flightStatus)
                    }
                }

                // Departure -> Arrival
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(flight.departureAirportIATA.isEmpty ? "---" : flight.departureAirportIATA)
                            .font(.title3)
                            .fontWeight(.bold)
                        if !flight.departureAirportName.isEmpty {
                            Text(flight.departureAirportName)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        if let depTime = flight.scheduledDepartureTime {
                            Text(depTime.displayTime)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        if !flight.departureTerminal.isEmpty {
                            Text("Terminal \(flight.departureTerminal)")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                    }

                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(flight.arrivalAirportIATA.isEmpty ? "---" : flight.arrivalAirportIATA)
                            .font(.title3)
                            .fontWeight(.bold)
                        if !flight.arrivalAirportName.isEmpty {
                            Text(flight.arrivalAirportName)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        if let arrTime = flight.scheduledArrivalTime {
                            Text(arrTime.displayTime)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        if !flight.arrivalTerminal.isEmpty {
                            Text("Terminal \(flight.arrivalTerminal)")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
