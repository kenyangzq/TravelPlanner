import SwiftUI

struct FlightDetailView: View {
    let flight: FlightEvent
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                headerSection

                // Flight Route Card
                routeCard

                // Departure Details
                if !flight.departureAirportIATA.isEmpty {
                    airportDetailCard(
                        title: "Departure",
                        airportCode: flight.departureAirportIATA,
                        airportName: flight.departureAirportName,
                        terminal: flight.departureTerminal,
                        gate: flight.departureGate,
                        time: flight.scheduledDepartureTime,
                        lat: flight.departureLatitude,
                        lng: flight.departureLongitude,
                        color: .blue
                    )
                }

                // Arrival Details
                if !flight.arrivalAirportIATA.isEmpty {
                    airportDetailCard(
                        title: "Arrival",
                        airportCode: flight.arrivalAirportIATA,
                        airportName: flight.arrivalAirportName,
                        terminal: flight.arrivalTerminal,
                        gate: flight.arrivalGate,
                        time: flight.scheduledArrivalTime,
                        lat: flight.arrivalLatitude,
                        lng: flight.arrivalLongitude,
                        color: .green
                    )
                }

                // Additional Info
                if flight.lastUpdated != nil || !flight.notes.isEmpty {
                    additionalInfoCard
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Flight Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "airplane")
                    .font(.title)
                    .foregroundStyle(.blue)

                VStack(alignment: .leading, spacing: 2) {
                    Text(flight.flightNumber)
                        .font(.title2)
                        .fontWeight(.bold)

                    if !flight.airlineName.isEmpty {
                        Text(flight.airlineName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if !flight.flightStatus.isEmpty {
                    FlightStatusBadge(status: flight.flightStatus)
                }
            }

            HStack {
                Text(flight.startDate.displayDate)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Route Card

    private var routeCard: some View {
        HStack(spacing: 0) {
            // Departure
            VStack(spacing: 4) {
                Text(flight.departureAirportIATA.isEmpty ? "---" : flight.departureAirportIATA)
                    .font(.title)
                    .fontWeight(.bold)

                if let depTime = flight.scheduledDepartureTime {
                    Text(depTime.displayTime)
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }

                if !flight.departureAirportName.isEmpty {
                    Text(flight.departureAirportName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity)

            // Arrow
            VStack(spacing: 4) {
                Image(systemName: "airplane")
                    .font(.title3)
                    .foregroundStyle(.blue)
                    .rotationEffect(.degrees(0))

                if let depTime = flight.scheduledDepartureTime,
                   let arrTime = flight.scheduledArrivalTime {
                    let duration = arrTime.timeIntervalSince(depTime)
                    let hours = Int(duration) / 3600
                    let minutes = (Int(duration) % 3600) / 60
                    Text(hours > 0 ? "\(hours)h \(minutes)m" : "\(minutes)m")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            // Arrival
            VStack(spacing: 4) {
                Text(flight.arrivalAirportIATA.isEmpty ? "---" : flight.arrivalAirportIATA)
                    .font(.title)
                    .fontWeight(.bold)

                if let arrTime = flight.scheduledArrivalTime {
                    Text(arrTime.displayTime)
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }

                if !flight.arrivalAirportName.isEmpty {
                    Text(flight.arrivalAirportName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Airport Detail Card

    private func airportDetailCard(
        title: String,
        airportCode: String,
        airportName: String,
        terminal: String,
        gate: String,
        time: Date?,
        lat: Double?,
        lng: Double?,
        color: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(color)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(airportCode)
                        .font(.title2)
                        .fontWeight(.bold)
                    if !airportName.isEmpty {
                        Text(airportName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                if let time {
                    detailRow(icon: "clock", label: "Scheduled", value: time.displayDateTime)
                }

                if !terminal.isEmpty {
                    detailRow(icon: "building.2", label: "Terminal", value: terminal)
                }

                if !gate.isEmpty {
                    detailRow(icon: "door.left.hand.open", label: "Gate", value: gate)
                }

                if let lat, let lng {
                    MapLinkButton(label: "\(airportCode) - \(airportName)", lat: lat, lng: lng)
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Additional Info

    private var additionalInfoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Additional Info")
                .font(.headline)

            if let lastUpdated = flight.lastUpdated {
                detailRow(icon: "arrow.clockwise", label: "Last Updated", value: lastUpdated.displayDateTime)
            }

            if !flight.notes.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "note.text")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("Notes")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Text(flight.notes)
                        .font(.subheadline)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Helper

    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 20)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}
