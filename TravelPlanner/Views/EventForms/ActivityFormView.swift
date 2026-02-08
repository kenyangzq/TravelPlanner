import SwiftUI
import SwiftData

struct ActivityFormView: View {
    let trip: Trip
    var existingEvent: ActivityEvent?
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var title: String
    @State private var activityDate: Date
    @State private var endDate: Date
    @State private var hasEndDate: Bool
    @State private var locationName: String
    @State private var description: String

    init(trip: Trip, existingEvent: ActivityEvent? = nil) {
        self.trip = trip
        self.existingEvent = existingEvent
        _title = State(initialValue: existingEvent?.title ?? "")
        _activityDate = State(initialValue: existingEvent?.startDate ?? trip.startDate)
        _endDate = State(initialValue: existingEvent?.endDate ?? trip.startDate)
        _hasEndDate = State(initialValue: existingEvent != nil && existingEvent!.startDate != existingEvent!.endDate)
        _locationName = State(initialValue: existingEvent?.activityLocationName ?? "")
        _description = State(initialValue: existingEvent?.activityDescription ?? "")
    }

    var body: some View {
        Form {
            Section("Activity Details") {
                TextField("Activity Name", text: $title)
                TextField("Description", text: $description, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section("Date & Time") {
                DatePicker("Start", selection: $activityDate)

                Toggle("Has End Time", isOn: $hasEndDate)

                if hasEndDate {
                    DatePicker("End", selection: $endDate, in: activityDate...)
                }
            }

            Section("Location") {
                TextField("Location Name or Address", text: $locationName)
                    .onChange(of: locationName) { _, _ in
                        formVM.clearSearchState()
                    }

                if !locationName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button {
                        Task {
                            await formVM.searchPlace(
                                query: locationName.trimmingCharacters(in: .whitespacesAndNewlines),
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

                    if let url = GoogleMapsService.searchURL(query: "\(locationName) \(trip.destination)") {
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

            Section {
                Button(existingEvent == nil ? "Add to Itinerary" : "Save Changes") {
                    Task { await saveActivity() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || formVM.isGeocoding)
            }
        }
    }

    private func saveActivity() async {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedLocation = locationName.trimmingCharacters(in: .whitespacesAndNewlines)

        if let existing = existingEvent {
            existing.title = trimmedTitle
            existing.startDate = activityDate
            existing.endDate = hasEndDate ? endDate : activityDate
            existing.activityLocationName = trimmedLocation
            existing.activityDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
            existing.locationName = trimmedLocation

            if formVM.selectedResult != nil {
                formVM.applyToActivity(existing)
            } else if !trimmedLocation.isEmpty {
                await formVM.geocodeActivity(existing, destination: trip.destination)
            }
            try? modelContext.save()
        } else {
            let activity = ActivityEvent(
                title: trimmedTitle,
                date: activityDate,
                endDate: hasEndDate ? endDate : nil,
                locationName: trimmedLocation,
                description: description.trimmingCharacters(in: .whitespacesAndNewlines)
            )

            if formVM.selectedResult != nil {
                formVM.applyToActivity(activity)
            } else if !trimmedLocation.isEmpty {
                await formVM.geocodeActivity(activity, destination: trip.destination)
            }

            activity.trip = trip
            modelContext.insert(activity)
            try? modelContext.save()
        }
        dismiss()
    }
}
