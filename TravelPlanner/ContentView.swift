//
//  ContentView.swift
//  TravelPlanner
//
//  Created by Ken Yang on 2/7/26.
//

import SwiftUI
import SwiftData

struct ContentView: View {
    var body: some View {
        NavigationStack {
            TripListView()
                .navigationDestination(for: Trip.self) { trip in
                    ItineraryView(trip: trip)
                }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [
            Trip.self,
            TripEvent.self,
            FlightEvent.self,
            CarRentalEvent.self,
            HotelEvent.self,
            ActivityEvent.self,
            RestaurantEvent.self
        ], inMemory: true)
}
