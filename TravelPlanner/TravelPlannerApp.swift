//
//  TravelPlannerApp.swift
//  TravelPlanner
//
//  Created by Ken Yang on 2/7/26.
//

import SwiftUI
import SwiftData

@main
struct TravelPlannerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            Trip.self,
            TripEvent.self,
            FlightEvent.self,
            CarRentalEvent.self,
            HotelEvent.self,
            ActivityEvent.self,
            RestaurantEvent.self
        ])
    }
}
