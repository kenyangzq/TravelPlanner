import SwiftUI
import SwiftData

struct EditEventView: View {
    let event: TripEvent
    let trip: Trip
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                switch event {
                case let flight as FlightEvent:
                    FlightEditFormView(trip: trip, flight: flight)
                case let carRental as CarRentalEvent:
                    CarRentalEditFormView(trip: trip, carRental: carRental)
                case let hotel as HotelEvent:
                    HotelEditFormView(trip: trip, hotel: hotel)
                case let restaurant as RestaurantEvent:
                    RestaurantFormView(trip: trip, existingEvent: restaurant)
                case let activity as ActivityEvent:
                    ActivityEditFormView(trip: trip, activity: activity)
                default:
                    Text("Unknown event type")
                }
            }
            .navigationTitle("Edit \(event.eventTypeName)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Flight Edit Form

struct FlightEditFormView: View {
    let trip: Trip
    @Bindable var flight: FlightEvent
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = FlightSearchViewModel()

    var body: some View {
        Form {
            Section("Flight Info") {
                LabeledContent("Flight Number", value: flight.flightNumber)
                LabeledContent("Airline", value: flight.airlineName)
                LabeledContent("Status", value: flight.flightStatus)
            }

            Section("Notes") {
                TextField("Notes", text: $flight.notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section("Re-fetch Flight Info") {
                Button {
                    Task {
                        viewModel.flightNumber = flight.flightNumber
                        viewModel.flightDate = flight.startDate
                        await viewModel.searchFlight(for: flight)
                    }
                } label: {
                    HStack {
                        Text("Refresh Flight Data")
                        Spacer()
                        if viewModel.isLoading {
                            ProgressView()
                        }
                    }
                }
                .disabled(viewModel.isLoading)
            }

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            Section {
                Button("Save Changes") {
                    try? modelContext.save()
                    dismiss()
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
            }
        }
    }
}

// MARK: - Car Rental Edit Form

struct CarRentalEditFormView: View {
    let trip: Trip
    @Bindable var carRental: CarRentalEvent
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    var body: some View {
        Form {
            Section {
                Toggle("Has Car Rental", isOn: $carRental.hasCarRental)
            }

            if carRental.hasCarRental {
                Section("Rental Details") {
                    TextField("Rental Company", text: $carRental.rentalCompany)
                    TextField("Confirmation Number", text: $carRental.confirmationNumber)
                }

                Section("Pickup") {
                    DatePicker("Pickup Date & Time", selection: $carRental.pickupDate)
                    TextField("Pickup Location", text: $carRental.pickupLocationName)
                }

                Section("Return") {
                    DatePicker("Return Date & Time", selection: $carRental.returnDate, in: carRental.pickupDate...)
                    TextField("Return Location", text: $carRental.returnLocationName)
                }
            }

            Section("Notes") {
                TextField("Notes", text: $carRental.notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save Changes") {
                    Task { await saveChanges() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
            }
        }
    }

    private func saveChanges() async {
        carRental.startDate = carRental.pickupDate
        carRental.endDate = carRental.returnDate
        carRental.title = carRental.hasCarRental ? "Car Rental - \(carRental.rentalCompany)" : "No Car Rental"

        if carRental.hasCarRental {
            await formVM.geocodeCarRentalPickup(carRental)
            await formVM.geocodeCarRentalReturn(carRental)
        }

        try? modelContext.save()
        dismiss()
    }
}

// MARK: - Hotel Edit Form

struct HotelEditFormView: View {
    let trip: Trip
    @Bindable var hotel: HotelEvent
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    var body: some View {
        Form {
            Section("Hotel Details") {
                TextField("Hotel Name", text: $hotel.hotelName)
            }

            Section("Dates") {
                DatePicker("Check-in", selection: $hotel.checkInDate)
                DatePicker("Check-out", selection: $hotel.checkOutDate, in: hotel.checkInDate...)
            }

            Section("Notes") {
                TextField("Notes", text: $hotel.notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save Changes") {
                    Task { await saveChanges() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(hotel.hotelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private func saveChanges() async {
        hotel.title = hotel.hotelName
        hotel.startDate = hotel.checkInDate
        hotel.endDate = hotel.checkOutDate
        hotel.locationName = hotel.hotelName

        await formVM.geocodeHotel(hotel)
        try? modelContext.save()
        dismiss()
    }
}

// MARK: - Activity Edit Form

struct ActivityEditFormView: View {
    let trip: Trip
    @Bindable var activity: ActivityEvent
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()
    @State private var hasEndDate: Bool

    init(trip: Trip, activity: ActivityEvent) {
        self.trip = trip
        self.activity = activity
        _hasEndDate = State(initialValue: activity.startDate != activity.endDate)
    }

    var body: some View {
        Form {
            Section("Activity Details") {
                TextField("Activity Name", text: $activity.title)
                TextField("Description", text: $activity.activityDescription, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section("Date & Time") {
                DatePicker("Start", selection: $activity.startDate)

                Toggle("Has End Time", isOn: $hasEndDate)

                if hasEndDate {
                    DatePicker("End", selection: $activity.endDate, in: activity.startDate...)
                }
            }

            Section("Location") {
                TextField("Location Name or Address", text: $activity.activityLocationName)
            }

            Section("Notes") {
                TextField("Notes", text: $activity.notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save Changes") {
                    Task { await saveChanges() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(activity.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private func saveChanges() async {
        if !hasEndDate {
            activity.endDate = activity.startDate
        }

        if !activity.activityLocationName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            await formVM.geocodeActivity(activity)
        }

        try? modelContext.save()
        dismiss()
    }
}
