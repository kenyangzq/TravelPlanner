import SwiftUI
import SwiftData

struct ActivityFormView: View {
    let trip: Trip
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var title = ""
    @State private var activityDate: Date
    @State private var endDate: Date
    @State private var hasEndDate = false
    @State private var locationName = ""
    @State private var description = ""

    init(trip: Trip) {
        self.trip = trip
        _activityDate = State(initialValue: trip.startDate)
        _endDate = State(initialValue: trip.startDate)
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
            }

            if formVM.isGeocoding {
                Section {
                    HStack {
                        ProgressView()
                        Text("Finding location...")
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
                Button("Add to Itinerary") {
                    Task { await saveActivity() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || formVM.isGeocoding)
            }
        }
    }

    private func saveActivity() async {
        let activity = ActivityEvent(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            date: activityDate,
            endDate: hasEndDate ? endDate : nil,
            locationName: locationName.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description.trimmingCharacters(in: .whitespacesAndNewlines)
        )

        // Geocode location if provided
        if !locationName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            await formVM.geocodeActivity(activity)
        }

        activity.trip = trip
        modelContext.insert(activity)
        try? modelContext.save()
        dismiss()
    }
}
