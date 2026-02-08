import SwiftUI
import SwiftData

struct NewTripView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var destination = ""
    @State private var cities: [String] = []
    @State private var newCity = ""
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

                Section {
                    if !cities.isEmpty {
                        FlowLayout(spacing: 6) {
                            ForEach(cities, id: \.self) { city in
                                CityChip(city: city) {
                                    cities.removeAll { $0 == city }
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    HStack {
                        TextField("Add a city", text: $newCity)
                            .onSubmit { addCity() }
                        Button {
                            addCity()
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(.blue)
                        }
                        .disabled(newCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                } header: {
                    Text("Cities")
                } footer: {
                    Text("Add cities you'll visit. These help find hotels and restaurants.")
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

    private func addCity() {
        let trimmed = newCity.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !cities.contains(trimmed) else { return }
        cities.append(trimmed)
        newCity = ""
    }

    private func createTrip() {
        let trip = Trip(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            startDate: dateRange.lowerBound,
            endDate: dateRange.upperBound,
            destination: destination.trimmingCharacters(in: .whitespacesAndNewlines),
            cities: cities
        )
        modelContext.insert(trip)
        try? modelContext.save()
        dismiss()
    }
}

// MARK: - City Chip

struct CityChip: View {
    let city: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(city)
                .font(.subheadline)
            Button {
                onRemove()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(.blue.opacity(0.12), in: Capsule())
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layoutSubviews(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layoutSubviews(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                proposal: .unspecified
            )
        }
    }

    private func layoutSubviews(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }

        return (CGSize(width: maxX, height: y + rowHeight), positions)
    }
}
