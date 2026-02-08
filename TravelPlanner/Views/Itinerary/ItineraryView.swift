import SwiftUI
import SwiftData

enum ItineraryDisplayMode: String, CaseIterable {
    case list = "List"
    case calendar = "Calendar"

    var icon: String {
        switch self {
        case .list: return "list.bullet"
        case .calendar: return "calendar"
        }
    }
}

struct ItineraryView: View {
    @Bindable var trip: Trip
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel = TripDetailViewModel()
    @State private var displayMode: ItineraryDisplayMode = .list
    @State private var selectedFlightForDetail: FlightEvent?

    var body: some View {
        VStack(spacing: 0) {
            // Display mode picker
            Picker("View", selection: $displayMode) {
                ForEach(ItineraryDisplayMode.allCases, id: \.self) { mode in
                    Label(mode.rawValue, systemImage: mode.icon)
                        .tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            if trip.events.isEmpty {
                ContentUnavailableView(
                    "No Events Yet",
                    systemImage: "calendar.badge.plus",
                    description: Text("Add flights, hotels, car rentals, restaurants, and activities to your itinerary")
                )
            } else {
                switch displayMode {
                case .list:
                    listView
                case .calendar:
                    CalendarItineraryView(trip: trip, viewModel: viewModel, onEditEvent: { event in
                        viewModel.editingEvent = event
                    }, onFlightTap: { flight in
                        selectedFlightForDetail = flight
                    })
                }
            }
        }
        .navigationTitle(trip.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    viewModel.showingAddEvent = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $viewModel.showingAddEvent) {
            AddEventView(trip: trip)
        }
        .sheet(item: $viewModel.editingEvent) { event in
            EditEventView(event: event, trip: trip)
        }
        .navigationDestination(item: $selectedFlightForDetail) { flight in
            FlightDetailView(flight: flight)
        }
    }

    private var listView: some View {
        List {
            let dayGroups = viewModel.eventsByDay(for: trip)
            ForEach(dayGroups, id: \.date) { day in
                ItineraryDaySection(
                    date: day.date,
                    items: day.items,
                    dayHotel: day.dayHotel,
                    onDelete: { event in
                        viewModel.deleteEvent(event, from: modelContext)
                    },
                    onTap: { event in
                        if let flight = event as? FlightEvent {
                            selectedFlightForDetail = flight
                        } else {
                            viewModel.editingEvent = event
                        }
                    }
                )
            }
        }
        .listStyle(.plain)
    }
}
