import Foundation
import SwiftData

@available(iOS 26, *)
@Model
final class ActivityEvent: TripEvent {
    var activityLocationName: String = ""
    var activityLatitude: Double?
    var activityLongitude: Double?
    var activityDescription: String = ""

    init(
        title: String,
        date: Date,
        endDate: Date? = nil,
        locationName: String = "",
        description: String = ""
    ) {
        self.activityLocationName = locationName
        self.activityDescription = description
        super.init(
            title: title,
            startDate: date,
            endDate: endDate ?? date,
            locationName: locationName
        )
    }

    required init() {
        super.init(title: "Activity", startDate: Date(), endDate: Date())
    }

    override var eventIcon: String { "star.fill" }
    override var eventColor: String { "orange" }
    override var eventTypeName: String { "Activity" }
}
