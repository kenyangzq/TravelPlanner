import SwiftUI
import SwiftData

struct CarRentalFormView: View {
    let trip: Trip
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var hasCarRental = true
    @State private var rentalCompany = ""
    @State private var confirmationNumber = ""
    @State private var pickupDate: Date
    @State private var returnDate: Date
    @State private var pickupLocation = ""
    @State private var pickupAirportCode = ""
    @State private var returnLocation = ""
    @State private var returnAirportCode = ""
    @State private var useAirportCodeForPickup = false
    @State private var useAirportCodeForReturn = false

    init(trip: Trip) {
        self.trip = trip
        _pickupDate = State(initialValue: trip.startDate)
        _returnDate = State(initialValue: Calendar.current.date(byAdding: .day, value: 3, to: trip.startDate) ?? trip.startDate)
    }

    var body: some View {
        Form {
            Section {
                Toggle("Has Car Rental", isOn: $hasCarRental)
            }

            if hasCarRental {
                Section("Rental Details") {
                    TextField("Rental Company", text: $rentalCompany)
                    TextField("Confirmation Number", text: $confirmationNumber)
                }

                Section("Pickup") {
                    MinuteIntervalDatePicker(title: "Pickup Date & Time", date: $pickupDate)

                    Toggle("Use Airport Code", isOn: $useAirportCodeForPickup)

                    if useAirportCodeForPickup {
                        TextField("Airport Code (e.g. LAX)", text: $pickupAirportCode)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                    } else {
                        TextField("Pickup Location", text: $pickupLocation)
                    }
                }

                Section("Return") {
                    MinuteIntervalDatePickerRange(title: "Return Date & Time", date: $returnDate, bounds: pickupDate...Date.distantFuture)

                    Toggle("Use Airport Code", isOn: $useAirportCodeForReturn)

                    if useAirportCodeForReturn {
                        TextField("Airport Code (e.g. LAX)", text: $returnAirportCode)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                    } else {
                        TextField("Return Location", text: $returnLocation)
                    }
                }

                if formVM.isGeocoding {
                    Section {
                        HStack {
                            ProgressView()
                            Text("Resolving locations...")
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
            }

            Section {
                Button("Add to Itinerary") {
                    Task { await saveCarRental() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(formVM.isGeocoding)
            }
        }
    }

    private func saveCarRental() async {
        let event = CarRentalEvent(
            pickupDate: pickupDate,
            returnDate: returnDate,
            pickupLocation: useAirportCodeForPickup ? pickupAirportCode : pickupLocation,
            returnLocation: useAirportCodeForReturn ? returnAirportCode : returnLocation,
            rentalCompany: rentalCompany,
            hasCarRental: hasCarRental
        )
        event.confirmationNumber = confirmationNumber
        event.pickupAirportCode = useAirportCodeForPickup ? pickupAirportCode : ""
        event.returnAirportCode = useAirportCodeForReturn ? returnAirportCode : ""

        if hasCarRental {
            // Geocode pickup location
            if useAirportCodeForPickup && !pickupAirportCode.isEmpty {
                event.pickupLocationName = "\(pickupAirportCode) Airport"
            }
            if useAirportCodeForReturn && !returnAirportCode.isEmpty {
                event.returnLocationName = "\(returnAirportCode) Airport"
            }

            await formVM.geocodeCarRentalPickup(event)
            await formVM.geocodeCarRentalReturn(event)
        }

        event.trip = trip
        modelContext.insert(event)
        try? modelContext.save()
        dismiss()
    }
}
