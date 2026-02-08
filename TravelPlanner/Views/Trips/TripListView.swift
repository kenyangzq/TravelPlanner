import SwiftUI
import SwiftData

struct TripListView: View {
    @Query(sort: \Trip.startDate, order: .forward) private var trips: [Trip]
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel = TripListViewModel()

    var body: some View {
        List {
            if trips.isEmpty {
                ContentUnavailableView(
                    "No Trips Yet",
                    systemImage: "airplane.departure",
                    description: Text("Tap + to create your first travel itinerary")
                )
                .listRowSeparator(.hidden)
            } else {
                ForEach(trips) { trip in
                    NavigationLink(value: trip) {
                        TripRowView(trip: trip)
                    }
                }
                .onDelete(perform: deleteTrips)
            }
        }
        .navigationTitle("My Trips")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    viewModel.showingNewTrip = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $viewModel.showingNewTrip) {
            NewTripView()
        }
    }

    private func deleteTrips(at offsets: IndexSet) {
        let tripsToDelete = offsets.map { trips[$0] }
        viewModel.deleteTrips(tripsToDelete, from: modelContext)
    }
}
