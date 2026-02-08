import SwiftUI
import SwiftData

struct RestaurantFormView: View {
    let trip: Trip
    var existingEvent: RestaurantEvent?
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var restaurantName: String
    @State private var cuisineType: String
    @State private var reservationDate: Date
    @State private var endDate: Date
    @State private var partySize: Int
    @State private var confirmationNumber: String
    @State private var notes: String

    init(trip: Trip, existingEvent: RestaurantEvent? = nil) {
        self.trip = trip
        self.existingEvent = existingEvent
        _restaurantName = State(initialValue: existingEvent?.restaurantName ?? "")
        _cuisineType = State(initialValue: existingEvent?.cuisineType ?? "")
        _reservationDate = State(initialValue: existingEvent?.reservationTime ?? trip.startDate)
        _endDate = State(initialValue: existingEvent?.endDate ?? Calendar.current.date(byAdding: .hour, value: 2, to: trip.startDate) ?? trip.startDate)
        _partySize = State(initialValue: existingEvent?.partySize ?? 2)
        _confirmationNumber = State(initialValue: existingEvent?.confirmationNumber ?? "")
        _notes = State(initialValue: existingEvent?.notes ?? "")
    }

    var body: some View {
        Form {
            Section("Restaurant Details") {
                TextField("Restaurant Name", text: $restaurantName)
                TextField("Cuisine Type (e.g. Italian, Japanese)", text: $cuisineType)

                Stepper("Party Size: \(partySize)", value: $partySize, in: 1...20)

                TextField("Confirmation Number", text: $confirmationNumber)
            }

            Section("Reservation") {
                DatePicker("Date & Time", selection: $reservationDate)
                DatePicker("End Time", selection: $endDate, in: reservationDate...)
            }

            Section("Notes") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            if formVM.isGeocoding {
                Section {
                    HStack {
                        ProgressView()
                        Text("Finding restaurant location...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let error = formVM.geocodeError {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            Section {
                Button(existingEvent == nil ? "Add to Itinerary" : "Save Changes") {
                    Task { await saveRestaurant() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(restaurantName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || formVM.isGeocoding)
            }
        }
    }

    private func saveRestaurant() async {
        let trimmedName = restaurantName.trimmingCharacters(in: .whitespacesAndNewlines)

        if let existing = existingEvent {
            existing.restaurantName = trimmedName
            existing.cuisineType = cuisineType.trimmingCharacters(in: .whitespacesAndNewlines)
            existing.reservationTime = reservationDate
            existing.partySize = partySize
            existing.confirmationNumber = confirmationNumber
            existing.title = trimmedName
            existing.startDate = reservationDate
            existing.endDate = endDate
            existing.notes = notes
            existing.locationName = trimmedName

            if !trimmedName.isEmpty {
                await formVM.geocodeRestaurant(existing)
            }
            try? modelContext.save()
        } else {
            let restaurant = RestaurantEvent(
                restaurantName: trimmedName,
                reservationTime: reservationDate,
                endTime: endDate,
                cuisineType: cuisineType.trimmingCharacters(in: .whitespacesAndNewlines),
                partySize: partySize
            )
            restaurant.confirmationNumber = confirmationNumber
            restaurant.notes = notes

            if !trimmedName.isEmpty {
                await formVM.geocodeRestaurant(restaurant)
            }

            restaurant.trip = trip
            modelContext.insert(restaurant)
            try? modelContext.save()
        }
        dismiss()
    }
}
