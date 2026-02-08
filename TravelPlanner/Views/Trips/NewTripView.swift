import SwiftUI
import SwiftData

struct NewTripView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var destination = ""
    @State private var dateRange: ClosedRange<Date> = {
        let start = Date()
        let end = Calendar.current.date(byAdding: .day, value: 7, to: start) ?? start
        return start...end
    }()

    var body: some View {
        NavigationStack {
            Form {
                Section("Trip Details") {
                    TextField("Trip Name", text: $name)
                    TextField("Destination", text: $destination)
                }

                Section("Travel Dates") {
                    DatePicker("Start Date", selection: Binding(
                        get: { dateRange.lowerBound },
                        set: { newStart in
                            let end = max(newStart, dateRange.upperBound)
                            dateRange = newStart...end
                        }
                    ), displayedComponents: .date)

                    DatePicker("End Date", selection: Binding(
                        get: { dateRange.upperBound },
                        set: { newEnd in
                            let start = min(dateRange.lowerBound, newEnd)
                            dateRange = start...newEnd
                        }
                    ), in: dateRange.lowerBound..., displayedComponents: .date)
                }
            }
            .navigationTitle("New Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createTrip()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func createTrip() {
        let trip = Trip(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            startDate: dateRange.lowerBound,
            endDate: dateRange.upperBound,
            destination: destination.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        modelContext.insert(trip)
        try? modelContext.save()
        dismiss()
    }
}
