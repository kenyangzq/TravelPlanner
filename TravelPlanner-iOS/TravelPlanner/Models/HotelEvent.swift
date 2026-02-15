import Foundation
import SwiftData

@available(iOS 26, *)
@Model
final class HotelEvent: TripEvent {
    var hotelName: String = ""
    var checkInDate: Date = Date()
    var checkOutDate: Date = Date()
    var hotelLatitude: Double?
    var hotelLongitude: Double?
    var hotelAddress: String = ""
    var confirmationNumber: String = ""

    init(
        hotelName: String,
        checkInDate: Date,
        checkOutDate: Date,
        hotelAddress: String = ""
    ) {
        self.hotelName = hotelName
        self.checkInDate = checkInDate
        self.checkOutDate = checkOutDate
        self.hotelAddress = hotelAddress
        super.init(
            title: hotelName,
            startDate: checkInDate,
            endDate: checkOutDate,
            locationName: hotelName
        )
    }

    required init() {
        super.init(title: "Hotel", startDate: Date(), endDate: Date())
    }

    override var eventIcon: String { "building.2.fill" }
    override var eventColor: String { "purple" }
    override var eventTypeName: String { "Hotel" }
}
