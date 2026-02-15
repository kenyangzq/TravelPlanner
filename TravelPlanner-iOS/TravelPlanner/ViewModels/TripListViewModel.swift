import Foundation
import SwiftData
import SwiftUI

@Observable
final class TripListViewModel {
    var showingNewTrip = false

    func deleteTrips(_ trips: [Trip], from modelContext: ModelContext) {
        for trip in trips {
            modelContext.delete(trip)
        }
        try? modelContext.save()
    }
}
