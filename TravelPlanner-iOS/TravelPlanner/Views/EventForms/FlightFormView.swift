import SwiftUI
import SwiftData

struct FlightFormView: View {
    let trip: Trip
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: FlightSearchViewModel
    @State private var flightEvent = FlightEvent(flightNumber: "", date: Date())

    init(trip: Trip) {
        self.trip = trip
        let vm = FlightSearchViewModel()
        vm.flightDate = trip.startDate
        _viewModel = State(initialValue: vm)
    }

    var body: some View {
        Form {
            Section("Flight Search") {
                TextField("Flight Number (e.g. AA1234)", text: $viewModel.flightNumber)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()

                DatePicker("Flight Date", selection: $viewModel.flightDate, displayedComponents: .date)

                Button {
                    Task {
                        flightEvent = FlightEvent(
                            flightNumber: viewModel.flightNumber,
                            date: viewModel.flightDate
                        )
                        await viewModel.searchFlight(for: flightEvent)
                    }
                } label: {
                    HStack {
                        Text("Search Flight")
                        Spacer()
                        if viewModel.isLoading {
                            ProgressView()
                        }
                    }
                }
                .disabled(viewModel.flightNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isLoading)
            }

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            if viewModel.fetchedSuccessfully {
                Section("Flight Details") {
                    LabeledContent("Airline", value: flightEvent.airlineName)
                    LabeledContent("Status", value: flightEvent.flightStatus)
                }

                Section("Departure") {
                    LabeledContent("Airport", value: flightEvent.departureSummary)
                    if let depTime = flightEvent.scheduledDepartureTime {
                        LabeledContent("Time", value: depTime.displayDateTime)
                    }
                    if !flightEvent.departureTerminal.isEmpty {
                        LabeledContent("Terminal", value: flightEvent.departureTerminal)
                    }
                    if !flightEvent.departureGate.isEmpty {
                        LabeledContent("Gate", value: flightEvent.departureGate)
                    }
                }

                Section("Arrival") {
                    LabeledContent("Airport", value: flightEvent.arrivalSummary)
                    if let arrTime = flightEvent.scheduledArrivalTime {
                        LabeledContent("Time", value: arrTime.displayDateTime)
                    }
                    if !flightEvent.arrivalTerminal.isEmpty {
                        LabeledContent("Terminal", value: flightEvent.arrivalTerminal)
                    }
                    if !flightEvent.arrivalGate.isEmpty {
                        LabeledContent("Gate", value: flightEvent.arrivalGate)
                    }
                }

                Section {
                    Button("Add to Itinerary") {
                        saveFlightEvent()
                    }
                    .frame(maxWidth: .infinity)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func saveFlightEvent() {
        flightEvent.trip = trip
        modelContext.insert(flightEvent)
        try? modelContext.save()
        dismiss()
    }
}
