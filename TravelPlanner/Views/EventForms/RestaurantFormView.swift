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
                    .onChange(of: restaurantName) { _, _ in
                        formVM.clearSearchState()
                    }

                if !restaurantName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button {
                        Task {
                            await formVM.searchPlace(
                                query: restaurantName.trimmingCharacters(in: .whitespacesAndNewlines),
                                cities: trip.cities
                            )
                        }
                    } label: {
                        HStack {
                            Image(systemName: "location.magnifyingglass")
                            Text("Find Location")
                            Spacer()
                            if formVM.isGeocoding {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(formVM.isGeocoding)
                }

                TextField("Cuisine Type (e.g. Italian, Japanese)", text: $cuisineType)

                Stepper("Party Size: \(partySize)", value: $partySize, in: 1...20)

                TextField("Confirmation Number", text: $confirmationNumber)
            }

            // Search results dropdown
            if !formVM.searchResults.isEmpty && formVM.selectedResult == nil {
                Section("Select Location") {
                    ForEach(formVM.searchResults) { result in
                        Button {
                            formVM.selectSearchResult(result)
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "mappin.circle.fill")
                                    .foregroundStyle(.red)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(result.name)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundStyle(.primary)
                                    Text(result.formattedAddress)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                        }
                    }
                }
            }

            // Selected location confirmation
            if let selected = formVM.selectedResult {
                Section("Selected Location") {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(selected.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(selected.formattedAddress)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    if let url = GoogleMapsService.searchURL(query: selected.formattedAddress) {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Image(systemName: "map")
                                Text("View on Google Maps")
                                    .font(.subheadline)
                            }
                        }
                    }

                    if formVM.searchResults.count > 1 {
                        Button("Change Selection") {
                            formVM.selectedResult = nil
                            formVM.resolvedAddress = nil
                        }
                        .font(.subheadline)
                    }
                }
            }

            if let error = formVM.geocodeError {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.orange)
                        .font(.caption)

                    if let url = GoogleMapsService.searchURL(query: "\(restaurantName) \(trip.destination)") {
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Image(systemName: "map")
                                Text("Search on Google Maps")
                                    .font(.subheadline)
                            }
                        }
                    }
                }
            }

            Section("Reservation") {
                DatePicker("Date & Time", selection: $reservationDate)
                DatePicker("End Time", selection: $endDate, in: reservationDate...)
            }

            Section("Notes") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
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

            if formVM.selectedResult != nil {
                formVM.applyToRestaurant(existing)
            } else if !trimmedName.isEmpty {
                await formVM.geocodeRestaurant(existing, destination: trip.destination)
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

            if formVM.selectedResult != nil {
                formVM.applyToRestaurant(restaurant)
            } else if !trimmedName.isEmpty {
                await formVM.geocodeRestaurant(restaurant, destination: trip.destination)
            }

            restaurant.trip = trip
            modelContext.insert(restaurant)
            try? modelContext.save()
        }
        dismiss()
    }
}
