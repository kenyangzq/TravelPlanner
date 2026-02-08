import SwiftUI
import SwiftData

struct HotelFormView: View {
    let trip: Trip
    var existingEvent: HotelEvent?
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var hotelName: String
    @State private var checkInDate: Date
    @State private var checkOutDate: Date
    @State private var notes: String

    init(trip: Trip, existingEvent: HotelEvent? = nil) {
        self.trip = trip
        self.existingEvent = existingEvent
        _hotelName = State(initialValue: existingEvent?.hotelName ?? "")
        _checkInDate = State(initialValue: existingEvent?.checkInDate ?? trip.startDate)
        _checkOutDate = State(initialValue: existingEvent?.checkOutDate ?? Calendar.current.date(byAdding: .day, value: 1, to: trip.startDate) ?? trip.startDate)
        _notes = State(initialValue: existingEvent?.notes ?? "")
    }

    var body: some View {
        Form {
            Section("Hotel Details") {
                TextField("Hotel Name", text: $hotelName)
                    .onChange(of: hotelName) { _, _ in
                        formVM.clearSearchState()
                    }

                if !hotelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button {
                        Task {
                            await formVM.searchPlace(
                                query: hotelName.trimmingCharacters(in: .whitespacesAndNewlines),
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
            }

            // Search results dropdown — show when we have multiple results and none selected
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

                    if let url = GoogleMapsService.searchURL(query: "\(hotelName) \(trip.destination)") {
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

            Section("Dates") {
                DatePicker("Check-in", selection: $checkInDate)
                DatePicker("Check-out", selection: $checkOutDate, in: checkInDate...)
            }

            Section("Notes") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button(existingEvent == nil ? "Add to Itinerary" : "Save Changes") {
                    Task { await saveHotel() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(hotelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || formVM.isGeocoding)
            }
        }
    }

    private func saveHotel() async {
        let trimmedName = hotelName.trimmingCharacters(in: .whitespacesAndNewlines)

        if let existing = existingEvent {
            existing.hotelName = trimmedName
            existing.checkInDate = checkInDate
            existing.checkOutDate = checkOutDate
            existing.title = trimmedName
            existing.startDate = checkInDate
            existing.endDate = checkOutDate
            existing.notes = notes
            existing.locationName = trimmedName

            if formVM.selectedResult != nil {
                formVM.applyToHotel(existing)
            } else if existing.hotelLatitude == nil, !trimmedName.isEmpty {
                // Only geocode if no coordinates exist yet
                await formVM.geocodeHotel(existing, destination: trip.destination)
            }
            try? modelContext.save()
        } else {
            let hotel = HotelEvent(
                hotelName: trimmedName,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate
            )
            hotel.notes = notes

            if formVM.selectedResult != nil {
                formVM.applyToHotel(hotel)
            } else if !trimmedName.isEmpty {
                await formVM.geocodeHotel(hotel, destination: trip.destination)
            }

            hotel.trip = trip
            modelContext.insert(hotel)
            try? modelContext.save()
        }
        dismiss()
    }
}
