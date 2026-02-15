import SwiftUI
import SwiftData

struct AddEventView: View {
    let trip: Trip
    @Environment(\.dismiss) private var dismiss
    @State private var selectedType: TripDetailViewModel.EventType?

    var body: some View {
        NavigationStack {
            Group {
                if let selectedType {
                    formForType(selectedType)
                } else {
                    eventTypePicker
                }
            }
            .navigationTitle(selectedType == nil ? "Add Event" : "New \(selectedType!.rawValue)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if selectedType != nil {
                        Button {
                            withAnimation {
                                selectedType = nil
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left")
                                    .font(.caption)
                                Text("Back")
                            }
                        }
                    } else {
                        Button("Cancel") { dismiss() }
                    }
                }
            }
        }
    }

    private var eventTypePicker: some View {
        List {
            Section {
                ForEach(TripDetailViewModel.EventType.allCases) { type in
                    Button {
                        withAnimation {
                            selectedType = type
                        }
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: type.icon)
                                .font(.title2)
                                .foregroundStyle(colorForType(type))
                                .frame(width: 40)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(type.rawValue)
                                    .font(.body)
                                    .fontWeight(.medium)
                                Text(descriptionForType(type))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(.vertical, 6)
                    }
                    .tint(.primary)
                }
            } header: {
                Text("Choose Event Type")
            }
        }
    }

    @ViewBuilder
    private func formForType(_ type: TripDetailViewModel.EventType) -> some View {
        switch type {
        case .flight:
            FlightFormView(trip: trip)
        case .carRental:
            CarRentalFormView(trip: trip)
        case .hotel:
            HotelFormView(trip: trip)
        case .restaurant:
            RestaurantFormView(trip: trip)
        case .activity:
            ActivityFormView(trip: trip)
        }
    }

    private func colorForType(_ type: TripDetailViewModel.EventType) -> Color {
        switch type {
        case .flight: return .blue
        case .carRental: return .green
        case .hotel: return .purple
        case .restaurant: return .red
        case .activity: return .orange
        }
    }

    private func descriptionForType(_ type: TripDetailViewModel.EventType) -> String {
        switch type {
        case .flight: return "Search by flight number"
        case .carRental: return "Pickup and return details"
        case .hotel: return "Check-in and check-out"
        case .restaurant: return "Reservation details"
        case .activity: return "Tours, sightseeing, etc."
        }
    }
}
