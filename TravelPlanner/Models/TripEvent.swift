import Foundation
import SwiftData

@Model
class TripEvent {
    var id: UUID = UUID()
    var trip: Trip?
    var title: String = ""
    var startDate: Date = Date()
    var endDate: Date = Date()
    var notes: String = ""
    var locationName: String = ""
    var latitude: Double?
    var longitude: Double?
    var sortOrder: Int = 0

    init(
        title: String,
        startDate: Date,
        endDate: Date,
        notes: String = "",
        locationName: String = "",
        latitude: Double? = nil,
        longitude: Double? = nil,
        sortOrder: Int = 0
    ) {
        self.id = UUID()
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.notes = notes
        self.locationName = locationName
        self.latitude = latitude
        self.longitude = longitude
        self.sortOrder = sortOrder
    }

    var eventIcon: String {
        "mappin.circle.fill"
    }

    var eventColor: String {
        "gray"
    }

    var eventTypeName: String {
        "Event"
    }
}
