import Foundation
import SwiftData

@Model
final class Trip {
    var id: UUID = UUID()
    var name: String = ""
    var startDate: Date = Date()
    var endDate: Date = Date()
    var destination: String = ""
    var citiesRaw: String = ""
    @Relationship(deleteRule: .cascade, inverse: \TripEvent.trip)
    var events: [TripEvent] = []
    var createdAt: Date = Date()

    var cities: [String] {
        get {
            citiesRaw.isEmpty ? [] : citiesRaw.components(separatedBy: "|||").filter { !$0.isEmpty }
        }
        set {
            citiesRaw = newValue.joined(separator: "|||")
        }
    }

    init(name: String, startDate: Date, endDate: Date, destination: String = "", cities: [String] = []) {
        self.id = UUID()
        self.name = name
        self.startDate = startDate
        self.endDate = endDate
        self.destination = destination
        self.citiesRaw = cities.joined(separator: "|||")
        self.events = []
        self.createdAt = Date()
    }

    var sortedEvents: [TripEvent] {
        events.sorted { $0.startDate < $1.startDate }
    }

    var eventsByDay: [(date: Date, events: [TripEvent])] {
        let grouped = Dictionary(grouping: events) { $0.startDate.startOfDay }
        return grouped
            .sorted { $0.key < $1.key }
            .map { (date: $0.key, events: $0.value.sorted { $0.startDate < $1.startDate }) }
    }
}
