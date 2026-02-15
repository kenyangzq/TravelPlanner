import SwiftUI
import SwiftData

struct RestaurantFormView: View {
    let trip: Trip
    var existingEvent: RestaurantEvent?
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var restaurantName: String
    @State private var reservationDate: Date
    @State private var durationIn15Min: Int // duration in 15-minute increments
    @State private var partySize: Int
    @State private var notes: String

    static let durationOptions: [(label: String, value: Int)] = [
        ("30 min", 2), ("45 min", 3), ("1 hr", 4), ("1 hr 15 min", 5),
        ("1 hr 30 min", 6), ("1 hr 45 min", 7), ("2 hr", 8), ("2 hr 30 min", 10),
        ("3 hr", 12), ("4 hr", 16)
    ]

    init(trip: Trip, existingEvent: RestaurantEvent? = nil) {
        self.trip = trip
        self.existingEvent = existingEvent
        _restaurantName = State(initialValue: existingEvent?.restaurantName ?? "")
        _reservationDate = State(initialValue: existingEvent?.reservationTime ?? trip.startDate)
        let existingDuration: Int
        if let existing = existingEvent {
            let minutes = Int(existing.endDate.timeIntervalSince(existing.startDate) / 60)
            existingDuration = max(2, minutes / 15)
        } else {
            existingDuration = 8 // default 2 hours
        }
        _durationIn15Min = State(initialValue: existingDuration)
        _partySize = State(initialValue: existingEvent?.partySize ?? 2)
        _notes = State(initialValue: existingEvent?.notes ?? "")
    }

    private var endDate: Date {
        Calendar.current.date(byAdding: .minute, value: durationIn15Min * 15, to: reservationDate) ?? reservationDate
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

                Stepper("Party Size: \(partySize)", value: $partySize, in: 1...20)
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
                MinuteIntervalDatePicker(title: "Date & Time", date: $reservationDate)

                Picker("Duration", selection: $durationIn15Min) {
                    ForEach(Self.durationOptions, id: \.value) { option in
                        Text(option.label).tag(option.value)
                    }
                }
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
            existing.reservationTime = reservationDate
            existing.partySize = partySize
            existing.title = trimmedName
            existing.startDate = reservationDate
            existing.endDate = endDate
            existing.notes = notes

            if formVM.selectedResult != nil {
                formVM.applyToRestaurant(existing)
            } else if existing.restaurantLatitude == nil, !trimmedName.isEmpty {
                // Only geocode if no coordinates exist yet
                await formVM.geocodeRestaurant(existing, destination: trip.destination)
            }
            try? modelContext.save()
        } else {
            let restaurant = RestaurantEvent(
                restaurantName: trimmedName,
                reservationTime: reservationDate,
                endTime: endDate,
                partySize: partySize
            )
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
