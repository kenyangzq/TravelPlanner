import SwiftUI
import SwiftData

struct HotelFormView: View {
    let trip: Trip
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @State private var formVM = EventFormViewModel()

    @State private var hotelName = ""
    @State private var checkInDate: Date
    @State private var checkOutDate: Date

    init(trip: Trip) {
        self.trip = trip
        _checkInDate = State(initialValue: trip.startDate)
        _checkOutDate = State(initialValue: Calendar.current.date(byAdding: .day, value: 1, to: trip.startDate) ?? trip.startDate)
    }

    var body: some View {
        Form {
            Section("Hotel Details") {
                TextField("Hotel Name", text: $hotelName)
            }

            Section("Dates") {
                DatePicker("Check-in", selection: $checkInDate)
                DatePicker("Check-out", selection: $checkOutDate, in: checkInDate...)
            }

            if formVM.isGeocoding {
                Section {
                    HStack {
                        ProgressView()
                        Text("Finding hotel location...")
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
                    Task { await saveHotel() }
                }
                .frame(maxWidth: .infinity)
                .fontWeight(.semibold)
                .disabled(hotelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || formVM.isGeocoding)
            }
        }
    }

    private func saveHotel() async {
        let hotel = HotelEvent(
            hotelName: hotelName.trimmingCharacters(in: .whitespacesAndNewlines),
            checkInDate: checkInDate,
            checkOutDate: checkOutDate
        )

        // Geocode hotel location
        await formVM.geocodeHotel(hotel)

        hotel.trip = trip
        modelContext.insert(hotel)
        try? modelContext.save()
        dismiss()
    }
}
