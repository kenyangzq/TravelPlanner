import Foundation
import SwiftData

@available(iOS 26, *)
@Model
final class RestaurantEvent: TripEvent {
    var restaurantName: String = ""
    var cuisineType: String = ""
    var reservationTime: Date = Date()
    var partySize: Int = 2
    var restaurantAddress: String = ""
    var restaurantLatitude: Double?
    var restaurantLongitude: Double?
    var confirmationNumber: String = ""

    init(
        restaurantName: String,
        reservationTime: Date,
        endTime: Date? = nil,
        cuisineType: String = "",
        partySize: Int = 2,
        address: String = ""
    ) {
        self.restaurantName = restaurantName
        self.cuisineType = cuisineType
        self.reservationTime = reservationTime
        self.partySize = partySize
        self.restaurantAddress = address
        super.init(
            title: restaurantName,
            startDate: reservationTime,
            endDate: endTime ?? Calendar.current.date(byAdding: .hour, value: 2, to: reservationTime) ?? reservationTime,
            locationName: restaurantName
        )
    }

    required init() {
        super.init(title: "Restaurant", startDate: Date(), endDate: Date())
    }

    override var eventIcon: String { "fork.knife" }
    override var eventColor: String { "red" }
    override var eventTypeName: String { "Restaurant" }
}
